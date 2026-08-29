import { describe, expect, it } from 'vitest';
import {
  attestCausalBenchEvaluation,
  createCausalBenchEvaluationReceipt,
} from '../causal/causalBenchAttestation';
import { createLockedCausalEvaluator } from '../causal/lockedCausalEvaluator';

function digest(character: string): `sha256:${string}` {
  return `sha256:${character.repeat(64)}`;
}

async function keys(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']) as Promise<CryptoKeyPair>;
}

describe('Locked CausalBench evaluator', () => {
  it('allows only exact attested proposal/world/result evidence to reach canonical eligibility review', async () => {
    const pair = await keys();
    const locked = await createLockedCausalEvaluator({
      evaluatorId: 'locked-evaluator',
      evaluatorVersion: '1.0.0',
      policyVersion: 'worldgen-promotion-policy-v1',
      benchmarkSuiteId: 'new-bedford-housing',
      benchmarkSuiteVersion: '1.0.0',
      hiddenSuiteIdentifier: digest('a'),
      evaluatorIsolation: 'PROCESS',
      trustedKey: { keyId: 'key-1', publicKey: pair.publicKey },
      thresholds: {
        minimumCausalBlastPrecision: 1,
        minimumCausalBlastRecall: 1,
        minimumPivotalRuleRecall: 1,
        maximumDecisionRegret: 0,
        requiredRegimeIds: ['new-bedford-housing-current-law'],
      },
    });
    const inputState = { worldlineId: 'nb-root', units: 10 };
    const proposal = { proposalId: 'proposal-1', addUnits: 2 };
    const resultingState = { worldlineId: 'nb-root', units: 12 };
    const receipt = await createCausalBenchEvaluationReceipt({
      candidate: {
        candidateId: 'candidate-1',
        producerId: 'producer-1',
        model: { provider: 'test', model: 'model', version: '1' },
      },
      inputState,
      proposal,
      resultingState,
      benchmark: {
        suiteId: 'new-bedford-housing',
        suiteVersion: '1.0.0',
        hiddenSuiteIdentifier: digest('a'),
      },
      evaluator: {
        evaluatorId: 'locked-evaluator',
        evaluatorVersion: '1.0.0',
        evaluatorConfigHash: locked.configHash,
        policyVersion: 'worldgen-promotion-policy-v1',
      },
      regimeCoverage: [{
        regimeId: 'new-bedford-housing-current-law',
        taskFamily: 'municipal-housing-intervention',
        complexity: 'MULTI_HOP',
        status: 'COVERED',
        caseCount: 18,
      }],
      metrics: {
        causalBlastPrecision: 1,
        causalBlastRecall: 1,
        pivotalRuleRecall: 1,
        pivotalRuleResults: [{
          ruleRef: digest('b'),
          category: 'INFRASTRUCTURE_CAPACITY',
          passed: true,
          severity: 'PIVOTAL',
          evidenceDigest: digest('c'),
        }],
        constraintViolations: [],
        forbiddenMutations: [],
        decisionRegret: { value: 0, unit: 'normalized-regret', comparatorId: 'best-admissible-v1' },
        cost: { amount: 0.05, currency: 'USD' },
        latencyMs: 900,
        retryCount: 0,
      },
      seedProfile: { prngId: 'xoshiro128ss-v1', rootSeed: 'seed-1', streamRefs: ['evaluation'] },
      runtimeProfile: { runtimeId: 'node-24', dependencyLockHash: digest('d'), evaluatorIsolation: 'PROCESS' },
      runId: 'run-1',
      evaluatedAt: '2026-08-29T12:00:00.000Z',
      authorityRequest: 'CANONICAL_ADMISSION_ELIGIBILITY',
      evaluationPassed: true,
    });
    const attestation = await attestCausalBenchEvaluation(receipt, { keyId: 'key-1', privateKey: pair.privateKey });

    const decision = await locked.verify({
      receipt,
      attestation,
      exactCandidate: receipt.candidate,
      exactInputState: inputState,
      exactProposal: proposal,
      exactResultingState: resultingState,
    });
    expect(decision.decision).toBe('ELIGIBLE_FOR_HUMAN_REVIEW');
    expect(decision.canonicalStateEligible).toBe(true);
    expect(decision.requiresHumanAuthority).toBe(true);
    expect(decision.reasons).toEqual([]);
  });

  it('rejects a valid signature when the supplied proposal is not the evaluated proposal', async () => {
    const pair = await keys();
    const locked = await createLockedCausalEvaluator({
      evaluatorId: 'evaluator',
      evaluatorVersion: '1',
      policyVersion: 'policy-v1',
      benchmarkSuiteId: 'suite',
      benchmarkSuiteVersion: '1',
      hiddenSuiteIdentifier: digest('e'),
      evaluatorIsolation: 'PROCESS',
      trustedKey: { keyId: 'key', publicKey: pair.publicKey },
      thresholds: {
        minimumCausalBlastPrecision: 0,
        minimumCausalBlastRecall: 0,
        minimumPivotalRuleRecall: 0,
        maximumDecisionRegret: 1,
        requiredRegimeIds: [],
      },
    });
    const receipt = await createCausalBenchEvaluationReceipt({
      candidate: { candidateId: 'c', producerId: 'p', model: { provider: 'x', model: 'y', version: '1' } },
      inputState: { value: 1 },
      proposal: { set: 2 },
      resultingState: { value: 2 },
      benchmark: { suiteId: 'suite', suiteVersion: '1', hiddenSuiteIdentifier: digest('e') },
      evaluator: { evaluatorId: 'evaluator', evaluatorVersion: '1', evaluatorConfigHash: locked.configHash, policyVersion: 'policy-v1' },
      regimeCoverage: [],
      metrics: {
        causalBlastPrecision: 1, causalBlastRecall: 1, pivotalRuleRecall: 0,
        pivotalRuleResults: [], constraintViolations: [], forbiddenMutations: [],
        decisionRegret: { value: 0, unit: 'normalized-regret', comparatorId: 'best' },
        cost: { amount: 0, currency: 'USD' }, latencyMs: 1, retryCount: 0,
      },
      seedProfile: { prngId: 'none', rootSeed: null, streamRefs: [] },
      runtimeProfile: { runtimeId: 'node', dependencyLockHash: digest('f'), evaluatorIsolation: 'PROCESS' },
      runId: 'run',
      evaluatedAt: '2026-08-29T12:00:00.000Z',
      authorityRequest: 'CANONICAL_ADMISSION_ELIGIBILITY',
      evaluationPassed: true,
    });
    const attestation = await attestCausalBenchEvaluation(receipt, { keyId: 'key', privateKey: pair.privateKey });
    const decision = await locked.verify({
      receipt,
      attestation,
      exactCandidate: receipt.candidate,
      exactInputState: { value: 1 },
      exactProposal: { set: 3 },
      exactResultingState: { value: 2 },
    });
    expect(decision.decision).toBe('REJECTED');
    expect(decision.reasons).toContain('PROPOSAL_HASH_MISMATCH');
    expect(decision.canonicalStateEligible).toBe(false);
  });
});
