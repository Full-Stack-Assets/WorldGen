import { describe, expect, it } from 'vitest';
import { describeTimeMode, nextPlaybackYear, timeVolumeSamples } from '../timeEngine';

describe('time engine', () => {
  it('advances playback years and wraps at the horizon', () => {
    expect(nextPlaybackYear(2026)).toBe(2027);
    expect(nextPlaybackYear(2046)).toBe(2026);
  });

  it('builds a committed-past speculative-future volume around the selected year', () => {
    const samples = timeVolumeSamples(2030, 2);
    expect(samples.map((sample) => sample.year)).toEqual([2028, 2029, 2030, 2031, 2032]);
    expect(samples.find((sample) => sample.year === 2029)?.committed).toBe(true);
    expect(samples.find((sample) => sample.year === 2031)?.committed).toBe(false);
    expect(samples.find((sample) => sample.offset === 0)?.weight).toBe(1);
  });

  it('describes time modes without probability claims', () => {
    expect(describeTimeMode('VOLUME')).toMatch(/speculative/i);
    expect(describeTimeMode('PLAYBACK')).not.toMatch(/probability/i);
  });
});
