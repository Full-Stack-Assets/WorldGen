import { describe, expect, it } from 'vitest';
import { generateWorld } from './worldgen';
import { DEFAULT_CONFIG } from '../types/world';
import { paintBiome, placeNamedSettlement } from './worldEdit';

const world = generateWorld({ ...DEFAULT_CONFIG, seed: 42, width: 32, height: 32 });

describe('generated world editor', () => {
  it('paints biomes without mutating the original world', () => {
    const original = world.cells[8][8].biome;
    const painted = paintBiome(world, 8, 8, 'volcanic', 1);
    expect(world.cells[8][8].biome).toBe(original);
    expect(painted.cells[8][8].biome).toBe('volcanic');
    expect(painted.cells[8][9].biome).toBe('volcanic');
  });

  it('places a named settlement at a grid cell', () => {
    const next = placeNamedSettlement(world, 4, 5, 'Hearthmere', 'town');
    expect(world.settlements.some((item) => item.name === 'Hearthmere')).toBe(false);
    const placed = next.settlements.find((item) => item.x === 4 && item.y === 5);
    expect(placed?.name).toBe('Hearthmere');
    expect(placed?.type).toBe('town');
  });

  it('keeps river and lake feature lists aligned with painted cells', () => {
    const painted = paintBiome(world, 3, 3, 'river', 0);
    expect(painted.cells[3][3].isRiver).toBe(true);
    expect(painted.rivers).toEqual(
      expect.arrayContaining([{ x: 3, y: 3 }]),
    );
    const cleared = paintBiome(painted, 3, 3, 'grassland', 0);
    expect(cleared.cells[3][3].isRiver).toBe(false);
    expect(cleared.rivers.some((point) => point.x === 3 && point.y === 3)).toBe(false);
  });
});
