import { describe, it, expect } from 'vitest';
import { pixelToCell, cellToPixel } from './minimap';

describe('minimap projection', () => {
  it('maps canvas pixels to grid cells', () => {
    expect(pixelToCell(0, 0, 160, 160, 192, 192)).toEqual({ x: 0, y: 0 });
    expect(pixelToCell(80, 80, 160, 160, 192, 192)).toEqual({ x: 96, y: 96 });
  });

  it('clamps out-of-bounds pixels to valid cells', () => {
    expect(pixelToCell(-5, -5, 160, 160, 64, 64)).toEqual({ x: 0, y: 0 });
    expect(pixelToCell(999, 999, 160, 160, 64, 64)).toEqual({ x: 63, y: 63 });
  });

  it('cellToPixel returns the cell center', () => {
    const { px, py } = cellToPixel(0, 0, 160, 160, 160, 160);
    expect(px).toBeCloseTo(0.5);
    expect(py).toBeCloseTo(0.5);
  });

  it('round-trips a cell through pixel space', () => {
    const gw = 100, gh = 100, cw = 200, ch = 200;
    for (const [x, y] of [[0, 0], [50, 50], [99, 99], [17, 83]]) {
      const { px, py } = cellToPixel(x, y, cw, ch, gw, gh);
      expect(pixelToCell(px, py, cw, ch, gw, gh)).toEqual({ x, y });
    }
  });
});
