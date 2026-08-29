import { describe, expect, it } from 'vitest';
import { createMechanismRegistry, type HumanAuthorityMechanismApproval } from '../causal/mechanismRegistry';
import { createMechanismArtifact } from '../causal/proposalContracts';

async function candidate(version: string) {
  return createMechanismArtifact({
    spec: {
      schema: 'worldline-mechanism-spec-v1', mechanismKey: 'test/registry', version, title: `Registry ${version}`, description: 'Registry fixture.',
      stateSchemas: ['test'], readSet: ['/value'], writeSet: ['/value'], inputSchema: {}, preconditions: ['Value exists.'], assumptions: ['Synthetic.'],
      uncertainty: 'LOW', supportedRegimes: ['test'], expectedEffects: [{ path: '/value', direction: 'INCREASE', rationale: 'Delta.' }], evidenceRefs: ['test:registry'],
      failureSemantics: 'REJECT', authorityCeiling: 'AUTOMATIC_INTERNAL',
    }, producerId: 'producer:registry', program: { version: 'TRANSITION_IR_V1', operations: [{ op: 'INCREMENT', path: '/value', value: 1 }] },
  });
}

function approval(mechanism: Awaited<ReturnType<typeof candidate>>, action: HumanAuthorityMechanismApproval['action'], id: string): HumanAuthorityMechanismApproval {
  return {
    schema: 'worldline-human-mechanism-approval-v1', approvalId: id, authority: 'HUMAN_AUTHORITY', action,
    mechanismId: mechanism.mechanismId, mechanismHash: mechanism.contentHash, verificationReceiptHash: `sha256:${'a'.repeat(64)}`,
    verificationStatus: 'PASS', scope: 'CANONICAL_ADMISSION',
  };
}

describe('versioned MechanismRegistry', () => {
  it('requires Human Authority promotion and retains append-only lifecycle evidence', async () => {
    const registry = createMechanismRegistry({ verifyPromotionEvidence: () => true });
    const v1 = await candidate('1.0.0');
    await registry.registerCandidate(v1);
    await expect(registry.promote(v1.mechanismId, { ...approval(v1, 'PROMOTE', 'bad'), authority: 'HUMAN_AUTHORITY', verificationStatus: 'PASS', action: 'ROLLBACK' }))
      .rejects.toThrow('Human Authority approval is required');
    await registry.promote(v1.mechanismId, approval(v1, 'PROMOTE', 'approval:v1'));
    expect(registry.getActive('test/registry')?.mechanismId).toBe(v1.mechanismId);
    expect(registry.getEvents().map((event) => event.action)).toEqual(['REGISTER_CANDIDATE', 'PROMOTE']);
  });

  it('promotes a new version and rolls back without deleting either artifact', async () => {
    const registry = createMechanismRegistry({ verifyPromotionEvidence: () => true });
    const [v1, v2] = await Promise.all([candidate('1.0.0'), candidate('2.0.0')]);
    await registry.registerCandidate(v1);
    await registry.promote(v1.mechanismId, approval(v1, 'PROMOTE', 'approval:v1'));
    await registry.registerCandidate(v2);
    await registry.promote(v2.mechanismId, approval(v2, 'PROMOTE', 'approval:v2'));
    expect(registry.getActive('test/registry')?.mechanismId).toBe(v2.mechanismId);
    await registry.rollback(v1.mechanismId, approval(v1, 'ROLLBACK', 'approval:rollback-v1'));
    expect(registry.getActive('test/registry')?.mechanismId).toBe(v1.mechanismId);
    expect(registry.getArtifact(v2.mechanismId)?.promotionStatus).toBe('RETIRED');
    expect(registry.getArtifact(v1.mechanismId)).not.toBeNull();
    expect(registry.getEvents().at(-1)?.action).toBe('ROLLBACK');
  });
});
