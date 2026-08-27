import { describe, expect, it } from 'vitest';
import { admitTransition } from '../kernel/admission';
import { hashCanonical } from '../kernel/hash';
import { createGenesisRevision, createRevisionStore } from '../kernel/revisionStore';
import { computeMechanismHash } from '../kernel/transitionIr';
import type {
  CanonicalWorldState,
  TransitionMechanismArtifact,
  TransitionProposal,
} from '../kernel/types';

function canonicalState(): CanonicalWorldState {
  return {
    schema: 'worldline-canonical-state-v1',
    worlds: [{
      id: 'w1',
      name: 'World',
      kind: 'GENERATED',
      epistemicClass: 'GENERATED',
      fidelity: 'FIELD',
      provider: 'test',
      description: 'fixture',
    }],
    branches: {
      root: {
        id: 'root',
        label: 'Root',
        parentId: null,
        forkYear: 2026,
        seed: 1,
        snapshots: [{
          id: 's1',
          worldId: 'w1',
          branchId: 'root',
          year: 2026,
          metrics: { energy: 10 },
          eventIds: [],
          commitment: 'fixture',
        }],
        events: [],
      },
    },
  };
}

function approvedMechanism(input: {
  mechanismId?: string;
  executionPolicy?: TransitionMechanismArtifact['executionPolicy'];
} = {}): TransitionMechanismArtifact {
  const base: Omit<TransitionMechanismArtifact, 'mechanismHash'> = {
    schema: 'worldline-transition-mechanism-v1',
    mechanismId: input.mechanismId ?? 'mechanism:increment-energy',
    producerId: 'producer:author',
    sourceType: 'HUMAN_AUTHORED',
    executorKind: 'TRANSITION_IR_V1',
    stateSchema: 'worldline-canonical-state-v1',
    inputSchema: 'input-v1',
    readSet: ['/branches/root/snapshots/0/metrics/energy'],
    writeSet: ['/branches/root/snapshots/0/metrics/energy'],
    epistemicCeiling: 'SIMULATED',
    deterministicSeedPolicy: 'FORBIDDEN',
    invariantSuiteIds: ['core'],
    riskClass: 'LOW',
    executionPolicy: input.executionPolicy ?? 'AUTO_LOW_RISK',
    promotionStatus: 'APPROVED_EXECUTABLE',
    approvalReceiptId: 'approval:mechanism',
    ir: {
      version: '1',
      operations: [{
        op: 'INCREMENT',
        path: '/branches/root/snapshots/0/metrics/energy',
        value: 2,
      }],
    },
  };
  return { ...base, mechanismHash: computeMechanismHash(base) };
}

function proposal(baseRevisionId: string, mechanismId: string): TransitionProposal {
  return {
    schema: 'worldline-transition-proposal-v1',
    proposalId: `proposal:${mechanismId}`,
    baseRevisionId,
    mechanismId,
    normalizedInputs: {},
    inputHash: hashCanonical({}),
    seed: null,
    producerId: 'producer:runner',
    causalClaims: [],
  };
}

function deps(store: ReturnType<typeof createRevisionStore>) {
  return {
    store,
    kernelVersion: '1.0.0',
    verifierId: 'verifier:test',
    verifierConfigDigest: 'sha256:verifier' as const,
    now: () => '2026-08-27T12:30:00Z',
  };
}

describe('Worldline transition admission', () => {
  it('admits a validated deterministic low-risk execution as a child canonical revision', () => {
    const state = canonicalState();
    const store = createRevisionStore();
    const genesis = createGenesisRevision({
      worldId: 'w1', branchId: 'root', simulationTime: 2026, state,
      epistemicClass: 'GENERATED', kernelVersion: '1.0.0',
    });
    store.putRevision(genesis.revision, state);

    const mechanism = approvedMechanism();
    const receipt = admitTransition(deps(store), {
      mechanism,
      proposal: proposal(genesis.revision.revisionId, mechanism.mechanismId),
      simulationTime: 2030,
    });

    expect(receipt.core.decision).toBe('ACCEPTED');
    expect(receipt.core.candidateStateHash).toBe(receipt.core.replayStateHash);
    expect(receipt.acceptedRevisionId).not.toBeNull();

    const accepted = store.getRevision(receipt.acceptedRevisionId!);
    expect(accepted?.revision.parentRevisionId).toBe(genesis.revision.revisionId);
    expect(accepted?.revision.epistemicClass).toBe('SIMULATED');
    expect(accepted?.state.branches.root.snapshots[0].metrics.energy).toBe(12);
    expect(store.getBranchHead('w1', 'root')?.revisionId).toBe(receipt.acceptedRevisionId);
  });

  it('preserves a fully validated human-gated candidate outside canonical truth', () => {
    const state = canonicalState();
    const store = createRevisionStore();
    const genesis = createGenesisRevision({
      worldId: 'w1', branchId: 'root', simulationTime: 2026, state,
      epistemicClass: 'GENERATED', kernelVersion: '1.0.0',
    });
    store.putRevision(genesis.revision, state);

    const mechanism = approvedMechanism({ mechanismId: 'mechanism:human', executionPolicy: 'HUMAN_EACH_EXECUTION' });
    const receipt = admitTransition(deps(store), {
      mechanism,
      proposal: proposal(genesis.revision.revisionId, mechanism.mechanismId),
      simulationTime: 2030,
    });

    expect(receipt.core.decision).toBe('HUMAN_REQUIRED');
    expect(receipt.core.candidateStateHash).toBe(receipt.core.replayStateHash);
    expect(receipt.acceptedRevisionId).toBeNull();
    expect(store.getBranchHead('w1', 'root')?.revisionId).toBe(genesis.revision.revisionId);
  });

  it('accepts a human-gated execution only when the approval reference is supplied', () => {
    const state = canonicalState();
    const store = createRevisionStore();
    const genesis = createGenesisRevision({
      worldId: 'w1', branchId: 'root', simulationTime: 2026, state,
      epistemicClass: 'GENERATED', kernelVersion: '1.0.0',
    });
    store.putRevision(genesis.revision, state);

    const mechanism = approvedMechanism({ mechanismId: 'mechanism:human-approved', executionPolicy: 'HUMAN_EACH_EXECUTION' });
    const receipt = admitTransition(deps(store), {
      mechanism,
      proposal: proposal(genesis.revision.revisionId, mechanism.mechanismId),
      simulationTime: 2030,
      humanApprovalReference: 'approval:execution:1',
    });

    expect(receipt.core.decision).toBe('ACCEPTED');
    expect(receipt.core.humanApprovalReference).toBe('approval:execution:1');
    expect(receipt.acceptedRevisionId).not.toBeNull();
  });
});
