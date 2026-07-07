import { describe, it, expect } from 'vitest';
import { deriveWeather } from './weather';
import type { WorldStats } from '../types/world';

function stats(overrides: Partial<WorldStats>): WorldStats {
  return {
    landPercent: 50, oceanPercent: 50, biomeCounts: {} as WorldStats['biomeCounts'],
    dominantBiome: 'grassland', peakElevation: 1, avgTemperature: 0.5, avgMoisture: 0.5,
    riverTiles: 0, lakeTiles: 0, settlementCount: 0, ...overrides,
  };
}

describe('deriveWeather', () => {
  it('snows in cold climates', () => {
    expect(deriveWeather(stats({ avgTemperature: 0.2 }))).toBe('snow');
  });

  it('rains in warm, wet climates', () => {
    expect(deriveWeather(stats({ avgTemperature: 0.6, avgMoisture: 0.7 }))).toBe('rain');
  });

  it('is clear in warm, dry climates', () => {
    expect(deriveWeather(stats({ avgTemperature: 0.6, avgMoisture: 0.3 }))).toBe('clear');
  });

  it('prioritizes snow over rain when both cold and wet', () => {
    expect(deriveWeather(stats({ avgTemperature: 0.1, avgMoisture: 0.9 }))).toBe('snow');
  });
});
