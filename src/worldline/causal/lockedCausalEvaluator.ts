import { hashCanonical, type Sha256Digest } from './canonicalJson';
import {
  verifyCausalBenchAttestation,
  verifyCausalBenchEvaluationReceiptHash,
  type CausalBenchCandidateIdentity,
  type CausalBenchEvaluationReceipt,
  type EvaluatorAttestation,
  type EvaluatorIsolation,
} from './causalBenchAttestation';

export interface LockedCausalEvaluatorThresholds {
  minimumCausalBlastPrecision: number;
  minimumCausalBlastRecall: number;
  minimumPivotalRuleRecall: number;
  maximumDecisionRegret: number;
  requiredRegimeIds: readonly string[];
}

export interface LockedCausalEvaluatorConfig {
  evaluatorId: string;
  evaluatorVersion: string;
  policyVersion: string;
  benchmarkSuiteId: string;
  benchmarkSuiteVersion: string;
  hiddenSuiteIdentifier: Sha256Digest;
  evaluatorIsolation: EvaluatorIsolation;
  trustedKey: Readonly<{ keyId: string; publicKey: CryptoKey }>;
  thresholds: LockedCausalEvaluatorThresholds;
}

export type LockedPromotionDecisionCode = 'REJECTED' | 'SANDBOX_VERIFIED' | 'ELIGIBLE_FOR_HUMAN_REVIEW';

export interface LockedPromotionDecision {
  schema: 'worldgen-locked-promotion-decision-v1';
  evaluatorConfigHash: Sha256Digest;
  evaluationReceiptHash: Sha256Digest;
  attestationHash: Sha256Digest;
  decision: LockedPromotionDecisionCode;
  canonicalStateEligible: boolean;
  requiresHumanAuthority: boolean;
  reasons: readonly string[];
  decisionHash: Sha256Digest;
}

function requireNonEmpty(value: string, field: string): string {
  const normalized = value.normalize('NFC').trim();
  if (!normalized) throw new Error(`${field} is required`);
  return normalized;
}

function requireUnitInterval(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error(`${field} must be between zero and one`);
}

