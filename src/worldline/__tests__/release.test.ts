import { describe, expect, it } from 'vitest';
import { getBuildCommit, WORLDLINE_RELEASE } from '../release';

describe('Worldline release manifest', () => {
  it('identifies the exact public release', () => {
    expect(WORLDLINE_RELEASE.version).toBe('1.0.0');
    expect(WORLDLINE_RELEASE.codename).toBe('Worldline One');
  });

  it('keeps the mandatory provider set free-first', () => {
    expect(WORLDLINE_RELEASE.providerClasses).toEqual(['procedural-worldgen', 'open-earth-maplibre', 'local-new-bedford']);
    expect(WORLDLINE_RELEASE.providerClasses.join(' ').toLowerCase()).not.toContain('google');
    expect(WORLDLINE_RELEASE.providerClasses.join(' ').toLowerCase()).not.toContain('paid');
  });

  it('states an anti-oracular evidence boundary', () => {
    expect(WORLDLINE_RELEASE.evidenceBoundary.toLowerCase()).toContain('not a calibrated forecast');
    expect(WORLDLINE_RELEASE.evidenceBoundary.toLowerCase()).toContain('observed');
    expect(WORLDLINE_RELEASE.evidenceBoundary.toLowerCase()).toContain('simulated');
  });

  it('has a deterministic development fallback when no build SHA is supplied', () => {
    expect(getBuildCommit(undefined)).toBe('development');
    expect(getBuildCommit('abc123')).toBe('abc123');
  });
});