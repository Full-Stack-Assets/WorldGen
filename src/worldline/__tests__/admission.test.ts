import { describe, expect, it } from 'vitest';
import { admitTransition } from '../kernel/admission';
import { hashCanonical } from '../kernel/hash';
import { createGenesisRevision, createRevisionStore } from '../kernel/revisionStore';
import { computeMechanismHash } from '../kernel/transitionIr';
import type { CanonicalWorldState, TransitionMechanismArtifact, TransitionProposal } from '../kernel/types';

function stateFixture(): CanonicalWorldState {
  return {
    schema: 'worldline-canonical-state-v1',
    worlds: [{ id: 'w1', name: 'World', kind: 'GENERATED', epistemicClass: 'GENERATED', fidelity: 'FIELD', provider: 'test', description: 'fixture' }],
    branches: { root: { id: 'root', label: 'Root', parentId: null, forkYear: 2026, seed: 1, snapshots: [{ id: 's1', worldId: 'w1', branchId: 'root', year: 2026, metrics: { energy: 10 }, eventIds: [], commitment: 'fixture' }], events: [] } },
  };
}

function mechanism(id: string, executionPolicy: TransitionMechanismArtifact['executionPolicy'] = 'AUTO_LOW_RISK'): TransitionMechanismArtifact {
  const base: Omit<TransitionMechanismArtifact, 'mechanismHash'> = {
    schema: 'worldline-transition-mechanism-v1', mechanismId: id, producerId: 'producer:author', sourceType: 'HUMAN_AUTHORED', executorKind: 'TRANSITION_IR_V1',
    stateSchema: 'worldline-canonical-state-v1', inputSchema: 'input-v1',
    readSet: ['/branches/root/snapshots/0/metrics/energy'], writeSet: ['/branches/root/snapshots/0/metrics/energy'],
    epistemicCeiling: 'SIMULATED', deterministicSeedPolicy: 'FORBIDDEN', invariantSuiteIds: ['core'], riskClass: 'LOW', executionPolicy,
    promotionStatus: 'APPROVED_EXECUTABLE', approvalReceiptId: 'approval:mechanism',
    ir: { version: '1', operations: [{ op: 'INCREMENT', path: '/branches/root/snapshots/0/metrics/energy', value: 2 }] },
  };
  return { ...base, mechanismHash: computeMechanismHash(base) };
}

function proposal(baseRevisionId: string, mechanismId: string): TransitionProposal {
  return { schema: 'worldline-transition-proposal-v1', proposalId: `proposal:${mechanismId}`, baseRevisionId, mechanismId, normalizedInputs: {}, inputHash: hashCanonical({}), seed: null, producerId: 'producer:runner', causalClaims: [] };
}

function deps(store: ReturnType<typeof createRevisionStore>) {
  return {
    store, kernelVersion: '1.0.0', verifierId: 'verifier:test', verifierConfigDigest: 'sha256:verifier' as const,
    verifyMechanismApproval: () => true,
    verifyExecutionApproval: () => true,
    now: () => '2026-08-27T12:30:00Z',
  };
}

describe('transition admission', () => {
  it('appends a deterministic low-risk child revision', () => {
    const state = stateFixture();
    const store = createRevisionStore();
    const genesis = createGenesisRevision({ worldId: 'w1', branchId: 'root', simulationTime: 2026, state, epistemicClass: 'GENERATED', kernelVersion: '1.0.0' });
    store.putRevision(genesis.revision, state);
    const m = mechanism('m:auto');
    const receipt = admitTransition(deps(store), { mechanism: m, proposal: proposal(genesis.revision.revisionId, m.mechanismId), simulationTime: 2030 });
    expect(receipt.core.decision).toBe('ACCEPTED');
    expect(receipt.core.candidateStateHash).toBe(receipt.core.replayStateHash);
    const accepted = store.getRevision(receipt.acceptedRevisionId!);
    expect(accepted?.state.branches.root.snapshots[0].metrics.energy).toBe(12);
    expect(accepted?.revision.epistemicClass).toBe('SIMULATED');
  });

  it('keeps human-gated execution outside canonical truth without an approval', () => {
    const state = stateFixture();
    const store = createRevisionStore();
    const genesis = createGenesisRevision({ worldId: 'w1', branchId: 'root', simulationTime: 2026, state, epistemicClass: 'GENERATED', kernelVersion: '1.0.0' });
    store.putRevision(genesis.revision, state);
    const m = mechanism('m:human', 'HUMAN_EACH_EXECUTION');
    const receipt = admitTransition(deps(store), { mechanism: m, proposal: proposal(genesis.revision.revisionId, m.mechanismId), simulationTime: 2030 });
    expect(receipt.core.decision).toBe('HUMAN_REQUIRED');
    expect(receipt.acceptedRevisionId).toBeNull();
    expect(store.getBranchHead('w1', 'root')?.revisionId).toBe(genesis.revision.revisionId);
  });

  it('admits a human-gated execution when the configured verifier accepts the reference', () => {
    const state = stateFixture();
    const store = createRevisionStore();
    const genesis = createGenesisRevision({ worldId: 'w1', branchId: 'root', simulationTime: 2026, state, epistemicClass: 'GENERATED', kernelVersion: '1.0.0' });
    store.putRevision(genesis.revision, state);
    const m = mechanism('m:human-approved', 'HUMAN_EACH_EXECUTION');
    const receipt = admitTransition(deps(store), { mechanism: m, proposal: proposal(genesis.revision.revisionId, m.mechanismId), simulationTime: 2030, humanApprovalReference: 'approval:execution:1' });
    expect(receipt.core.decision).toBe('ACCEPTED');
    expect(receipt.acceptedRevisionId).not.toBeNull();
  });
});
