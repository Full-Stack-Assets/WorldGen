import { describe, expect, it } from 'vitest';
import { WORLD_CATALOG } from '../fixtures';

describe('Cosmos v0.7', () => {
  it('separates observed celestial identity from generated rendered surfaces', () => {
    for (const id of ['moon', 'mars', 'venus', 'europa', 'titan']) {
      const world = WORLD_CATALOG.find((item) => item.id === id);
      expect(world?.epistemicClass).toBe('OBSERVED');
      expect(world?.surfaceEpistemicClass).toBe('GENERATED');
      expect(world?.planetary?.surfaceRenderingClass).toBe('GENERATED');
      expect(world?.planetary?.terrainSourceStatus).toBeTruthy();
    }
  });

  it('contains the six named Earth/Solar-System proving worlds plus the generated world', () => {
    const ids = WORLD_CATALOG.map((world) => world.id);
    expect(ids).toEqual(expect.arrayContaining(['worldgen-prime', 'new-bedford-001', 'moon', 'mars', 'venus', 'europa', 'titan']));
  });

  it('represents Asterion as three explicit speculative variants in one family', () => {
    const variants = WORLD_CATALOG.filter((world) => world.familyId === 'asterion-family');
    expect(variants.map((world) => world.variantId)).toEqual(['thin', 'temperate', 'dense']);
    expect(variants.every((world) => world.epistemicClass === 'SPECULATIVE')).toBe(true);
    expect(variants.every((world) => world.surfaceEpistemicClass === 'SPECULATIVE')).toBe(true);
  });
});
