import { describe, expect, it } from 'vitest';
import { admitTransition, createTransitionProposal, verifyReceiptCoreHash } from '../causal/kernel';
import { computeMechanismContentHash } from '../causal/mechanismIdentity';
import { createGenesisRevision, createInMemoryCanonicalStore } from '../causal/store';
import { executeTransitionIr, type TransitionIrProgram } from '../causal/transitionIr';
import type { MechanismPromotionStatus, TransitionMechanismArtifact } from '../causal/types';

async function createCausalKernelFixture(promotionStatus: MechanismPromotionStatus = 'APPROVED_EXECUTABLE') {
  const store = createInMemoryCanonicalStore();
  const state = { metrics: { population: 100 }, causalReferences: [] };
  const genesis = await createGenesisRevision({
    worldId: 'worldgen-prime',
    branchId: 'root',
    simulationTime: 2026,
    stateSchema: 'worldline-state-v1',
    epistemicClass: 'GENERATED',
    kernelVersion: 'causal-kernel-v1',
    state,
  });
  await store.putGenesis(genesis, state);
  const program: TransitionIrProgram = {
    version: 'TRANSITION_IR_V1',
    operations: [{ op: 'INCREMENT', path: '/metrics/population', value: { input: 'delta' } }],
  };
  const mechanism: TransitionMechanismArtifact = {
    schema: 'worldline-transition-mechanism-v1',
    mechanismId: 'population-delta-v1',
    contentHash: 'sha256:pending',
    sourceType: 'HUMAN_AUTHORED',
    producerId: 'producer:human',
    executorKind: 'TRANSITION_IR_V1',
    stateSchemas: ['worldline-state-v1'],
    readSet: ['/metrics/population'],
    writeSet: ['/metrics/population'],
    inputSchema: {},
    epistemicCeiling: 'GENERATED',
    seedPolicy: 'NONE',
    invariantSuiteRefs: [],
    riskClass: 'LOW_RISK_RENDERING',
    reversible: true,
    machineVerifiable: true,
    automaticExecutionAllowed: true,
    promotionStatus,
    approvalReceiptId: 'approval:population-delta-v1',
    program,
  };
  mechanism.contentHash = await computeMechanismContentHash(mechanism);
  await store.putMechanism(mechanism);
  const verifier = {
    verifierId: 'verifier:independent',
    configDigest: 'sha256:verifier' as const,
    replay: ({ baseState, program: replayProgram, inputs }: {
      baseState: unknown;
      program: TransitionIrProgram;
      inputs: Record<string, unknown>;
    }) => executeTransitionIr(baseState, replayProgram, inputs),
  };
  return { store, genesis, verifier };
}

async function proposeDelta(fixture: Awaited<ReturnType<typeof createCausalKernelFixture>>, delta = 5, producerId = 'producer:agent') {
  return createTransitionProposal({
    baseRevisionId: fixture.genesis.revisionId,
    mechanismId: 'population-delta-v1',
    inputs: { delta },
    producerId,
  });
}

describe('causal kernel admission', () => {
  it('admits only a replay-identical transition and preserves receipt lineage', async () => {
    const fixture = await createCausalKernelFixture();
    const proposal = await proposeDelta(fixture);
    const result = await admitTransition(fixture.store, proposal, fixture.verifier);
    expect(result.decision).toBe('ACCEPTED');
    expect(result.receipt.core.candidateStateHash).toBe(result.receipt.core.independentReplayStateHash);
    expect(result.receipt.core.previousReceiptCoreHash).toBeNull();
    expect(result.revision?.parentRevisionId).toBe(fixture.genesis.revisionId);
    expect(result.revision?.transitionReceiptCoreHash).toBe(result.receipt.coreHash);
    expect(await verifyReceiptCoreHash(result.receipt.core, result.receipt.coreHash)).toBe(true);
  });

  it('chains a second accepted receipt to the first transition receipt', async () => {
    const fixture = await createCausalKernelFixture();
    const firstProposal = await proposeDelta(fixture);
    const first = await admitTransition(fixture.store, firstProposal, fixture.verifier);
    expect(first.revision).toBeDefined();
    const secondProposal = await createTransitionProposal({
      baseRevisionId: first.revision!.revisionId,
      mechanismId: 'population-delta-v1',
      inputs: { delta: 1 },
      producerId: 'producer:agent',
    });
    const second = await admitTransition(fixture.store, secondProposal, fixture.verifier);
    expect(second.decision).toBe('ACCEPTED');
    expect(second.receipt.core.previousReceiptCoreHash).toBe(first.receipt.coreHash);
    expect(second.revision?.parentRevisionId).toBe(first.revision?.revisionId);
  });

  it('stores a rejected receipt and creates no revision when independent replay mismatches', async () => {
    const fixture = await createCausalKernelFixture();
    const proposal = await proposeDelta(fixture);
    const badVerifier = {
      ...fixture.verifier,
      replay: () => ({ metrics: { population: 999 }, causalReferences: [] }),
    };
    const result = await admitTransition(fixture.store, proposal, badVerifier);
    expect(result.decision).toBe('REJECTED');
    expect(result.revision).toBeUndefined();
    expect(fixture.store.getReceipt(result.receipt.coreHash)?.core.decision).toBe('REJECTED');
  });

  it('returns a Human-required receipt for an unapproved mechanism without inventing state hashes', async () => {
    const fixture = await createCausalKernelFixture('CANDIDATE');
    const proposal = await proposeDelta(fixture);
    const result = await admitTransition(fixture.store, proposal, fixture.verifier);
    expect(result.decision).toBe('HUMAN_REQUIRED');
    expect(result.revision).toBeUndefined();
    expect(result.receipt.core.candidateStateHash).toBeNull();
    expect(result.receipt.core.independentReplayStateHash).toBeNull();
    expect(fixture.store.getReceipt(result.receipt.coreHash)?.core.decision).toBe('HUMAN_REQUIRED');
  });

  it('records producer/verifier identity collision as a fail-closed rejection', async () => {
    const fixture = await createCausalKernelFixture();
    const proposal = await proposeDelta(fixture, 5, fixture.verifier.verifierId);
    const result = await admitTransition(fixture.store, proposal, fixture.verifier);
    expect(result.decision).toBe('REJECTED');
    expect(result.receipt.core.gates[0].detail).toContain('collision');
  });

  it('records stale-base proposals as rejected receipts', async () => {
    const fixture = await createCausalKernelFixture();
    const first = await proposeDelta(fixture);
    await admitTransition(fixture.store, first, fixture.verifier);
    const stale = await proposeDelta(fixture, 1);
    const result = await admitTransition(fixture.store, stale, fixture.verifier);
    expect(result.decision).toBe('REJECTED');
    expect(result.receipt.core.gates[0].detail).toContain('Stale base revision');
  });

  it('detects deterministic receipt-core tampering', async () => {
    const fixture = await createCausalKernelFixture();
    const proposal = await proposeDelta(fixture);
    const result = await admitTransition(fixture.store, proposal, fixture.verifier);
    expect(await verifyReceiptCoreHash({ ...result.receipt.core, decision: 'REJECTED' }, result.receipt.coreHash)).toBe(false);
  });

  it('fails closed when verifier identity is missing', async () => {
    const fixture = await createCausalKernelFixture();
    const proposal = await proposeDelta(fixture);
    await expect(admitTransition(fixture.store, proposal, {
      ...fixture.verifier,
      verifierId: '',
    })).rejects.toThrow('Missing verifier identity');
  });
});
