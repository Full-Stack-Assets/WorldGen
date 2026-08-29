import { describe, expect, it } from 'vitest';
import { createRenderProjection, verifyRenderProjectionIsolation } from '../causal/renderProjection';
import { createGenesisRevision } from '../causal/store';
import { createInitialCanonicalWorldState } from '../state';

describe('read-only RenderProjection', () => {
  it('projects the same canonical state through multiple providers without changing truth', async () => {
    const state = createInitialCanonicalWorldState();
    const revision = await createGenesisRevision({
      worldId: state.worlds[0].id, branchId: 'branch-root', simulationTime: 2026, stateSchema: 'worldline-state-v1',
      epistemicClass: state.worlds[0].epistemicClass, kernelVersion: 'causal-kernel-v1', state,
    });
    const before = structuredClone(state);
    const [three, neural] = await Promise.all([
      createRenderProjection({ revision, state, providerId: 'three-r3f', projectionSpecId: 'spatial-v1' }),
      createRenderProjection({ revision, state, providerId: 'neural-reference', projectionSpecId: 'spatial-v1' }),
    ]);
    expect(three.sourceStateHash).toBe(neural.sourceStateHash);
    expect(three.projectionDigest).not.toBe(neural.projectionDigest);
    expect(three.authority).toBe('READ_ONLY');
    expect(Object.isFrozen(three)).toBe(true);
    await expect(verifyRenderProjectionIsolation({ revision, stateBefore: before, stateAfter: state, projection: three })).resolves.toBe(true);
  });
});
