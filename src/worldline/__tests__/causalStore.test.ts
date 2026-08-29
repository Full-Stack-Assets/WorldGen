import { describe, expect, it } from 'vitest';
import { createGenesisRevision, createInMemoryCanonicalStore } from '../causal/store';

describe('canonical store', () => {
  it('stores immutable genesis state by content hash', async () => {
    const store = createInMemoryCanonicalStore();
    const state = { worlds: [], branches: {} };
    const revision = await createGenesisRevision({
      worldId: 'worldgen-prime', branchId: 'root', simulationTime: 2026,
      stateSchema: 'worldline-state-v1', epistemicClass: 'GENERATED', kernelVersion: 'causal-kernel-v1', state,
    });
    store.putGenesis(revision, state);
    state.worlds.push({ id: 'external-mutation' } as never);
    expect(store.getStateByHash(revision.stateHash)).toEqual({ worlds: [], branches: {} });
    expect(store.getBranchHead('root')?.revisionId).toBe(revision.revisionId);
  });

  it('rejects children whose parent revision is missing', async () => {
    const store = createInMemoryCanonicalStore();
    const state = { worlds: [], branches: {} };
    const genesis = await createGenesisRevision({
      worldId: 'worldgen-prime', branchId: 'root', simulationTime: 2026,
      stateSchema: 'worldline-state-v1', epistemicClass: 'GENERATED', kernelVersion: 'causal-kernel-v1', state,
    });
    store.putGenesis(genesis, state);
    expect(() => store.appendRevision({
      ...genesis,
      revisionId: 'revision:bad',
      parentRevisionId: 'revision:missing',
      sequence: 1,
    }, state)).toThrow('Missing parent revision');
  });
});
