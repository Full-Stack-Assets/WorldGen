import { describe, expect, it } from 'vitest';
import { computeMechanismContentHash } from '../causal/mechanismIdentity';
import { createGenesisRevision, createInMemoryCanonicalStore } from '../causal/store';
import type { TransitionMechanismArtifact } from '../causal/types';

async function agentMechanism(status: TransitionMechanismArtifact['promotionStatus'] = 'CANDIDATE'): Promise<TransitionMechanismArtifact> {
  const mechanism: TransitionMechanismArtifact = {
    schema: 'worldline-transition-mechanism-v1',
    mechanismId: 'agent:test:v1',
    contentHash: 'sha256:pending',
    sourceType: 'AGENT_GENERATED',
    producerId: 'producer:agent-test',
    executorKind: 'TRANSITION_IR_V1',
    stateSchemas: ['worldline-state-v1'],
    readSet: [],
    writeSet: ['/value'],
    inputSchema: {},
    epistemicCeiling: 'GENERATED',
    seedPolicy: 'NONE',
    invariantSuiteRefs: [],
    riskClass: 'LOW_RISK_RENDERING',
    reversible: true,
    machineVerifiable: true,
    automaticExecutionAllowed: true,
    promotionStatus: status,
    ...(status === 'APPROVED_EXECUTABLE' ? { approvalReceiptId: 'approval:self-asserted' } : {}),
    program: {
      version: 'TRANSITION_IR_V1',
      operations: [{ op: 'SET', path: '/value', value: 1 }],
    },
  };
  mechanism.contentHash = await computeMechanismContentHash(mechanism);
  return mechanism;
}

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

  it('rejects children whose parent revision is missing', async () => {
    const store = createInMemoryCanonicalStore();
    const state = { worlds: [], branches: {} };
    const genesis = await createGenesisRevision({
      worldId: 'worldgen-prime', branchId: 'root', simulationTime: 2026,
      stateSchema: 'worldline-state-v1', epistemicClass: 'GENERATED', kernelVersion: 'causal-kernel-v1', state,
    });
    await store.putGenesis(genesis, state);
    await expect(store.appendRevision({
      ...genesis,
      revisionId: 'revision:bad',
      parentRevisionId: 'revision:missing',
      transitionReceiptCoreHash: 'sha256:missing-receipt',
      sequence: 1,
    }, state)).rejects.toThrow('Missing parent revision');
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

  it('rejects a non-human mechanism that self-asserts approved status', async () => {
    const store = createInMemoryCanonicalStore();
    await expect(store.putMechanism(await agentMechanism('APPROVED_EXECUTABLE')))
      .rejects.toThrow('Non-human mechanism requires trusted promotion');
  });

  it('registers an agent mechanism only as a candidate', async () => {
    const store = createInMemoryCanonicalStore();
    const mechanism = await agentMechanism();
    await store.putMechanism(mechanism);
    expect(store.getMechanism(mechanism.mechanismId)?.promotionStatus).toBe('CANDIDATE');
  });

  it('refuses promotion when no trusted approval verifier is configured', async () => {
    const store = createInMemoryCanonicalStore();
    const mechanism = await agentMechanism();
    await store.putMechanism(mechanism);
    await expect(store.promoteMechanism(mechanism.mechanismId, 'approval:human-1'))
      .rejects.toThrow('Trusted mechanism approval verifier is unavailable');
  });

  it('promotes the same candidate bytes only after trusted approval verification', async () => {
    const verified: string[] = [];
    const store = createInMemoryCanonicalStore({
      verifyMechanismApproval: ({ mechanism, approvalReceiptId }) => {
        verified.push(`${mechanism.mechanismId}:${approvalReceiptId}`);
        return approvalReceiptId === 'approval:human-verified';
      },
    });
    const mechanism = await agentMechanism();
    await store.putMechanism(mechanism);
    const promoted = await store.promoteMechanism(mechanism.mechanismId, 'approval:human-verified');
    expect(promoted.promotionStatus).toBe('APPROVED_EXECUTABLE');
    expect(promoted.approvalReceiptId).toBe('approval:human-verified');
    expect(promoted.contentHash).toBe(mechanism.contentHash);
    expect(verified).toEqual(['agent:test:v1:approval:human-verified']);
  });
});
