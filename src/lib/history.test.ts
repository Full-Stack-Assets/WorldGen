import { describe, it, expect, beforeEach } from 'vitest';
import { recordWorld, getHistory, clearHistory } from './history';
import { DEFAULT_CONFIG, type WorldConfig } from '../types/world';

function cfg(seed: number): WorldConfig {
  return { ...DEFAULT_CONFIG, seed };
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
});
