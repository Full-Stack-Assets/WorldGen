import { describe, it, expect } from 'vitest';
import { BIOME_CODEX, getBiomeEntry } from './biomeCodex';

describe('biome codex', () => {
  it('has fully populated entries', () => {
    for (const entry of BIOME_CODEX) {
      expect(entry.label.length).toBeGreaterThan(0);
      expect(entry.description.length).toBeGreaterThan(0);
      expect(entry.climate.length).toBeGreaterThan(0);
      expect(entry.inhabitants.length).toBeGreaterThan(0);
      expect(entry.resources.length).toBeGreaterThan(0);
      expect(entry.danger.length).toBeGreaterThan(0);
    }
  });

  it('has unique biome keys', () => {
    const keys = BIOME_CODEX.map((e) => e.biome);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('looks up land biomes and returns undefined for water', () => {
    expect(getBiomeEntry('forest')?.biome).toBe('forest');
    expect(getBiomeEntry('ocean')).toBeUndefined();
  });
});
