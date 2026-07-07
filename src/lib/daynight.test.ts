import { describe, it, expect } from 'vitest';
import { computeDayNight } from './daynight';

describe('computeDayNight', () => {
  it('puts the sun high and bright at noon', () => {
    const noon = computeDayNight(0.5);
    expect(noon.sunPosition[1]).toBeGreaterThan(50);
    expect(noon.sunIntensity).toBeGreaterThan(1.5);
    expect(noon.starsVisible).toBe(false);
  });

  it('dims the sun and shows stars at midnight', () => {
    const midnight = computeDayNight(0);
    expect(midnight.sunIntensity).toBeLessThan(0.3);
    expect(midnight.starsVisible).toBe(true);
    expect(midnight.moonIntensity).toBeGreaterThan(midnight.sunIntensity);
  });

  it('keeps all light intensities non-negative across the full cycle', () => {
    for (let t = 0; t < 1; t += 0.05) {
      const s = computeDayNight(t);
      expect(s.sunIntensity).toBeGreaterThanOrEqual(0);
      expect(s.ambientIntensity).toBeGreaterThanOrEqual(0);
      expect(s.hemiIntensity).toBeGreaterThanOrEqual(0);
    }
  });
});
