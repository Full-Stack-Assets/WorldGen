import { describe, expect, it } from 'vitest';
import { createChronosGameplayState } from '../chronosGameplay';
import { createProviderRegistry, resolveSurfaceProvider } from '../providers';
import { createResearchLedger } from '../researchLedger';
import { WORLDLINE_RELEASE } from '../release';
import { createInitialWorldlineState, replayBranch } from '../state';

describe('Worldline 1.0 zero-credential smoke contract', () => {
  it('boots into the generated FIELD world without provider credentials', () => {
    const state = createInitialWorldlineState();
    expect(state.activeWorld.id).toBe('worldgen-prime');
    expect(state.activeWorld.epistemicClass).toBe('GENERATED');
    expect(state.activeWorld.fidelity).toBe('FIELD');
  });

  it('resolves the procedural surface when network Earth is unavailable', () => {
    const registry = createProviderRegistry({ networkAvailable: false, requested: 'open-earth-maplibre' });
    expect(resolveSurfaceProvider(registry, 'open-earth-maplibre').id).toBe('procedural-worldgen');
  });

  it('requires no paid provider in the release manifest', () => {
    expect(WORLDLINE_RELEASE.providerClasses).toEqual(expect.arrayContaining(['procedural-worldgen']));
    expect(WORLDLINE_RELEASE.providerClasses.join('|')).not.toMatch(/google|cesium|paid/i);
  });

  it('retains deterministic branch replay without a backend', () => {
    const state = createInitialWorldlineState();
    expect(replayBranch(state, state.activeBranchId)).toEqual(replayBranch(state, state.activeBranchId));
  });

  it('initializes research and Chronos locally', () => {
    expect(createResearchLedger().entries).toEqual([]);
    expect(createChronosGameplayState().samples).toHaveLength(1);
  });
});