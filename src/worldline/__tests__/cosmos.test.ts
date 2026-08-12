import { describe, expect, it } from 'vitest';
import { WORLD_CATALOG } from '../fixtures';

describe('Cosmos v0.2', () => {
  it('does not treat generated Mars surface as observed geometry', () => {
    const mars = WORLD_CATALOG.find((world) => world.id === 'mars');
    expect(mars?.epistemicClass).toBe('OBSERVED');
    expect(mars?.surfaceEpistemicClass).toBe('GENERATED');
  });

  it('keeps exoworld family speculative', () => {
    const exoworld = WORLD_CATALOG.find((world) => world.id === 'exoworld-a');
    expect(exoworld?.epistemicClass).toBe('SPECULATIVE');
    expect(exoworld?.planetary?.surfacePressure).toBe('Model-family dependent');
  });
});
