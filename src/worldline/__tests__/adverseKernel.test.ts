import { describe, expect, it } from 'vitest';
import { admitTransition, type AdmissionDependencies } from '../kernel/admission';
import { hashCanonical } from '../kernel/hash';
import { createRenderEnvelope } from '../kernel/projection';
import { createGenesisRevision, createRevisionStore } from '../kernel/revisionStore';
import { computeMechanismHash } from '../kernel/transitionIr';
import type { CanonicalWorldState, TransitionMechanismArtifact, TransitionProposal } from '../kernel/types';

function stateFixture(): CanonicalWorldState {
  return {
    schema: 'worldline-canonical-state-v1',
    worlds: [{ id: 'w1', name: 'World', kind: 'GENERATED', epistemicClass: 'GENERATED', fidelity: 'FIELD', provider: 'test', description: 'fixture' }],
    branches: { root: { id: 'root', label: 'Root', parentId: null, forkYear: 2026, seed: 1, snapshots: [{ id: 's', worldId: 'w1', branchId: 'root', year: 2026, metrics: { x: 1 }, eventIds: [], commitment: 'c' }], events: [] } },
  };
}

function setup() {
  const state = stateFixture();
  const store = createRevisionStore();
  const genesis = createGenesisRevision({ worldId: 'w1', branchId: 'root', simulationTime: 2026, state, epistemicClass: 'GENERATED', kernelVersion: '1.0.0' });
  store.putRevision(genesis.revision, state);
  return { state, store, genesis };
}

function mechanism(overrides: Partial<Omit<TransitionMechanismArtifact, 'mechanismHash'>> = {}): TransitionMechanismArtifact {
  const base: Omit<TransitionMechanismArtifact, 'mechanismHash'> = {
    schema: 'worldline-transition-mechanism-v1', mechanismId: 'm', producerId: 'author', sourceType: 'HUMAN_AUTHORED', executorKind: 'TRANSITION_IR_V1',
    stateSchema: 'worldline-canonical-state-v1', inputSchema: 'input-v1',
    readSet: ['/branches/root/snapshots/0/metrics/x'], writeSet: ['/branches/root/snapshots/0/metrics/x'],
    epistemicCeiling: 'SIMULATED', deterministicSeedPolicy: 'FORBIDDEN', invariantSuiteIds: ['core'], riskClass: 'LOW', executionPolicy: 'AUTO_LOW_RISK',
    promotionStatus: 'APPROVED_EXECUTABLE', approvalReceiptId: 'approval:claimed',
    ir: { version: '1', operations: [{ op: 'INCREMENT', path: '/branches/root/snapshots/0/metrics/x', value: 1 }] },
    ...overrides,
  };
  return { ...base, mechanismHash: computeMechanismHash(base) };
}

function proposal(baseRevisionId: string, mechanismId = 'm'): TransitionProposal {
  return { schema: 'worldline-transition-proposal-v1', proposalId: 'p', baseRevisionId, mechanismId, normalizedInputs: {}, inputHash: hashCanonical({}), seed: null, producerId: 'runner', causalClaims: [] };
}

function deps(store: ReturnType<typeof createRevisionStore>, extra: Partial<AdmissionDependencies> = {}): AdmissionDependencies {
  return {
    store, kernelVersion: '1.0.0', verifierId: 'verifier', verifierConfigDigest: 'sha256:verifier',
    verifyMechanismApproval: () => true,
    now: () => '2026-08-27T13:00:00Z',
    ...extra,
  };
}

