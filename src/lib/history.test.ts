import { describe, it, expect, beforeEach } from 'vitest';
import { recordWorld, getHistory, clearHistory, historyEntryToConfig } from './history';
import { DEFAULT_CONFIG, type WorldConfig } from '../types/world';

function cfg(seed: number, extra: Partial<WorldConfig> = {}): WorldConfig {
  return { ...DEFAULT_CONFIG, seed, ...extra };
}

beforeEach(() => {
  localStorage.clear();
  clearHistory();
});

describe('world history', () => {
  it('records most-recent first', () => {
    recordWorld(cfg(1), 1000);
    recordWorld(cfg(2), 2000);
    expect(getHistory().map((e) => e.seed)).toEqual([2, 1]);
  });

  it('dedupes by seed, moving a repeat to the front', () => {
    recordWorld(cfg(1), 1000);
    recordWorld(cfg(2), 2000);
    recordWorld(cfg(1), 3000);
    expect(getHistory().map((e) => e.seed)).toEqual([1, 2]);
    expect(getHistory()[0].savedAt).toBe(3000);
  });

  it('caps the history at 12 entries', () => {
    for (let i = 0; i < 20; i++) recordWorld(cfg(i), i);
    expect(getHistory()).toHaveLength(12);
    expect(getHistory()[0].seed).toBe(19);
  });

  it('persists across a reload (localStorage)', () => {
    recordWorld(cfg(42), 5000);
    expect(JSON.parse(localStorage.getItem('worldgen_history')!)[0].seed).toBe(42);
  });

  it('clearHistory empties the store', () => {
    recordWorld(cfg(1), 1000);
    clearHistory();
    expect(getHistory()).toHaveLength(0);
  });

  it('returns a stable snapshot reference between reads', () => {
    recordWorld(cfg(1), 1000);
    expect(getHistory()).toBe(getHistory());
  });

  it('stores and restores the full terrain and climate config', () => {
    const world = cfg(77, {
      scale: 91,
      seaLevel: 0.33,
      octaves: 4,
      persistence: 0.61,
      lacunarity: 2.4,
      moistureScale: 41,
      temperatureScale: 88,
      width: 128,
      height: 128,
    });
    recordWorld(world, 9000);
    const restored = historyEntryToConfig(getHistory()[0]);
    expect(restored).toMatchObject({
      seed: 77,
      scale: 91,
      seaLevel: 0.33,
      octaves: 4,
      persistence: 0.61,
      lacunarity: 2.4,
      moistureScale: 41,
      temperatureScale: 88,
      width: 128,
      height: 128,
    });
  });

  it('stores climate fields with defaults from the current config', () => {
    recordWorld(cfg(3), 2);
    expect(getHistory()[0].persistence).toBe(DEFAULT_CONFIG.persistence);
    expect(getHistory()[0].moistureScale).toBe(DEFAULT_CONFIG.moistureScale);
  });
});
