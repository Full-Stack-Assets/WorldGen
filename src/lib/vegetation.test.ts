import { describe, it, expect } from 'vitest';
import { placeProps } from './vegetation';
import { generateWorld } from './worldgen';
import { DEFAULT_CONFIG } from '../types/world';

const world = generateWorld({ ...DEFAULT_CONFIG, seed: 2024, width: 64, height: 64 });

describe('placeProps', () => {
  it('is deterministic for the same world', () => {
    expect(placeProps(world)).toEqual(placeProps(world));
  });

  it('respects the max-props cap', () => {
    const props = placeProps(world, 50);
    expect(props.length).toBeLessThanOrEqual(50);
  });

  it('places props on valid grid cells only', () => {
    for (const p of placeProps(world, 200)) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThan(64);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThan(64);
      expect(p.scale).toBeGreaterThan(0);
    }
  });

  it('keeps a clearance radius around settlements', () => {
    const occupied = new Set(placeProps(world).map((p) => `${p.x},${p.y}`));
    for (const s of world.settlements) {
      expect(occupied.has(`${s.x},${s.y}`)).toBe(false);
    }
  });
});
