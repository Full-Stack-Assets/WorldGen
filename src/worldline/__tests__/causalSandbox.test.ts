import { describe, expect, it } from 'vitest';
import { createMechanismArtifact, createWorldTransitionProposal } from '../causal/proposalContracts';
import { compileMechanismForSandbox, executeInMechanismSandbox } from '../causal/sandbox';

async function fixture() {
  const mechanism = await createMechanismArtifact({
    spec: {
      schema: 'worldline-mechanism-spec-v1', mechanismKey: 'test/population', version: '1', title: 'Population delta', description: 'Synthetic delta.',
      stateSchemas: ['test-v1'], readSet: ['/metrics/population'], writeSet: ['/metrics/population'], inputSchema: {},
      preconditions: ['Metric exists.'], assumptions: ['Synthetic only.'], uncertainty: 'LOW', supportedRegimes: ['unit-test'],
      expectedEffects: [{ path: '/metrics/population', direction: 'INCREASE', rationale: 'Positive delta.' }], evidenceRefs: ['test:sandbox'],
      failureSemantics: 'REJECT', authorityCeiling: 'AUTOMATIC_INTERNAL',
    },
    producerId: 'producer:sandbox-test',
    program: { version: 'TRANSITION_IR_V1', operations: [{ op: 'INCREMENT', path: '/metrics/population', value: { input: 'delta' } }] },
  });
  const proposal = await createWorldTransitionProposal({
    transition: { baseRevisionId: 'revision:base', mechanismId: mechanism.mechanismId, inputs: { delta: 5 }, producerId: mechanism.producerId },
    mechanism, intent: 'Apply synthetic population delta.', preconditions: ['Metric exists.'], touchedVariables: ['/metrics/population'],
    expectedDeltas: mechanism.spec!.expectedEffects, assumptions: mechanism.spec!.assumptions, uncertainty: 'LOW', evidenceRefs: ['test:sandbox'],
  });
  return { mechanism, proposal };
}

describe('zero-authority mechanism sandbox', () => {
  it('produces a candidate and receipt without mutating the base or exposing canonical authority', async () => {
    const { mechanism, proposal } = await fixture();
    const base = { metrics: { population: 100 } };
    const result = await executeInMechanismSandbox({ baseState: base, mechanism, proposal });
    expect(result.candidateState).toEqual({ metrics: { population: 105 } });
    expect(base).toEqual({ metrics: { population: 100 } });
    expect(result.receipt.authority).toBe('NONE');
    expect(result.receipt.canonicalWriteAttempted).toBe(false);
    expect('revisionId' in result.receipt).toBe(false);
  });

  it('rejects arbitrary code and operation-budget escapes', async () => {
    const { mechanism } = await fixture();
    const arbitrary = { ...mechanism, executorKind: 'TRANSITION_IR_V1' as const, program: 'globalThis.fetch("https://example.com")' };
    arbitrary.contentHash = 'sha256:invalid';
    await expect(compileMechanismForSandbox(arbitrary)).rejects.toThrow('Mechanism content hash mismatch');
    await expect(compileMechanismForSandbox(mechanism, { policyId: 'tiny', maxOperations: 0, maxInputBytes: 10, maxOutputBytes: 10 }))
      .rejects.toThrow('Invalid sandbox operation budget');
  });
});
