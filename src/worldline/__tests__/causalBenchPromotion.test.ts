import { describe, expect, it } from 'vitest';
import {
  attestCausalBenchEvaluation,
  createCausalBenchEvaluationReceipt,
  type CausalBenchCandidateIdentity,
} from '../causal/causalBenchAttestation';
import { createLockedCausalBenchPromotionEvidenceVerifier } from '../causal/causalBenchPromotion';
import { createLockedCausalEvaluator } from '../causal/lockedCausalEvaluator';
import {
  createMechanismRegistry,
  type HumanAuthorityMechanismApproval,
} from '../causal/mechanismRegistry';
import { createMechanismArtifact } from '../causal/proposalContracts';

function digest(character: string): `sha256:${string}` {
  return `sha256:${character.repeat(64)}`;
}

async function candidateMechanism() {
  return createMechanismArtifact({
    spec: {
      schema: 'worldline-mechanism-spec-v1',
      mechanismKey: 'test/attested-promotion',
      version: '1.0.0',
      title: 'Attested promotion fixture',
      description: 'A candidate that can only be promoted through locked evaluation evidence.',
      stateSchemas: ['test-state-v1'],
      readSet: ['/value'],
      writeSet: ['/value'],
      inputSchema: {},
      preconditions: ['Value exists.'],
      assumptions: ['Synthetic test.'],
      uncertainty: 'LOW',
      supportedRegimes: ['test-regime'],
      expectedEffects: [{ path: '/value', direction: 'INCREASE', rationale: 'Increment.' }],
      evidenceRefs: ['test:attested-promotion'],
      failureSemantics: 'REJECT',
      authorityCeiling: 'AUTOMATIC_INTERNAL',
    },
    producerId: 'producer:qualification-run',
    program: { version: 'TRANSITION_IR_V1', operations: [{ op: 'INCREMENT', path: '/value', value: 1 }] },
  });
}

describe('attested CausalBench mechanism promotion', () => {
  it('requires exact locked evaluation evidence before Human Authority can promote a candidate', async () => {
    const keys = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']) as CryptoKeyPair;
    const lockedEvaluator = await createLockedCausalEvaluator({
      evaluatorId: 'locked-evaluator',
      evaluatorVersion: '1.0.0',
      policyVersion: 'promotion-policy-v1',
      benchmarkSuiteId: 'mechanism-qualification',
      benchmarkSuiteVersion: '1.0.0',
      hiddenSuiteIdentifier: digest('a'),
      evaluatorIsolation: 'PROCESS',
      trustedKey: { keyId: 'evaluator-key', publicKey: keys.publicKey },
      thresholds: {
        minimumCausalBlastPrecision: 1,
        minimumCausalBlastRecall: 1,
        minimumPivotalRuleRecall: 1,
        maximumDecisionRegret: 0,
        requiredRegimeIds: ['test-regime'],
      },
    });
    const mechanism = await candidateMechanism();
    const exactCandidate: CausalBenchCandidateIdentity = {
      candidateId: mechanism.mechanismId,
      producerId: mechanism.producerId,
      model: { provider: 'test-provider', model: 'test-model', version: '1' },
    };
    const exactInputState = { schema: 'test-state-v1', value: 0 };
    const exactResultingState = { schema: 'test-state-v1', value: 1 };
    const receipt = await createCausalBenchEvaluationReceipt({
      candidate: exactCandidate,
      inputState: exactInputState,
      proposal: mechanism,
      resultingState: exactResultingState,
      benchmark: {
        suiteId: 'mechanism-qualification',
        suiteVersion: '1.0.0',
        hiddenSuiteIdentifier: digest('a'),
      },
      evaluator: {
        evaluatorId: 'locked-evaluator',
        evaluatorVersion: '1.0.0',
        evaluatorConfigHash: lockedEvaluator.configHash,
        policyVersion: 'promotion-policy-v1',
      },
      regimeCoverage: [{
        regimeId: 'test-regime', taskFamily: 'mechanism-qualification', complexity: 'SINGLE_STEP', status: 'COVERED', caseCount: 1,
      }],
      metrics: {
        causalBlastPrecision: 1,
        causalBlastRecall: 1,
        pivotalRuleRecall: 1,
        pivotalRuleResults: [{
          ruleRef: digest('b'), category: 'MECHANISM_APPLICABILITY_VIOLATION', passed: true, severity: 'PIVOTAL', evidenceDigest: digest('c'),
        }],
        constraintViolations: [],
        forbiddenMutations: [],
        decisionRegret: { value: 0, unit: 'normalized-regret', comparatorId: 'best-admissible-v1' },
        cost: { amount: 0.01, currency: 'USD' },
        latencyMs: 10,
        retryCount: 0,
      },
      seedProfile: { prngId: 'none', rootSeed: null, streamRefs: [] },
      runtimeProfile: { runtimeId: 'node-test', dependencyLockHash: digest('d'), evaluatorIsolation: 'PROCESS' },
      runId: 'qualification-run-1',
      evaluatedAt: '2026-08-29T12:00:00.000Z',
      authorityRequest: 'CANONICAL_ADMISSION_ELIGIBILITY',
      evaluationPassed: true,
    });
    const attestation = await attestCausalBenchEvaluation(receipt, {
      keyId: 'evaluator-key',
      privateKey: keys.privateKey,
    });
    const evidence = {
      receipt,
      attestation,
      exactCandidate,
      exactInputState,
      exactProposal: mechanism,
      exactResultingState,
    };
    const promotionVerifier = createLockedCausalBenchPromotionEvidenceVerifier({
      lockedEvaluator,
      resolveEvidence: (receiptHash) => receiptHash === receipt.receiptHash ? evidence : null,
    });
    const registry = createMechanismRegistry({ verifyPromotionEvidence: promotionVerifier });
    await registry.registerCandidate(mechanism);

    const approval: HumanAuthorityMechanismApproval = {
      schema: 'worldline-human-mechanism-approval-v1',
      approvalId: 'human-approval:1',
      authority: 'HUMAN_AUTHORITY',
      action: 'PROMOTE',
      mechanismId: mechanism.mechanismId,
      mechanismHash: mechanism.contentHash,
      verificationReceiptHash: receipt.receiptHash,
      verificationStatus: 'PASS',
      scope: 'CANONICAL_ADMISSION',
    };
    await registry.promote(mechanism.mechanismId, approval);
    expect(registry.getActive('test/attested-promotion')?.promotionStatus).toBe('APPROVED_EXECUTABLE');
    expect(registry.getEvents().at(-1)?.verificationReceiptHash).toBe(receipt.receiptHash);
  });

  it('fails closed when no trusted promotion-evidence verifier is configured', async () => {
    const mechanism = await candidateMechanism();
    const registry = createMechanismRegistry();
    await registry.registerCandidate(mechanism);
    const approval: HumanAuthorityMechanismApproval = {
      schema: 'worldline-human-mechanism-approval-v1',
      approvalId: 'human-approval:unverified',
      authority: 'HUMAN_AUTHORITY',
      action: 'PROMOTE',
      mechanismId: mechanism.mechanismId,
      mechanismHash: mechanism.contentHash,
      verificationReceiptHash: digest('e'),
      verificationStatus: 'PASS',
      scope: 'CANONICAL_ADMISSION',
    };
    await expect(registry.promote(mechanism.mechanismId, approval))
      .rejects.toThrow('Trusted promotion evidence verifier is unavailable');
  });
});
