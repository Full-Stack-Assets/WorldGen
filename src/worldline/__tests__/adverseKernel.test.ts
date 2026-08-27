import { describe, expect, it } from 'vitest';
import { admitTransition, type AdmissionDependencies } from '../kernel/admission';
import { hashCanonical } from '../kernel/hash';
import { createRenderEnvelope } from '../kernel/projection';
import { createGenesisRevision, createRevisionStore } from '../kernel/revisionStore';
import { computeMechanismHash } from '../kernel/transitionIr';
import type { CanonicalWorldState, TransitionMechanismArtifact, TransitionProposal } from '../kernel/types';

function stateFixture(): CanonicalWorldState {
  return { schema: 'worldline-canonical-state-v1', worlds: [{ id: 'w1', name: 'World', kind: 'GENERATED', epistemicClass: 'GENERATED', fidelity: 'FIELD', provider: 'test', description: 'fixture' }], branches: { root: { id: 'root', label: 'Root', parentId: null, forkYear: 2026, seed: 1, snapshots: [{ id: 's', worldId: 'w1', branchId: 'root', year: 2026, metrics: { x: 1 }, eventIds: [], commitment: 'c' }], events: [] } } };
}
function setup() { const state = stateFixture(); const store = createRevisionStore(); const genesis = createGenesisRevision({ worldId: 'w1', branchId: 'root', simulationTime: 2026, state, epistemicClass: 'GENERATED', kernelVersion: '1.0.0' }); store.putRevision(genesis.revision, state); return { state, store, genesis }; }
function mechanism(overrides: Partial<Omit<TransitionMechanismArtifact, 'mechanismHash'>> = {}): TransitionMechanismArtifact {
  const base: Omit<TransitionMechanismArtifact, 'mechanismHash'> = { schema: 'worldline-transition-mechanism-v1', mechanismId: 'm', producerId: 'producer:author', sourceType: 'HUMAN_AUTHORED', executorKind: 'TRANSITION_IR_V1', stateSchema: 'worldline-canonical-state-v1', inputSchema: 'input-v1', readSet: ['/branches/root/snapshots/0/metrics/x'], writeSet: ['/branches/root/snapshots/0/metrics/x'], epistemicCeiling: 'SIMULATED', deterministicSeedPolicy: 'FORBIDDEN', invariantSuiteIds: ['core'], riskClass: 'LOW', executionPolicy: 'AUTO_LOW_RISK', promotionStatus: 'APPROVED_EXECUTABLE', approvalReceiptId: 'approval:mechanism', ir: { version: '1', operations: [{ op: 'INCREMENT', path: '/branches/root/snapshots/0/metrics/x', value: 1 }] }, ...overrides };
  return { ...base, mechanismHash: computeMechanismHash(base) };
}
function proposal(baseRevisionId: string, mechanismId = 'm'): TransitionProposal { return { schema: 'worldline-transition-proposal-v1', proposalId: 'p', baseRevisionId, mechanismId, normalizedInputs: {}, inputHash: hashCanonical({}), seed: null, producerId: 'producer:runner', causalClaims: [] }; }
function deps(store: ReturnType<typeof createRevisionStore>, extra: Partial<AdmissionDependencies> = {}): AdmissionDependencies { return { store, kernelVersion: '1.0.0', verifierId: 'verifier', verifierConfigDigest: 'sha256:verifier', verifyMechanismApproval: () => true, verifyProducerIdentity: () => true, verifyVerifierIndependence: ({ producerId, verifierId }) => producerId !== verifierId, now: () => '2026-08-27T13:00:00Z', ...extra }; }

