import { describe, it, expect } from 'vitest';
import { generateWorld, parseSeed, seedToString, stringToSeed, randomSeed } from './worldgen';
import { DEFAULT_CONFIG, type WorldConfig } from '../types/world';

function smallConfig(overrides: Partial<WorldConfig> = {}): WorldConfig {
  return { ...DEFAULT_CONFIG, seed: 12345, width: 32, height: 32, ...overrides };
}

describe('seed round-tripping', () => {
  it('round-trips base36 seed strings', () => {
    for (const seed of [0, 1, 42, 1000, 2147483646]) {
      expect(parseSeed(seedToString(seed))).toBe(seed);
    }
  });

  it('interprets bare seed strings as base36 (the display format)', () => {
    // '12345' is valid base36 and round-trips, so it is read as base36, not decimal.
    expect(parseSeed('12345')).toBe(parseInt('12345', 36));
    expect(seedToString(parseSeed('12345'))).toBe('12345');
  });

  it('falls back to a stable hash for non-base36 text', () => {
    expect(parseSeed('Middle Earth!')).toBe(stringToSeed('Middle Earth!'));
  });

  it('hashes arbitrary text deterministically', () => {
    expect(stringToSeed('Middle-earth')).toBe(stringToSeed('Middle-earth'));
    expect(stringToSeed('a')).not.toBe(stringToSeed('b'));
  });

  it('produces in-range random seeds', () => {
    for (let i = 0; i < 100; i++) {
      const s = randomSeed();
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThan(2147483647);
    }
  });
});

describe('generateWorld', () => {
  it('is fully deterministic for the same seed + config', () => {
    const a = generateWorld(smallConfig());
    const b = generateWorld(smallConfig());
    expect(a).toEqual(b);
  });

  it('produces different worlds for different seeds', () => {
    const a = generateWorld(smallConfig({ seed: 1 }));
    const b = generateWorld(smallConfig({ seed: 2 }));
    expect(a.cells).not.toEqual(b.cells);
  });

  it('respects the configured grid dimensions', () => {
    const world = generateWorld(smallConfig({ width: 40, height: 24 }));
    expect(world.cells).toHaveLength(24);
    expect(world.cells[0]).toHaveLength(40);
  });

  it('keeps settlements within grid bounds and off water', () => {
    const world = generateWorld(smallConfig({ width: 64, height: 64 }));
    for (const s of world.settlements) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThan(64);
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeLessThan(64);
      expect(['ocean', 'deepOcean']).not.toContain(s.biome);
      expect(s.population).toBeGreaterThan(0);
    }
  });

  it('assigns every cell a valid biome and normalized fields', () => {
    const world = generateWorld(smallConfig());
    for (const row of world.cells) {
      for (const cell of row) {
        expect(cell.elevation).toBeGreaterThanOrEqual(0);
        expect(cell.elevation).toBeLessThanOrEqual(1);
        expect(cell.moisture).toBeGreaterThanOrEqual(0);
        expect(cell.moisture).toBeLessThanOrEqual(1);
        expect(typeof cell.biome).toBe('string');
      }
    }
  });
});
