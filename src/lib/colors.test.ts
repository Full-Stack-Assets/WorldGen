import { describe, it, expect } from 'vitest';
import { BIOME_COLORS, BIOME_LABELS, biomeColor } from './colors';
import type { Biome } from '../types/world';

const ALL_BIOMES: Biome[] = [
  'deepOcean', 'ocean', 'beach', 'grassland', 'forest', 'jungle', 'desert',
  'savanna', 'tundra', 'snow', 'mountain', 'volcanic', 'swamp', 'river', 'lake',
];

describe('biome color tables', () => {
  it('defines a color and label for all 15 biomes', () => {
    for (const biome of ALL_BIOMES) {
      expect(BIOME_COLORS[biome]).toHaveLength(3);
      expect(typeof BIOME_LABELS[biome]).toBe('string');
      expect(BIOME_LABELS[biome].length).toBeGreaterThan(0);
    }
  });

  it('biomeColor returns three clamped 8-bit channels', () => {
    for (const biome of ALL_BIOMES) {
      for (const elevation of [0, 0.5, 1]) {
        const [r, g, b] = biomeColor(biome, elevation);
        for (const c of [r, g, b]) {
          expect(Number.isInteger(c)).toBe(true);
          expect(c).toBeGreaterThanOrEqual(0);
          expect(c).toBeLessThanOrEqual(255);
        }
      }
    }
  });
});
