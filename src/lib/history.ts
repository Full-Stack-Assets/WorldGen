import type { WorldConfig } from '../types/world';
import { seedToString } from './worldgen';

export interface HistoryEntry {
  seed: number;
  seedString: string;
  scale: number;
  seaLevel: number;
  octaves: number;
  width: number;
  savedAt: number;
}

const STORAGE_KEY = 'worldgen_history';
const MAX_ENTRIES = 12;
const EMPTY: HistoryEntry[] = [];

function readStorage(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : EMPTY;
  } catch {
    return EMPTY;
  }
}

// Module-level cache so useSyncExternalStore gets a stable snapshot reference
// (returning a fresh array each read would loop forever).
let cache: HistoryEntry[] = readStorage();
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Storage full or unavailable (private mode) — history is best-effort.
  }
}

export function getHistory(): HistoryEntry[] {
  return cache;
}

// Records a generated world, most-recent first, deduped by seed and capped.
export function recordWorld(config: WorldConfig, now: number = Date.now()): HistoryEntry[] {
  const entry: HistoryEntry = {
    seed: config.seed,
    seedString: seedToString(config.seed),
    scale: config.scale,
    seaLevel: config.seaLevel,
    octaves: config.octaves,
    width: config.width,
    savedAt: now,
  };
  cache = [entry, ...cache.filter((e) => e.seed !== entry.seed)].slice(0, MAX_ENTRIES);
  persist();
  emit();
  return cache;
}

export function clearHistory(): void {
  cache = EMPTY;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  emit();
}

export function subscribeHistory(callback: () => void): () => void {
  listeners.add(callback);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cache = readStorage();
      callback();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', onStorage);
  };
}