describe('causal kernel adverse cases', () => {
  it('does not trust approval claims without trusted verifiers', () => {
    const { store, genesis } = setup();
    const noMechanismAuthority = admitTransition({ ...deps(store), verifyMechanismApproval: undefined }, { mechanism: mechanism(), proposal: proposal(genesis.revision.revisionId) });
    expect(noMechanismAuthority.core.decision).toBe('REJECTED'); expect(noMechanismAuthority.core.gates.at(-1)?.gate).toBe('mechanism-authority');
    const human = mechanism({ executionPolicy: 'HUMAN_EACH_EXECUTION' });
    const noExecutionAuthority = admitTransition(deps(store), { mechanism: human, proposal: proposal(genesis.revision.revisionId), humanApprovalReference: 'unverified' });
    expect(noExecutionAuthority.core.decision).toBe('HUMAN_REQUIRED'); expect(noExecutionAuthority.acceptedRevisionId).toBeNull();
  });

  it('rejects unsupported kernel, missing producer resolution, and non-independent verifier', () => {
    const a = setup(); expect(admitTransition(deps(a.store, { kernelVersion: '2.0.0' }), { mechanism: mechanism(), proposal: proposal(a.genesis.revision.revisionId) }).core.gates.at(-1)?.gate).toBe('kernel-version');
    const b = setup(); expect(admitTransition(deps(b.store, { verifyProducerIdentity: undefined }), { mechanism: mechanism(), proposal: proposal(b.genesis.revision.revisionId) }).core.gates.at(-1)?.gate).toBe('producer-identity');
    const c = setup(); expect(admitTransition(deps(c.store, { verifierId: 'producer:runner' }), { mechanism: mechanism(), proposal: proposal(c.genesis.revision.revisionId) }).core.gates.at(-1)?.gate).toBe('verifier-independence');
  });

  it('rejects replay divergence, stale bases, proposal/input/mechanism tampering, and bad causal references', () => {
    const a = setup(); expect(admitTransition(deps(a.store, { replayTransition: (before) => ({ ...structuredClone(before), worlds: [] }) }), { mechanism: mechanism(), proposal: proposal(a.genesis.revision.revisionId) }).core.gates.at(-1)?.gate).toBe('replay-verification');
    const b = setup(); const m = mechanism(); expect(admitTransition(deps(b.store), { mechanism: m, proposal: proposal('revision:missing') }).core.decision).toBe('REJECTED');
    expect(admitTransition(deps(b.store), { mechanism: m, proposal: proposal(b.genesis.revision.revisionId) }).core.decision).toBe('ACCEPTED');
    expect(admitTransition(deps(b.store), { mechanism: m, proposal: proposal(b.genesis.revision.revisionId) }).core.gates.at(-1)?.gate).toBe('branch-head-freshness');
    const c = setup(); expect(admitTransition(deps(c.store), { mechanism: mechanism(), proposal: proposal(c.genesis.revision.revisionId, 'other') }).core.decision).toBe('REJECTED');
    const d = setup(); const badInput = proposal(d.genesis.revision.revisionId); badInput.inputHash = 'sha256:bad'; expect(admitTransition(deps(d.store), { mechanism: mechanism(), proposal: badInput }).core.decision).toBe('REJECTED');
    const e = setup(); const tampered = mechanism(); tampered.ir.operations = [{ op: 'INCREMENT', path: '/branches/root/snapshots/0/metrics/x', value: 100 }]; expect(admitTransition(deps(e.store), { mechanism: tampered, proposal: proposal(e.genesis.revision.revisionId) }).core.gates.at(-1)?.gate).toBe('mechanism-integrity');
    const f = setup(); const badCause = proposal(f.genesis.revision.revisionId); badCause.causalClaims = [{ type: '', ref: 'x' }]; expect(admitTransition(deps(f.store), { mechanism: mechanism(), proposal: badCause }).core.gates.at(-1)?.gate).toBe('causal-references');
  });

  it('rejects undeclared/unsafe writes, unapproved mechanisms, and epistemic uplift', () => {
    const a = setup(); expect(admitTransition(deps(a.store), { mechanism: mechanism({ writeSet: ['/worlds'] }), proposal: proposal(a.genesis.revision.revisionId) }).core.decision).toBe('REJECTED');
    const b = setup(); const unsafe = mechanism({ readSet: [], writeSet: [''], ir: { version: '1', operations: [{ op: 'SET', path: '/__proto__/polluted', value: true }] } }); expect(admitTransition(deps(b.store), { mechanism: unsafe, proposal: proposal(b.genesis.revision.revisionId) }).core.decision).toBe('REJECTED'); expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    const c = setup(); expect(admitTransition(deps(c.store), { mechanism: mechanism({ promotionStatus: 'CANDIDATE', approvalReceiptId: null }), proposal: proposal(c.genesis.revision.revisionId) }).core.decision).toBe('REJECTED');
    const d = setup(); const observed = mechanism({ epistemicCeiling: 'OBSERVED' }); const receipt = admitTransition(deps(d.store), { mechanism: observed, proposal: proposal(d.genesis.revision.revisionId) }); expect(receipt.core.decision).toBe('HUMAN_REQUIRED'); expect(receipt.acceptedRevisionId).toBeNull();
  });

  it('prevents renderer projection mutation from changing canonical state', () => {
    const { state, genesis } = setup(); const envelope = createRenderEnvelope({ revision: genesis.revision, state, renderingIntent: 'overview', rendererPolicy: 'readonly' });
    const projection = envelope.projection as { worlds: Array<{ name: string }> }; expect(Reflect.set(projection.worlds[0], 'name', 'Changed')).toBe(false); expect(state.worlds[0].name).toBe('World');
  });
});
