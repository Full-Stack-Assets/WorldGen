import { describe, it, expect } from 'vitest';
import { computeWorldStats } from './stats';
import { generateWorld } from './worldgen';
import { DEFAULT_CONFIG } from '../types/world';

describe('computeWorldStats', () => {
  const world = generateWorld({ ...DEFAULT_CONFIG, seed: 777, width: 48, height: 48 });
  const stats = computeWorldStats(world);

  it('land and ocean percentages sum to ~100', () => {
    expect(stats.landPercent + stats.oceanPercent).toBeCloseTo(100, 5);
  });

  it('biome counts cover every cell', () => {
    const total = Object.values(stats.biomeCounts).reduce((a, b) => a + b, 0);
    expect(total).toBe(48 * 48);
  });

  it('reports feature counts consistent with the world', () => {
    expect(stats.riverTiles).toBe(world.rivers.length);
    expect(stats.lakeTiles).toBe(world.lakes.length);
    expect(stats.settlementCount).toBe(world.settlements.length);
  });

  it('keeps averages normalized', () => {
    expect(stats.avgTemperature).toBeGreaterThanOrEqual(0);
    expect(stats.avgTemperature).toBeLessThanOrEqual(1);
    expect(stats.avgMoisture).toBeGreaterThanOrEqual(0);
    expect(stats.avgMoisture).toBeLessThanOrEqual(1);
  });
});