describe('causal kernel adverse cases', () => {
  it('does not trust an approval claim without a configured authority verifier', () => {
    const { store, genesis } = setup();
    const receipt = admitTransition({ store, kernelVersion: '1.0.0', verifierId: 'v', verifierConfigDigest: 'sha256:v' }, {
      mechanism: mechanism(), proposal: proposal(genesis.revision.revisionId),
    });
    expect(receipt.core.decision).toBe('REJECTED');
    expect(receipt.core.gates.at(-1)?.gate).toBe('mechanism-authority');
  });

  it('does not treat a human-approval reference string as proof by itself', () => {
    const { store, genesis } = setup();
    const m = mechanism({ executionPolicy: 'HUMAN_EACH_EXECUTION' });
    const receipt = admitTransition(deps(store), {
      mechanism: m, proposal: proposal(genesis.revision.revisionId), humanApprovalReference: 'unverified-reference',
    });
    expect(receipt.core.decision).toBe('HUMAN_REQUIRED');
    expect(receipt.acceptedRevisionId).toBeNull();
  });

  it('rejects independent replay divergence', () => {
    const { store, genesis } = setup();
    const receipt = admitTransition(deps(store, {
      replayTransition: (before) => ({ ...structuredClone(before), worlds: [] }),
    }), { mechanism: mechanism(), proposal: proposal(genesis.revision.revisionId) });
    expect(receipt.core.decision).toBe('REJECTED');
    expect(receipt.core.gates.at(-1)?.gate).toBe('replay-verification');
  });

  it('rejects missing and stale base revisions', () => {
    const first = setup();
    expect(admitTransition(deps(first.store), { mechanism: mechanism(), proposal: proposal('revision:missing') }).core.decision).toBe('REJECTED');

    const m = mechanism();
    const accepted = admitTransition(deps(first.store), { mechanism: m, proposal: proposal(first.genesis.revision.revisionId) });
    expect(accepted.core.decision).toBe('ACCEPTED');
    const stale = admitTransition(deps(first.store), { mechanism: m, proposal: proposal(first.genesis.revision.revisionId) });
    expect(stale.core.decision).toBe('REJECTED');
    expect(stale.core.gates.at(-1)?.gate).toBe('branch-head-freshness');
  });

  it('rejects proposal substitution, bad input hash, and mechanism tampering', () => {
    const a = setup();
    expect(admitTransition(deps(a.store), { mechanism: mechanism(), proposal: proposal(a.genesis.revision.revisionId, 'other') }).core.decision).toBe('REJECTED');

    const b = setup();
    const badInput = proposal(b.genesis.revision.revisionId);
    badInput.inputHash = 'sha256:not-the-input';
    expect(admitTransition(deps(b.store), { mechanism: mechanism(), proposal: badInput }).core.decision).toBe('REJECTED');

    const c = setup();
    const tampered = mechanism();
    tampered.ir.operations = [{ op: 'INCREMENT', path: '/branches/root/snapshots/0/metrics/x', value: 100 }];
    expect(admitTransition(deps(c.store), { mechanism: tampered, proposal: proposal(c.genesis.revision.revisionId) }).core.decision).toBe('REJECTED');
  });

  it('rejects undeclared writes, unsafe pointer writes, and unapproved mechanisms', () => {
    const a = setup();
    const undeclared = mechanism({ writeSet: ['/worlds'] });
    expect(admitTransition(deps(a.store), { mechanism: undeclared, proposal: proposal(a.genesis.revision.revisionId) }).core.decision).toBe('REJECTED');

    const b = setup();
    const unsafe = mechanism({
      readSet: [], writeSet: [''],
      ir: { version: '1', operations: [{ op: 'SET', path: '/__proto__/polluted', value: true }] },
    });
    expect(admitTransition(deps(b.store), { mechanism: unsafe, proposal: proposal(b.genesis.revision.revisionId) }).core.decision).toBe('REJECTED');
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();

    const c = setup();
    const candidate = mechanism({ promotionStatus: 'CANDIDATE', approvalReceiptId: null });
    expect(admitTransition(deps(c.store), { mechanism: candidate, proposal: proposal(c.genesis.revision.revisionId) }).core.decision).toBe('REJECTED');
  });

  it('keeps observed/reconstructed promotion outside the generic transition path', () => {
    const { store, genesis } = setup();
    const observed = mechanism({ epistemicCeiling: 'OBSERVED' });
    const receipt = admitTransition(deps(store), { mechanism: observed, proposal: proposal(genesis.revision.revisionId) });
    expect(receipt.core.decision).toBe('HUMAN_REQUIRED');
    expect(receipt.acceptedRevisionId).toBeNull();
    expect(store.getBranchHead('w1', 'root')?.revisionId).toBe(genesis.revision.revisionId);
  });

  it('prevents mutation of a renderer projection from changing canonical state', () => {
    const { state, genesis } = setup();
    const envelope = createRenderEnvelope({ revision: genesis.revision, state, renderingIntent: 'overview', rendererPolicy: 'readonly' });
    const projection = envelope.projection as { worlds: Array<{ name: string }> };
    expect(Reflect.set(projection.worlds[0], 'name', 'Changed')).toBe(false);
    expect(state.worlds[0].name).toBe('World');
  });
});
