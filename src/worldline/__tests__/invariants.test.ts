import { describe, expect, it } from 'vitest';
import { allInvariantsPassed, runCoreInvariants } from '../kernel/invariants';
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
      provider: 'procedural-worldgen',
      description: 'fixture',
    }],
    branches: {
      root: {
        id: 'root',
        label: 'Root',
        parentId: null,
        forkYear: 2026,
        seed: 1,
        snapshots: [],
        events: [],
      },
    },
  };
}

function mechanism(): TransitionMechanismArtifact {
  return {
    schema: 'worldline-transition-mechanism-v1',
    mechanismId: 'm1',
    mechanismHash: 'sha256:m1',
    producerId: 'producer:author',
    sourceType: 'HUMAN_AUTHORED',
    executorKind: 'TRANSITION_IR_V1',
    stateSchema: 'worldline-canonical-state-v1',
    inputSchema: 'input-v1',
    readSet: ['/branches'],
    writeSet: ['/branches'],
    epistemicCeiling: 'SIMULATED',
    deterministicSeedPolicy: 'FORBIDDEN',
    invariantSuiteIds: ['core'],
    riskClass: 'LOW',
    executionPolicy: 'AUTO_LOW_RISK',
    promotionStatus: 'APPROVED_EXECUTABLE',
    approvalReceiptId: 'approval:m1',
    ir: { version: '1', operations: [] },
  };
}

function proposal(): TransitionProposal {
  return {
    schema: 'worldline-transition-proposal-v1',
    proposalId: 'p1',
    baseRevisionId: 'r0',
    mechanismId: 'm1',
    normalizedInputs: {},
    inputHash: 'sha256:inputs',
    seed: null,
    producerId: 'producer:runner',
    causalClaims: [],
  };
}

describe('Worldline core causal invariants', () => {
  it('passes structurally coherent canonical state', () => {
    const before = canonicalState();
    const results = runCoreInvariants({
      before,
      after: structuredClone(before),
      mechanism: mechanism(),
      proposal: proposal(),
    });
    expect(allInvariantsPassed(results)).toBe(true);
  });

  it('detects proposal/mechanism substitution', () => {
    const p = proposal();
    p.mechanismId = 'other-mechanism';
    const results = runCoreInvariants({
      before: canonicalState(),
      after: canonicalState(),
      mechanism: mechanism(),
      proposal: p,
    });
    expect(results.find((item) => item.invariantId === 'proposal-mechanism-binding')?.passed).toBe(false);
  });

  it('detects duplicate world identities', () => {
    const state = canonicalState();
    state.worlds.push(structuredClone(state.worlds[0]));
    const results = runCoreInvariants({ before: canonicalState(), after: state, mechanism: mechanism(), proposal: proposal() });
    expect(results.find((item) => item.invariantId === 'unique-world-ids')?.passed).toBe(false);
  });

  it('detects branch key and parent reference corruption', () => {
    const state = canonicalState();
    state.branches.wrong = { ...structuredClone(state.branches.root), id: 'different', parentId: 'missing' };
    const results = runCoreInvariants({ before: canonicalState(), after: state, mechanism: mechanism(), proposal: proposal() });
    expect(results.find((item) => item.invariantId === 'branch-key-identity')?.passed).toBe(false);
    expect(results.find((item) => item.invariantId === 'branch-parent-reference')?.passed).toBe(false);
  });
});
