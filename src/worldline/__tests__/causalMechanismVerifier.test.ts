import { describe, expect, it } from 'vitest';
import { createIndependentMechanismVerifier } from '../causal/mechanismVerifier';
import { createMechanismArtifact, createWorldTransitionProposal } from '../causal/proposalContracts';

async function fixture() {
  const mechanism = await createMechanismArtifact({
    spec: {
      schema: 'worldline-mechanism-spec-v1', mechanismKey: 'test/verifier', version: '1', title: 'Verifier test', description: 'Verifier fixture.',
      stateSchemas: ['test'], readSet: ['/value'], writeSet: ['/value'], inputSchema: {}, preconditions: ['Value exists.'], assumptions: ['Synthetic.'],
      uncertainty: 'LOW', supportedRegimes: ['test'], expectedEffects: [{ path: '/value', direction: 'INCREASE', rationale: 'Delta.' }],
      evidenceRefs: ['test:verifier'], failureSemantics: 'REJECT', authorityCeiling: 'AUTOMATIC_INTERNAL',
    }, producerId: 'producer:verifier-fixture', program: { version: 'TRANSITION_IR_V1', operations: [{ op: 'INCREMENT', path: '/value', value: { input: 'delta' } }] },
  });
  const proposal = await createWorldTransitionProposal({
    transition: { baseRevisionId: 'r', mechanismId: mechanism.mechanismId, inputs: { delta: 1 }, producerId: mechanism.producerId }, mechanism,
    intent: 'Verify a candidate.', preconditions: ['Value exists.'], touchedVariables: ['/value'], expectedDeltas: mechanism.spec!.expectedEffects,
    assumptions: mechanism.spec!.assumptions, uncertainty: 'LOW', evidenceRefs: ['test:verifier'],
  });
  return { mechanism, proposal };
}

describe('independent MechanismVerifier', () => {
  it('freezes evaluator configuration before proposals and emits deterministic identity', async () => {
    const { mechanism, proposal } = await fixture();
    const source = {
      verifierId: 'verifier:independent-v1', implementationVersion: '1', sandboxPolicyId: 'sandbox-v1', invariantSuiteVersion: 'invariants-v1',
      allowedMechanismHashes: [mechanism.contentHash], evaluatorFrozenBeforeProposal: true,
    };
    const verifier = await createIndependentMechanismVerifier(source);
    source.allowedMechanismHashes.length = 0;
    const receipt = await verifier.verify({ baseState: { value: 1 }, mechanism, proposal });
    expect(receipt.decision).toBe('VERIFIED');
    expect(verifier.config.allowedMechanismHashes).toContain(mechanism.contentHash);
    expect(verifier.asKernelVerifier().configDigest).toBe(verifier.configDigest);
  });

  it('rejects producer collisions and mechanisms outside the frozen allowlist', async () => {
    const { mechanism, proposal } = await fixture();
    const verifier = await createIndependentMechanismVerifier({
      verifierId: mechanism.producerId, implementationVersion: '1', sandboxPolicyId: 'sandbox-v1', invariantSuiteVersion: 'invariants-v1',
      allowedMechanismHashes: [], evaluatorFrozenBeforeProposal: true,
    });
    const receipt = await verifier.verify({ baseState: { value: 1 }, mechanism, proposal });
    expect(receipt.decision).toBe('REJECTED');
    expect(receipt.reasons.join(' ')).toContain('collision');
    expect(receipt.reasons.join(' ')).toContain('allowlist');
  });
});
