import { describe, expect, it } from 'vitest';
import { getBuildCommit, WORLDLINE_RELEASE } from '../release';

describe('Worldline release manifest', () => {
  it('identifies the exact Worldline Studio public release', () => {
    expect(WORLDLINE_RELEASE.version).toBe('2.0.0');
    expect(WORLDLINE_RELEASE.codename).toBe('Worldline Studio');
  });

  it('declares the v2 project, experiment, and Worldpack schemas', () => {
    expect(WORLDLINE_RELEASE.projectSchema).toBe('worldline-project-v2');
    expect(WORLDLINE_RELEASE.experimentSchema).toBe('worldline-experiment-v2');
    expect(WORLDLINE_RELEASE.worldpackSchema).toBe('worldline-worldpack-v2');
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
