import { describe, expect, it } from 'vitest';
import {
  attestCausalBenchEvaluation,
  createCausalBenchEvaluationReceipt,
  verifyCausalBenchAttestation,
  verifyCausalBenchEvaluationReceiptHash,
  type CausalBenchEvaluationMetrics,
} from '../causal/causalBenchAttestation';

function digest(character: string): `sha256:${string}` {
  return `sha256:${character.repeat(64)}`;
}

function metrics(): CausalBenchEvaluationMetrics {
  return {
    causalBlastPrecision: 1,
    causalBlastRecall: 1,
    pivotalRuleRecall: 1,
    pivotalRuleResults: [{
      ruleRef: digest('a'),
      category: 'INFRASTRUCTURE_CAPACITY',
      passed: true,
      severity: 'PIVOTAL',
      evidenceDigest: digest('b'),
    }],
    constraintViolations: [],
    forbiddenMutations: [],
    decisionRegret: { value: 0, unit: 'normalized-regret', comparatorId: 'best-admissible-v1' },
    cost: { amount: 0.04, currency: 'USD' },
    latencyMs: 820,
    retryCount: 0,
  };
}

async function keyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']) as Promise<CryptoKeyPair>;
}

describe('CausalBench evaluation attestation', () => {
  it('binds a receipt to exact world, proposal, result, evaluator, suite, and authority scope', async () => {
    const receipt = await createCausalBenchEvaluationReceipt({
      candidate: {
        candidateId: 'candidate:new-bedford-housing-1',
        producerId: 'producer:model-run-1',
        model: { provider: 'test-provider', model: 'causal-model', version: '2026-08-29' },
      },
      inputState: { worldlineId: 'nb-root', capacity: 10, occupied: 8 },
      proposal: { proposalId: 'p-1', addUnits: 2 },
      resultingState: { worldlineId: 'nb-root', capacity: 12, occupied: 8 },
      benchmark: {
        suiteId: 'new-bedford-housing',
        suiteVersion: '1.0.0',
        hiddenSuiteIdentifier: digest('c'),
      },
      evaluator: {
        evaluatorId: 'locked-evaluator',
        evaluatorVersion: '1.0.0',
        evaluatorConfigHash: digest('d'),
        policyVersion: 'worldgen-promotion-policy-v1',
      },
      regimeCoverage: [{
        regimeId: 'new-bedford-housing-current-law',
        taskFamily: 'municipal-housing-intervention',
        complexity: 'MULTI_HOP',
        status: 'COVERED',
        caseCount: 18,
      }],
      metrics: metrics(),
      seedProfile: { prngId: 'xoshiro128ss-v1', rootSeed: 'seed-42', streamRefs: ['evaluation'] },
      runtimeProfile: {
        runtimeId: 'node-24-linux-x64',
        dependencyLockHash: digest('e'),
        evaluatorIsolation: 'PROCESS',
      },
      runId: 'run-2026-08-29-001',
      evaluatedAt: '2026-08-29T12:00:00.000Z',
      authorityRequest: 'CANONICAL_ADMISSION_ELIGIBILITY',
      evaluationPassed: true,
    });

    expect(await verifyCausalBenchEvaluationReceiptHash(receipt)).toBe(true);
    expect(receipt.authorityDecision).toBe('ELIGIBLE_FOR_HUMAN_REVIEW');
    expect(receipt.inputStateHash).toMatch(/^sha256:/);
    expect(receipt.proposalHash).toMatch(/^sha256:/);
    expect(receipt.resultingStateHash).toMatch(/^sha256:/);
  });

  it('uses an asymmetric evaluator signature and rejects receipt tampering', async () => {
    const keys = await keyPair();
    const receipt = await createCausalBenchEvaluationReceipt({
      candidate: {
        candidateId: 'candidate:1',
        producerId: 'producer:1',
        model: { provider: 'test', model: 'model', version: '1' },
      },
      inputState: { value: 1 },
      proposal: { set: 2 },
      resultingState: { value: 2 },
      benchmark: { suiteId: 'suite', suiteVersion: '1', hiddenSuiteIdentifier: digest('f') },
      evaluator: {
        evaluatorId: 'evaluator',
        evaluatorVersion: '1',
        evaluatorConfigHash: digest('1'),
        policyVersion: 'policy-v1',
      },
      regimeCoverage: [{ regimeId: 'r1', taskFamily: 'state-edit', complexity: 'SINGLE_STEP', status: 'COVERED', caseCount: 1 }],
      metrics: metrics(),
      seedProfile: { prngId: 'none', rootSeed: null, streamRefs: [] },
      runtimeProfile: { runtimeId: 'node-24', dependencyLockHash: digest('2'), evaluatorIsolation: 'PROCESS' },
      runId: 'run-1',
      evaluatedAt: '2026-08-29T12:00:00.000Z',
      authorityRequest: 'SANDBOX_EVALUATION',
      evaluationPassed: true,
    });
    const attestation = await attestCausalBenchEvaluation(receipt, {
      keyId: 'evaluator-key-1',
      privateKey: keys.privateKey,
    });
    expect(await verifyCausalBenchAttestation(receipt, attestation, keys.publicKey)).toBe(true);

    const tampered = {
      ...receipt,
      metrics: { ...receipt.metrics, causalBlastRecall: 0.5 },
    };
    expect(await verifyCausalBenchEvaluationReceiptHash(tampered)).toBe(false);
    expect(await verifyCausalBenchAttestation(tampered, attestation, keys.publicKey)).toBe(false);
  });
});
