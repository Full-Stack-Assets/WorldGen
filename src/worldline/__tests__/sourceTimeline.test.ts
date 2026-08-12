import { describe, expect, it } from 'vitest';
import { getSourceTimelineForWorld, nearestSourceSnapshot } from '../sourceTimeline';

describe('Worldline source timeline', () => {
  it('returns the packaged New Bedford source history', () => {
    const entries = getSourceTimelineForWorld('new-bedford-001');
    expect(entries.map((entry) => entry.year)).toEqual([2023, 2025, 2026]);
    expect(entries[0].epistemicClass).toBe('OBSERVED');
    expect(entries[2].epistemicClass).toBe('RECONSTRUCTED');
  });

  it('selects the nearest source snapshot without inventing an observation', () => {
    const entries = getSourceTimelineForWorld('new-bedford-001');
    const nearest = nearestSourceSnapshot(entries, 2024);
    expect(nearest?.entry.year).toBe(2023);
    expect(nearest?.exact).toBe(false);
    expect(nearest?.distanceYears).toBe(1);
  });

  it('returns no source timeline for a generated world', () => {
    expect(getSourceTimelineForWorld('worldgen-prime')).toEqual([]);
  });
});