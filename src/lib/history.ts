import type { WorldConfig } from '../types/world';
import { seedToString } from './worldgen';

export interface HistoryEntry {
  seed: number;
  seedString: string;
  scale: number;
  seaLevel: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
  moistureScale: number;
  temperatureScale: number;
  width: number;
  height: number;
  savedAt: number;
}

const STORAGE_KEY = 'worldgen_history';
const MAX_ENTRIES = 12;
const EMPTY: HistoryEntry[] = [];

function normalizeEntry(raw: Partial<HistoryEntry> & { seed: number }): HistoryEntry | null {
  if (!Number.isFinite(raw.seed)) return null;
  const width = Number.isFinite(raw.width) ? Number(raw.width) : 192;
  const height = Number.isFinite(raw.height) ? Number(raw.height) : width;
  return {
    seed: raw.seed,
    seedString: raw.seedString ?? seedToString(raw.seed),
    scale: Number.isFinite(raw.scale) ? Number(raw.scale) : 80,
    seaLevel: Number.isFinite(raw.seaLevel) ? Number(raw.seaLevel) : 0.38,
    octaves: Number.isFinite(raw.octaves) ? Number(raw.octaves) : 6,
    persistence: Number.isFinite(raw.persistence) ? Number(raw.persistence) : 0.5,
    lacunarity: Number.isFinite(raw.lacunarity) ? Number(raw.lacunarity) : 2,
    moistureScale: Number.isFinite(raw.moistureScale) ? Number(raw.moistureScale) : 60,
    temperatureScale: Number.isFinite(raw.temperatureScale) ? Number(raw.temperatureScale) : 70,
    width,
    height,
    savedAt: Number.isFinite(raw.savedAt) ? Number(raw.savedAt) : Date.now(),
  };
}

function readStorage(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed
      .map((entry) => normalizeEntry(entry as Partial<HistoryEntry> & { seed: number }))
      .filter((entry): entry is HistoryEntry => entry !== null);
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

export function historyEntryToConfig(entry: HistoryEntry): Partial<WorldConfig> {
  return {
    seed: entry.seed,
    scale: entry.scale,
    seaLevel: entry.seaLevel,
    octaves: entry.octaves,
    persistence: entry.persistence,
    lacunarity: entry.lacunarity,
    moistureScale: entry.moistureScale,
    temperatureScale: entry.temperatureScale,
    width: entry.width,
    height: entry.height,
  };
}

// Records a generated world, most-recent first, deduped by seed and capped.
export function recordWorld(config: WorldConfig, now: number = Date.now()): HistoryEntry[] {
  const entry: HistoryEntry = {
    seed: config.seed,
    seedString: seedToString(config.seed),
    scale: config.scale,
    seaLevel: config.seaLevel,
    octaves: config.octaves,
    persistence: config.persistence,
    lacunarity: config.lacunarity,
    moistureScale: config.moistureScale,
    temperatureScale: config.temperatureScale,
    width: config.width,
    height: config.height,
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
