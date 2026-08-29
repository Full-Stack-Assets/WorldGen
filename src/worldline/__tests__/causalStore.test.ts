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
    await store.putGenesis(revision, state);
    state.worlds.push({ id: 'external-mutation' } as never);
    expect(store.getStateByHash(revision.stateHash)).toEqual({ worlds: [], branches: {} });
    expect(store.getBranchHead('root')?.revisionId).toBe(revision.revisionId);
  });

  it('rejects state bytes that do not match the declared revision hash', async () => {
    const store = createInMemoryCanonicalStore();
    const state = { worlds: [], branches: {} };
    const revision = await createGenesisRevision({
      worldId: 'worldgen-prime', branchId: 'root', simulationTime: 2026,
      stateSchema: 'worldline-state-v1', epistemicClass: 'GENERATED', kernelVersion: 'causal-kernel-v1', state,
    });
    await expect(store.putGenesis(revision, { worlds: [{ id: 'tampered' }], branches: {} }))
      .rejects.toThrow('State hash mismatch');
  });

  it('rejects a revision whose content-addressed identity was altered', async () => {
    const store = createInMemoryCanonicalStore();
    const state = { worlds: [], branches: {} };
    const revision = await createGenesisRevision({
      worldId: 'worldgen-prime', branchId: 'root', simulationTime: 2026,
      stateSchema: 'worldline-state-v1', epistemicClass: 'GENERATED', kernelVersion: 'causal-kernel-v1', state,
    });
    await expect(store.putGenesis({ ...revision, revisionId: 'revision:bad' }, state))
      .rejects.toThrow('Revision identity mismatch');
  });
});