function requireFiniteNonNegative(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${field} must be finite and non-negative`);
}

function requireDigest(value: string, field: string): asserts value is Sha256Digest {
  if (!/^sha256:[0-9a-f]{64}$/i.test(value)) throw new Error(`${field} must be a SHA-256 digest`);
}

async function publicKeyFingerprint(publicKey: CryptoKey): Promise<Sha256Digest> {
  if (publicKey.type !== 'public' || !publicKey.usages.includes('verify')) throw new Error('Trusted evaluator key must be a verification key');
  if (publicKey.algorithm.name !== 'Ed25519') throw new Error('Trusted evaluator key must use Ed25519');
  if (!publicKey.extractable) throw new Error('Trusted evaluator public key must be extractable for configuration identity');
  const raw = await crypto.subtle.exportKey('raw', publicKey);
  return hashCanonical(Array.from(new Uint8Array(raw)));
}

export async function createLockedCausalEvaluator(source: LockedCausalEvaluatorConfig) {
  requireUnitInterval(source.thresholds.minimumCausalBlastPrecision, 'minimumCausalBlastPrecision');
  requireUnitInterval(source.thresholds.minimumCausalBlastRecall, 'minimumCausalBlastRecall');
  requireUnitInterval(source.thresholds.minimumPivotalRuleRecall, 'minimumPivotalRuleRecall');
  requireFiniteNonNegative(source.thresholds.maximumDecisionRegret, 'maximumDecisionRegret');
  requireDigest(source.hiddenSuiteIdentifier, 'hiddenSuiteIdentifier');
  const keyFingerprint = await publicKeyFingerprint(source.trustedKey.publicKey);
  const configCore = {
    schema: 'worldgen-locked-causal-evaluator-config-v1' as const,
    evaluatorId: requireNonEmpty(source.evaluatorId, 'evaluatorId'),
    evaluatorVersion: requireNonEmpty(source.evaluatorVersion, 'evaluatorVersion'),
    policyVersion: requireNonEmpty(source.policyVersion, 'policyVersion'),
    benchmarkSuiteId: requireNonEmpty(source.benchmarkSuiteId, 'benchmarkSuiteId'),
    benchmarkSuiteVersion: requireNonEmpty(source.benchmarkSuiteVersion, 'benchmarkSuiteVersion'),
    hiddenSuiteIdentifier: source.hiddenSuiteIdentifier,
    evaluatorIsolation: source.evaluatorIsolation,
    trustedKey: {
      keyId: requireNonEmpty(source.trustedKey.keyId, 'trusted keyId'),
      fingerprint: keyFingerprint,
      algorithm: 'Ed25519' as const,
    },
    thresholds: {
      ...structuredClone(source.thresholds),
      requiredRegimeIds: [...new Set(source.thresholds.requiredRegimeIds.map((id) => requireNonEmpty(id, 'requiredRegimeId')))].sort(),
    },
    frozenBeforeProposal: true as const,
  };
  const configHash = await hashCanonical(configCore);

  const verify = async (input: {
    receipt: CausalBenchEvaluationReceipt;
    attestation: EvaluatorAttestation;
    exactCandidate: CausalBenchCandidateIdentity;
    exactInputState: unknown;
    exactProposal: unknown;
    exactResultingState: unknown;
  }): Promise<LockedPromotionDecision> => {
    const reasons: string[] = [];
    const receipt = input.receipt;
    if (!await verifyCausalBenchEvaluationReceiptHash(receipt)) reasons.push('RECEIPT_HASH_INVALID');
    if (input.attestation.keyId !== configCore.trustedKey.keyId) reasons.push('UNTRUSTED_ATTESTATION_KEY');
    if (!await verifyCausalBenchAttestation(receipt, input.attestation, source.trustedKey.publicKey)) reasons.push('ATTESTATION_INVALID');
    if (receipt.evaluatorId !== configCore.evaluatorId) reasons.push('EVALUATOR_ID_MISMATCH');
    if (receipt.evaluatorVersion !== configCore.evaluatorVersion) reasons.push('EVALUATOR_VERSION_MISMATCH');
    if (receipt.evaluatorConfigHash !== configHash) reasons.push('EVALUATOR_CONFIG_MISMATCH');
    if (receipt.policyVersion !== configCore.policyVersion) reasons.push('POLICY_VERSION_MISMATCH');
    if (receipt.benchmarkSuiteId !== configCore.benchmarkSuiteId) reasons.push('BENCHMARK_SUITE_ID_MISMATCH');
    if (receipt.benchmarkSuiteVersion !== configCore.benchmarkSuiteVersion) reasons.push('BENCHMARK_SUITE_VERSION_MISMATCH');
    if (receipt.hiddenSuiteIdentifier !== configCore.hiddenSuiteIdentifier) reasons.push('HIDDEN_SUITE_MISMATCH');
    if (receipt.runtimeProfile.evaluatorIsolation !== configCore.evaluatorIsolation) reasons.push('EVALUATOR_ISOLATION_MISMATCH');

    if (await hashCanonical(receipt.candidate) !== await hashCanonical(input.exactCandidate)) reasons.push('CANDIDATE_IDENTITY_MISMATCH');
    if (receipt.inputStateHash !== await hashCanonical(input.exactInputState)) reasons.push('INPUT_STATE_HASH_MISMATCH');
    if (receipt.proposalHash !== await hashCanonical(input.exactProposal)) reasons.push('PROPOSAL_HASH_MISMATCH');
    if (receipt.resultingStateHash !== await hashCanonical(input.exactResultingState)) reasons.push('RESULTING_STATE_HASH_MISMATCH');

    if (receipt.metrics.causalBlastPrecision < configCore.thresholds.minimumCausalBlastPrecision) reasons.push('CAUSAL_BLAST_PRECISION_BELOW_POLICY');
    if (receipt.metrics.causalBlastRecall < configCore.thresholds.minimumCausalBlastRecall) reasons.push('CAUSAL_BLAST_RECALL_BELOW_POLICY');
    if (receipt.metrics.pivotalRuleRecall < configCore.thresholds.minimumPivotalRuleRecall) reasons.push('PIVOTAL_RULE_RECALL_BELOW_POLICY');
    if (receipt.metrics.pivotalRuleResults.some((result) => result.severity === 'PIVOTAL' && !result.passed)) reasons.push('PIVOTAL_RULE_FAILED');
    if (receipt.metrics.constraintViolations.length > 0) reasons.push('CONSTRAINT_VIOLATIONS_PRESENT');
    if (receipt.metrics.forbiddenMutations.length > 0) reasons.push('FORBIDDEN_MUTATIONS_PRESENT');
    if (receipt.metrics.decisionRegret.value > configCore.thresholds.maximumDecisionRegret) reasons.push('DECISION_REGRET_ABOVE_POLICY');

    for (const regimeId of configCore.thresholds.requiredRegimeIds) {
      if (!receipt.regimeCoverage.some((coverage) => coverage.regimeId === regimeId && coverage.status === 'COVERED' && coverage.caseCount > 0)) {
        reasons.push(`REQUIRED_REGIME_NOT_COVERED:${regimeId}`);
      }
    }
    if (receipt.authorityRequest === 'CANONICAL_ADMISSION_ELIGIBILITY' && configCore.evaluatorIsolation === 'IN_PROCESS') {
      reasons.push('INSUFFICIENT_EVALUATOR_ISOLATION');
    }

    const uniqueReasons = [...new Set(reasons)].sort();
    const decision: LockedPromotionDecisionCode = uniqueReasons.length > 0
      ? 'REJECTED'
      : receipt.authorityRequest === 'SANDBOX_EVALUATION'
        ? 'SANDBOX_VERIFIED'
        : 'ELIGIBLE_FOR_HUMAN_REVIEW';
    const expectedReceiptDecision = decision === 'REJECTED'
      ? 'DENIED'
      : decision === 'SANDBOX_VERIFIED'
        ? 'SANDBOX_ONLY'
        : 'ELIGIBLE_FOR_HUMAN_REVIEW';
    if (receipt.authorityDecision !== expectedReceiptDecision) {
      uniqueReasons.push('AUTHORITY_DECISION_MISMATCH');
    }
    const finalDecision: LockedPromotionDecisionCode = uniqueReasons.length > 0 ? 'REJECTED' : decision;
    const core = {
      schema: 'worldgen-locked-promotion-decision-v1' as const,
      evaluatorConfigHash: configHash,
      evaluationReceiptHash: receipt.receiptHash,
      attestationHash: input.attestation.attestationHash,
      decision: finalDecision,
      canonicalStateEligible: finalDecision === 'ELIGIBLE_FOR_HUMAN_REVIEW',
      requiresHumanAuthority: finalDecision === 'ELIGIBLE_FOR_HUMAN_REVIEW',
      reasons: Object.freeze(uniqueReasons),
    };
    return Object.freeze({ ...core, decisionHash: await hashCanonical(core) });
  };

  return Object.freeze({
    config: Object.freeze(configCore),
    configHash,
    verify,
  });
}
