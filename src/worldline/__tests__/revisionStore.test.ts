import { describe, expect, it } from 'vitest';
import { hashCanonical } from '../kernel/hash';
import {
  computeRevisionId,
  createGenesisRevision,
  createRevisionStore,
} from '../kernel/revisionStore';
import type { CanonicalRevision, CanonicalWorldState } from '../kernel/types';

const emptyState = (): CanonicalWorldState => ({
  schema: 'worldline-canonical-state-v1',
  worlds: [],
  branches: {},
});

describe('append-only canonical revision store', () => {
  it('creates deterministic genesis revisions and tracks branch heads', () => {
    const state = emptyState();
    const genesis = createGenesisRevision({
      worldId: 'w1',
      branchId: 'root',
      simulationTime: 2026,
      state,
      epistemicClass: 'GENERATED',
      kernelVersion: '1.0.0',
    });
    expect(genesis.stateHash).toBe(hashCanonical(state));
    expect(genesis.revision.revisionId).toBe(computeRevisionId(genesis.revision));

    const store = createRevisionStore();
    store.putRevision(genesis.revision, state);
    expect(store.getBranchHead('w1', 'root')?.revisionId).toBe(genesis.revision.revisionId);
  });

  it('does not expose stored truth by mutable reference', () => {
    const state = emptyState();
    const genesis = createGenesisRevision({
      worldId: 'w1', branchId: 'root', simulationTime: 2026, state,
      epistemicClass: 'GENERATED', kernelVersion: '1.0.0',
    });
    const store = createRevisionStore();
    store.putRevision(genesis.revision, state);
    const read = store.getRevision(genesis.revision.revisionId)!;
    read.state.worlds.push({ id: 'mutated' } as never);
    expect(store.getRevision(genesis.revision.revisionId)?.state.worlds).toHaveLength(0);
  });

  it('rejects duplicate revisions and state-hash tampering', () => {
    const state = emptyState();
    const genesis = createGenesisRevision({
      worldId: 'w1', branchId: 'root', simulationTime: 2026, state,
      epistemicClass: 'GENERATED', kernelVersion: '1.0.0',
    });
    const store = createRevisionStore();
    store.putRevision(genesis.revision, state);
    expect(() => store.putRevision(genesis.revision, state)).toThrow(/append-only/i);

    const tamperedState: CanonicalWorldState = { ...state, worlds: [{ id: 'bad' } as never] };
    const tamperedRevision: CanonicalRevision = { ...genesis.revision, revisionId: 'revision:tampered' };
    expect(() => store.putRevision(tamperedRevision, tamperedState)).toThrow(/state hash/i);
  });

  it('permits a child branch from an admitted parent revision', () => {
    const state = emptyState();
    const genesis = createGenesisRevision({
      worldId: 'w1', branchId: 'root', simulationTime: 2026, state,
      epistemicClass: 'GENERATED', kernelVersion: '1.0.0',
    });
    const store = createRevisionStore();
    store.putRevision(genesis.revision, state);

    const childState: CanonicalWorldState = {
      schema: 'worldline-canonical-state-v1',
      worlds: [],
      branches: { child: { id: 'child', label: 'Child', parentId: 'root', forkYear: 2026, seed: 2, snapshots: [], events: [] } },
    };
    const core: Omit<CanonicalRevision, 'revisionId'> = {
      schema: 'worldline-canonical-revision-v1',
      parentRevisionId: genesis.revision.revisionId,
      worldId: 'w1',
      branchId: 'child',
      sequence: 1,
      simulationTime: 2026,
      stateSchema: childState.schema,
      stateHash: hashCanonical(childState),
      transitionReceiptCoreHash: 'sha256:receipt',
      epistemicClass: 'GENERATED',
      kernelVersion: '1.0.0',
    };
    const child: CanonicalRevision = { ...core, revisionId: computeRevisionId(core) };
    store.putRevision(child, childState);
    expect(store.getBranchHead('w1', 'child')?.revisionId).toBe(child.revisionId);
  });
});
