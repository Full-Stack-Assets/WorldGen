import { describe, it, expect } from 'vitest';
import { createRng, createNoise, fbm } from './noise';

describe('createRng', () => {
  it('is deterministic per seed', () => {
    const a = createRng(7);
    const b = createRng(7);
    const seqA = Array.from({ length: 20 }, () => a());
    const seqB = Array.from({ length: 20 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('returns values in [0, 1)', () => {
    const rng = createRng(99);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('differs across seeds', () => {
    expect(createRng(1)()).not.toBe(createRng(2)());
  });
});

describe('noise + fbm', () => {
  it('produces deterministic noise per seed', () => {
    const n1 = createNoise(5);
    const n2 = createNoise(5);
    expect(n1.noise(1.5, 2.5)).toBe(n2.noise(1.5, 2.5));
  });

  it('keeps fbm output within [-1, 1]', () => {
    const noise = createNoise(3);
    for (let x = 0; x < 10; x += 0.7) {
      for (let y = 0; y < 10; y += 0.7) {
        const v = fbm(noise, x, y, 6, 0.5, 2.0);
        expect(v).toBeGreaterThanOrEqual(-1);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});
