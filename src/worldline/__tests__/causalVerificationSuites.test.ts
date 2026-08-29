import { describe, expect, it } from 'vitest';
import { createMechanismArtifact, createWorldTransitionProposal } from '../causal/proposalContracts';
import { runMechanismVerificationSuite } from '../causal/verificationSuites';

describe('mechanism verification suites', () => {
  it('runs replay, paired intervention, failure preservation, and counterexample gates', async () => {
    const mechanism = await createMechanismArtifact({
      spec: {
        schema: 'worldline-mechanism-spec-v1', mechanismKey: 'test/transit', version: '1', title: 'Transit', description: 'Synthetic transit delta.',
        stateSchemas: ['test'], readSet: ['/metrics/transit'], writeSet: ['/metrics/transit'], inputSchema: {},
        preconditions: ['Metric exists.'], assumptions: ['Synthetic only.'], uncertainty: 'LOW', supportedRegimes: ['test'],
        expectedEffects: [{ path: '/metrics/transit', direction: 'INCREASE', rationale: 'Positive delta.' }], evidenceRefs: ['test:suite'],
        failureSemantics: 'REJECT', authorityCeiling: 'AUTOMATIC_INTERNAL',
      },
      producerId: 'producer:suite',
      program: { version: 'TRANSITION_IR_V1', operations: [{ op: 'INCREMENT', path: '/metrics/transit', value: { input: 'delta' } }] },
    });
    const proposal = (delta: unknown) => createWorldTransitionProposal({
      transition: { baseRevisionId: 'revision:base', mechanismId: mechanism.mechanismId, inputs: { delta }, producerId: mechanism.producerId },
      mechanism, intent: 'Test transit delta.', preconditions: ['Metric exists.'], touchedVariables: ['/metrics/transit'],
      expectedDeltas: mechanism.spec!.expectedEffects, assumptions: mechanism.spec!.assumptions, uncertainty: 'LOW', evidenceRefs: ['test:suite'],
    });
    const [control, intervention, invalid] = await Promise.all([proposal(0), proposal(5), proposal('not-a-number')]);
    const receipt = await runMechanismVerificationSuite({
      mechanism, baseState: { metrics: { transit: 10 } }, verifierConfigId: 'fixed-suite-v1', heldOut: true,
      replayProposal: intervention,
      pairedIntervention: { control, intervention, observedPath: '/metrics/transit', expected: 'INCREASE' },
      failureCases: [{ id: 'nan-delta', proposal: invalid, expectedError: 'Non-finite transition result' }],
      counterexampleProbes: [{ id: 'non-negative', proposal: control, detail: 'Transit stays non-negative.', invariant: (state) => Number((state as { metrics: { transit: number } }).metrics.transit) >= 0 }],
    });
    expect(receipt.status).toBe('PASS');
    expect(receipt.gates.map((gate) => gate.id)).toEqual(expect.arrayContaining(['REPLAY', 'PAIRED_INTERVENTION', 'FAILURE_PRESERVATION', 'COUNTEREXAMPLE_SEARCH']));
  });

  it('retains counterexamples and fails the suite', async () => {
    const mechanism = await createMechanismArtifact({
      spec: {
        schema: 'worldline-mechanism-spec-v1', mechanismKey: 'test/decrement', version: '1', title: 'Decrement', description: 'Synthetic decrement.',
        stateSchemas: ['test'], readSet: ['/value'], writeSet: ['/value'], inputSchema: {}, preconditions: ['Value exists.'],
        assumptions: ['Synthetic.'], uncertainty: 'HIGH', supportedRegimes: ['test'], expectedEffects: [{ path: '/value', direction: 'DECREASE', rationale: 'Negative delta.' }],
        evidenceRefs: ['test:counterexample'], failureSemantics: 'REJECT', authorityCeiling: 'AUTOMATIC_INTERNAL',
      }, producerId: 'producer', program: { version: 'TRANSITION_IR_V1', operations: [{ op: 'INCREMENT', path: '/value', value: { input: 'delta' } }] },
    });
    const proposal = await createWorldTransitionProposal({
      transition: { baseRevisionId: 'r', mechanismId: mechanism.mechanismId, inputs: { delta: -2 }, producerId: 'producer' }, mechanism,
      intent: 'Find floor violation.', preconditions: ['Value exists.'], touchedVariables: ['/value'], expectedDeltas: mechanism.spec!.expectedEffects,
      assumptions: ['Synthetic.'], uncertainty: 'HIGH', evidenceRefs: ['test:counterexample'],
    });
    const receipt = await runMechanismVerificationSuite({
      mechanism, baseState: { value: 1 }, verifierConfigId: 'fixed', heldOut: true, replayProposal: proposal,
      pairedIntervention: { control: proposal, intervention: proposal, observedPath: '/value', expected: 'UNCHANGED' }, failureCases: [],
      counterexampleProbes: [{ id: 'floor-zero', proposal, detail: 'Value must remain non-negative.', invariant: (state) => Number((state as { value: number }).value) >= 0 }],
    });
    expect(receipt.status).toBe('FAIL');
    expect(receipt.counterexampleIds).toContain('floor-zero');
  });
});
