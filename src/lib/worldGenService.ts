import type { WorldConfig, WorldData } from '../types/world';
import { generateWorld } from './worldgen';

// Async gateway to world generation. Prefers a Web Worker (keeps the main
// thread responsive); transparently falls back to synchronous generation if
// workers are unavailable or error out, so callers get a Promise<WorldData>
// that always resolves. Determinism is unchanged — the worker runs the same
// pure generateWorld.

interface Pending {
  resolve: (world: WorldData) => void;
  config: WorldConfig;
}

let worker: Worker | null = null;
let workerBroken = false;
let nextId = 1;
const pending = new Map<number, Pending>();

function resolveSync(entry: Pending): void {
  // Defer so a heavy sync generation doesn't run inside the caller's stack.
  Promise.resolve().then(() => entry.resolve(generateWorld(entry.config)));
}

function drainToSyncFallback(): void {
  for (const [id, entry] of pending) {
    pending.delete(id);
    resolveSync(entry);
  }
}

function ensureWorker(): Worker | null {
  if (workerBroken) return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL('./worldgen.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<{ id: number; world: WorldData }>) => {
      const entry = pending.get(event.data.id);
      if (entry) {
        pending.delete(event.data.id);
        entry.resolve(event.data.world);
      }
    };
    worker.onerror = () => {
      workerBroken = true;
      worker?.terminate();
      worker = null;
      drainToSyncFallback();
    };
    return worker;
  } catch {
    workerBroken = true;
    return null;
  }
}

export function generateWorldAsync(config: WorldConfig): Promise<WorldData> {
  return new Promise((resolve) => {
    const entry: Pending = { resolve, config };
    const activeWorker = ensureWorker();
    if (!activeWorker) {
      resolveSync(entry);
      return;
    }
    const id = nextId++;
    pending.set(id, entry);
    try {
      activeWorker.postMessage({ id, config });
    } catch {
      pending.delete(id);
      resolveSync(entry);
    }
  });
}
