import { describe, expect, it } from 'vitest';
import { createMechanismArtifact, createWorldTransitionProposal } from '../causal/proposalContracts';

const spec = {
  schema: 'worldline-mechanism-spec-v1' as const,
  mechanismKey: 'mobility/transit-access',
  version: '1.0.0',
  title: 'Transit access mechanism',
  description: 'Applies a bounded transit-access delta.',
  stateSchemas: ['worldline-state-v1'],
  readSet: ['/metrics/transitAccess'],
  writeSet: ['/metrics/transitAccess'],
  inputSchema: { type: 'object', required: ['delta'] },
  preconditions: ['Transit metric exists.'],
  assumptions: ['Synthetic calibration only.'],
  uncertainty: 'UNQUANTIFIED' as const,
  supportedRegimes: ['synthetic-city-v1'],
  expectedEffects: [{ path: '/metrics/transitAccess', direction: 'INCREASE' as const, rationale: 'Positive intervention.' }],
  evidenceRefs: ['test:paired-intervention'],
  failureSemantics: 'REJECT' as const,
  authorityCeiling: 'AUTOMATIC_INTERNAL' as const,
};

describe('WorldTransitionProposal and MechanismSpec', () => {
  it('creates deterministic, provenance-bearing proposal envelopes', async () => {
    const mechanism = await createMechanismArtifact({
      spec,
      producerId: 'producer:contract-test',
      program: { version: 'TRANSITION_IR_V1', operations: [{ op: 'INCREMENT', path: '/metrics/transitAccess', value: { input: 'delta' } }] },
    });
    const input = {
      transition: { baseRevisionId: 'revision:base', mechanismId: mechanism.mechanismId, inputs: { delta: 5 }, producerId: mechanism.producerId },
      mechanism,
      intent: 'Increase transit access in the sandbox.',
      preconditions: ['Base revision is current.'],
      touchedVariables: ['/metrics/transitAccess'],
      expectedDeltas: spec.expectedEffects,
      assumptions: spec.assumptions,
      uncertainty: spec.uncertainty,
      evidenceRefs: spec.evidenceRefs,
    };
    const first = await createWorldTransitionProposal(input);
    const second = await createWorldTransitionProposal(input);
    expect(second).toEqual(first);
    expect(first.requestedAuthority).toBe('SANDBOX_ONLY');
    expect(first.proposal.mechanismId).toBe('mobility/transit-access@1.0.0');
  });

  it('rejects undeclared touched variables and evidence-free mechanisms', async () => {
    const mechanism = await createMechanismArtifact({
      spec,
      producerId: 'producer:contract-test',
      program: { version: 'TRANSITION_IR_V1', operations: [] },
    });
    await expect(createWorldTransitionProposal({
      transition: { baseRevisionId: 'revision:base', mechanismId: mechanism.mechanismId, inputs: {}, producerId: mechanism.producerId },
      mechanism,
      intent: 'Touch an undeclared variable.',
      preconditions: ['Base exists.'],
      touchedVariables: ['/secrets'],
      expectedDeltas: spec.expectedEffects,
      assumptions: spec.assumptions,
      uncertainty: 'HIGH',
      evidenceRefs: spec.evidenceRefs,
    })).rejects.toThrow('outside the declared write set');
    await expect(createMechanismArtifact({
      spec: { ...spec, evidenceRefs: [] }, producerId: 'producer', program: { version: 'TRANSITION_IR_V1', operations: [] },
    })).rejects.toThrow('evidenceRefs must not be empty');
  });
});
