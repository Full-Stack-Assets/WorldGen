import { canonicalize, hashCanonical, type Sha256Digest } from './canonicalJson';

export type CausalBenchAuthorityRequest = 'SANDBOX_EVALUATION' | 'CANONICAL_ADMISSION_ELIGIBILITY';
export type CausalBenchAuthorityDecision = 'DENIED' | 'SANDBOX_ONLY' | 'ELIGIBLE_FOR_HUMAN_REVIEW';
export type CausalBenchComplexity = 'SINGLE_STEP' | 'MULTI_HOP' | 'CROSS_DOMAIN' | 'LONG_HORIZON';
export type EvaluatorIsolation = 'IN_PROCESS' | 'PROCESS' | 'SERVICE';

export type CausalBenchViolationCategory =
  | 'INFRASTRUCTURE_CAPACITY'
  | 'ANCESTOR_INCOMPATIBILITY'
  | 'STALE_SOURCE_SNAPSHOT'
  | 'DOWNSTREAM_DEPENDENCY_MISS'
  | 'MECHANISM_VERSION_CONFLICT'
  | 'WRONG_WORLDLINE'
  | 'LEGAL_STATE_MUTATION'
  | 'GEOGRAPHY_OVERREACH'
  | 'TEMPORAL_CONTRADICTION'
  | 'UNDER_PROPAGATION'
  | 'OVER_PROPAGATION'
  | 'BRANCH_CONTAMINATION'
  | 'AUTHORITY_ESCALATION'
  | 'PROVENANCE_FORGERY'
  | 'STALE_STATE_MUTATION'
  | 'REWARD_HACKING'
  | 'REPLAY_MISMATCH'
  | 'MECHANISM_APPLICABILITY_VIOLATION';

export interface CausalBenchCandidateIdentity {
  candidateId: string;
  producerId: string;
  model: Readonly<{ provider: string; model: string; version: string }>;
}

export interface CausalBenchRegimeCoverage {
  regimeId: string;
  taskFamily: string;
  complexity: CausalBenchComplexity;
  status: 'COVERED' | 'PARTIAL' | 'OUT_OF_SCOPE';
  caseCount: number;
}

export interface PivotalRuleResult {
  ruleRef: Sha256Digest;
  category: CausalBenchViolationCategory;
  passed: boolean;
  severity: 'PIVOTAL' | 'MAJOR' | 'MINOR';
  evidenceDigest: Sha256Digest;
}

export interface CausalConstraintViolation {
  ruleRef: Sha256Digest;
  category: CausalBenchViolationCategory;
  count: number;
  evidenceDigest: Sha256Digest;
}

export interface ForbiddenStateMutation {
  path: string;
  category: CausalBenchViolationCategory;
  evidenceDigest: Sha256Digest;
}

export interface DecisionRegret {
  value: number;
  unit: string;
  comparatorId: string;
}

export interface CausalBenchEvaluationMetrics {
  causalBlastPrecision: number;
  causalBlastRecall: number;
  pivotalRuleRecall: number;
  pivotalRuleResults: readonly PivotalRuleResult[];
  constraintViolations: readonly CausalConstraintViolation[];
  forbiddenMutations: readonly ForbiddenStateMutation[];
  decisionRegret: Readonly<DecisionRegret>;
  cost: Readonly<{ amount: number; currency: 'USD' }>;
  latencyMs: number;
  retryCount: number;
}

export interface CausalBenchEvaluationReceiptCore {
  schema: 'worldgen-causalbench-evaluation-receipt-v1';
  receiptSchemaVersion: '1.0.0';
  candidate: CausalBenchCandidateIdentity;
  inputStateHash: Sha256Digest;
  proposalHash: Sha256Digest;
  resultingStateHash: Sha256Digest;
  benchmarkSuiteId: string;
  benchmarkSuiteVersion: string;
  hiddenSuiteIdentifier: Sha256Digest;
  evaluatorId: string;
  evaluatorVersion: string;
  evaluatorConfigHash: Sha256Digest;
  policyVersion: string;
  regimeCoverage: readonly CausalBenchRegimeCoverage[];
  metrics: CausalBenchEvaluationMetrics;
  seedProfile: Readonly<{ prngId: string; rootSeed: string | null; streamRefs: readonly string[] }>;
  runtimeProfile: Readonly<{
    runtimeId: string;
    dependencyLockHash: Sha256Digest;
    evaluatorIsolation: EvaluatorIsolation;
  }>;
  runId: string;
  evaluatedAt: string;
  authorityRequest: CausalBenchAuthorityRequest;
  authorityDecision: CausalBenchAuthorityDecision;
}

export interface CausalBenchEvaluationReceipt extends CausalBenchEvaluationReceiptCore {
  receiptHash: Sha256Digest;
}

export interface EvaluatorAttestationCore {
  schema: 'worldgen-causalbench-evaluator-attestation-v1';
  algorithm: 'Ed25519';
  keyId: string;
  receiptHash: Sha256Digest;
  evaluatorId: string;
  evaluatorVersion: string;
  evaluatorConfigHash: Sha256Digest;
}

export interface EvaluatorAttestation extends EvaluatorAttestationCore {
  signature: string;
  attestationHash: Sha256Digest;
}

function requireIdentity(value: string, field: string): string {
  const normalized = value.normalize('NFC').trim();
  if (!normalized) throw new Error(`${field} is required`);
  return normalized;
}

function requireDigest(value: string, field: string): asserts value is Sha256Digest {
  if (!/^sha256:[0-9a-f]{64}$/i.test(value)) throw new Error(`${field} must be a SHA-256 digest reference`);
}

function requireUnitInterval(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error(`${field} must be between zero and one`);
}

function requireFiniteNonNegative(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${field} must be finite and non-negative`);
}

function validateMetrics(metrics: CausalBenchEvaluationMetrics): void {
  requireUnitInterval(metrics.causalBlastPrecision, 'causalBlastPrecision');
  requireUnitInterval(metrics.causalBlastRecall, 'causalBlastRecall');
  requireUnitInterval(metrics.pivotalRuleRecall, 'pivotalRuleRecall');
  requireFiniteNonNegative(metrics.decisionRegret.value, 'decisionRegret');
  requireFiniteNonNegative(metrics.cost.amount, 'cost');
  requireFiniteNonNegative(metrics.latencyMs, 'latencyMs');
  requireIdentity(metrics.decisionRegret.unit, 'decisionRegret unit');
  requireIdentity(metrics.decisionRegret.comparatorId, 'decisionRegret comparatorId');
  if (metrics.cost.currency !== 'USD') throw new Error('CausalBench cost currency must be USD');
  if (!Number.isSafeInteger(metrics.retryCount) || metrics.retryCount < 0) throw new Error('retryCount must be a non-negative integer');
  for (const result of metrics.pivotalRuleResults) {
    requireDigest(result.ruleRef, 'pivotal rule reference');
    requireDigest(result.evidenceDigest, 'pivotal rule evidence');
  }
  for (const violation of metrics.constraintViolations) {
    requireDigest(violation.ruleRef, 'constraint rule reference');
    requireDigest(violation.evidenceDigest, 'constraint evidence');
    if (!Number.isSafeInteger(violation.count) || violation.count <= 0) throw new Error('Constraint violation count must be positive');
  }
  for (const mutation of metrics.forbiddenMutations) {
    requireIdentity(mutation.path, 'Forbidden mutation path');
    requireDigest(mutation.evidenceDigest, 'forbidden mutation evidence');
  }
  const ruleRefs = metrics.pivotalRuleResults.map(({ ruleRef }) => ruleRef);
  if (new Set(ruleRefs).size !== ruleRefs.length) throw new Error('Pivotal rule results must have unique rule references');
  const pivotal = metrics.pivotalRuleResults.filter(({ severity }) => severity === 'PIVOTAL');
  const calculatedRecall = pivotal.length === 0
    ? 0
    : Number((pivotal.filter(({ passed }) => passed).length / pivotal.length).toFixed(6));
  if (metrics.pivotalRuleRecall !== calculatedRecall) throw new Error('pivotalRuleRecall does not match pivotal rule results');
}

function validateReceiptCore(core: CausalBenchEvaluationReceiptCore): void {
  validateMetrics(core.metrics);
  requireIdentity(core.candidate.candidateId, 'candidateId');
  requireIdentity(core.candidate.producerId, 'producerId');
  requireIdentity(core.candidate.model.provider, 'model provider');
  requireIdentity(core.candidate.model.model, 'model');
  requireIdentity(core.candidate.model.version, 'model version');
  requireIdentity(core.benchmarkSuiteId, 'benchmarkSuiteId');
  requireIdentity(core.benchmarkSuiteVersion, 'benchmarkSuiteVersion');
  requireIdentity(core.evaluatorId, 'evaluatorId');
  requireIdentity(core.evaluatorVersion, 'evaluatorVersion');
  requireIdentity(core.policyVersion, 'policyVersion');
  requireIdentity(core.seedProfile.prngId, 'seedProfile prngId');
  requireIdentity(core.runtimeProfile.runtimeId, 'runtimeProfile runtimeId');
  requireIdentity(core.runId, 'runId');
  requireDigest(core.inputStateHash, 'inputStateHash');
  requireDigest(core.proposalHash, 'proposalHash');
  requireDigest(core.resultingStateHash, 'resultingStateHash');
  requireDigest(core.hiddenSuiteIdentifier, 'hiddenSuiteIdentifier');
  requireDigest(core.evaluatorConfigHash, 'evaluatorConfigHash');
  requireDigest(core.runtimeProfile.dependencyLockHash, 'dependencyLockHash');
  if (!['IN_PROCESS', 'PROCESS', 'SERVICE'].includes(core.runtimeProfile.evaluatorIsolation)) throw new Error('Unknown evaluator isolation');
  if (!['SANDBOX_EVALUATION', 'CANONICAL_ADMISSION_ELIGIBILITY'].includes(core.authorityRequest)) throw new Error('Unknown authority request');
  if (!['DENIED', 'SANDBOX_ONLY', 'ELIGIBLE_FOR_HUMAN_REVIEW'].includes(core.authorityDecision)) throw new Error('Unknown authority decision');
  if (core.authorityRequest === 'SANDBOX_EVALUATION' && core.authorityDecision === 'ELIGIBLE_FOR_HUMAN_REVIEW') throw new Error('Authority decision exceeds request');
  if (core.authorityRequest === 'CANONICAL_ADMISSION_ELIGIBILITY' && core.authorityDecision === 'SANDBOX_ONLY') throw new Error('Authority decision does not match request');
  const parsedTimestamp = new Date(core.evaluatedAt);
  if (Number.isNaN(parsedTimestamp.valueOf()) || parsedTimestamp.toISOString() !== core.evaluatedAt) throw new Error('evaluatedAt must be a canonical ISO timestamp');
  for (const regime of core.regimeCoverage) {
    requireIdentity(regime.regimeId, 'regimeId');
    requireIdentity(regime.taskFamily, 'taskFamily');
    if (!['SINGLE_STEP', 'MULTI_HOP', 'CROSS_DOMAIN', 'LONG_HORIZON'].includes(regime.complexity)) throw new Error('Unknown regime complexity');
    if (!['COVERED', 'PARTIAL', 'OUT_OF_SCOPE'].includes(regime.status)) throw new Error('Unknown regime coverage status');
    if (!Number.isSafeInteger(regime.caseCount) || regime.caseCount < 0) throw new Error('Regime caseCount must be a non-negative integer');
  }
}

function authorityDecision(request: CausalBenchAuthorityRequest, passed: boolean): CausalBenchAuthorityDecision {
  if (!passed) return 'DENIED';
  return request === 'SANDBOX_EVALUATION' ? 'SANDBOX_ONLY' : 'ELIGIBLE_FOR_HUMAN_REVIEW';
}

function receiptCore(receipt: CausalBenchEvaluationReceipt): CausalBenchEvaluationReceiptCore {
  const { receiptHash: _receiptHash, ...core } = receipt;
  return core;
}

function orderedMetrics(source: CausalBenchEvaluationMetrics): CausalBenchEvaluationMetrics {
  const metrics = structuredClone(source);
  metrics.pivotalRuleResults = [...metrics.pivotalRuleResults]
    .sort((left, right) => left.ruleRef.localeCompare(right.ruleRef) || left.category.localeCompare(right.category));
  metrics.constraintViolations = [...metrics.constraintViolations]
    .sort((left, right) => left.ruleRef.localeCompare(right.ruleRef) || left.category.localeCompare(right.category));
  metrics.forbiddenMutations = [...metrics.forbiddenMutations]
    .sort((left, right) => left.path.localeCompare(right.path) || left.category.localeCompare(right.category));
  return metrics;
}

export async function createCausalBenchEvaluationReceipt(input: {
  candidate: CausalBenchCandidateIdentity;
  inputState: unknown;
  proposal: unknown;
  resultingState: unknown;
  benchmark: Readonly<{ suiteId: string; suiteVersion: string; hiddenSuiteIdentifier: Sha256Digest }>;
  evaluator: Readonly<{
    evaluatorId: string;
    evaluatorVersion: string;
    evaluatorConfigHash: Sha256Digest;
    policyVersion: string;
  }>;
  regimeCoverage: readonly CausalBenchRegimeCoverage[];
  metrics: CausalBenchEvaluationMetrics;
  seedProfile: CausalBenchEvaluationReceiptCore['seedProfile'];
  runtimeProfile: CausalBenchEvaluationReceiptCore['runtimeProfile'];
  runId: string;
  evaluatedAt: string;
  authorityRequest: CausalBenchAuthorityRequest;
  evaluationPassed: boolean;
}): Promise<CausalBenchEvaluationReceipt> {
  requireDigest(input.benchmark.hiddenSuiteIdentifier, 'hiddenSuiteIdentifier');
  requireDigest(input.evaluator.evaluatorConfigHash, 'evaluatorConfigHash');
  requireDigest(input.runtimeProfile.dependencyLockHash, 'dependencyLockHash');
  const core: CausalBenchEvaluationReceiptCore = {
    schema: 'worldgen-causalbench-evaluation-receipt-v1',
    receiptSchemaVersion: '1.0.0',
    candidate: {
      candidateId: requireIdentity(input.candidate.candidateId, 'candidateId'),
      producerId: requireIdentity(input.candidate.producerId, 'producerId'),
      model: {
        provider: requireIdentity(input.candidate.model.provider, 'model provider'),
        model: requireIdentity(input.candidate.model.model, 'model'),
        version: requireIdentity(input.candidate.model.version, 'model version'),
      },
    },
    inputStateHash: await hashCanonical(input.inputState),
    proposalHash: await hashCanonical(input.proposal),
    resultingStateHash: await hashCanonical(input.resultingState),
    benchmarkSuiteId: requireIdentity(input.benchmark.suiteId, 'benchmarkSuiteId'),
    benchmarkSuiteVersion: requireIdentity(input.benchmark.suiteVersion, 'benchmarkSuiteVersion'),
    hiddenSuiteIdentifier: input.benchmark.hiddenSuiteIdentifier,
    evaluatorId: requireIdentity(input.evaluator.evaluatorId, 'evaluatorId'),
    evaluatorVersion: requireIdentity(input.evaluator.evaluatorVersion, 'evaluatorVersion'),
    evaluatorConfigHash: input.evaluator.evaluatorConfigHash,
    policyVersion: requireIdentity(input.evaluator.policyVersion, 'policyVersion'),
    regimeCoverage: input.regimeCoverage.map((regime) => ({
      ...structuredClone(regime),
      regimeId: requireIdentity(regime.regimeId, 'regimeId'),
      taskFamily: requireIdentity(regime.taskFamily, 'taskFamily'),
    }))
      .sort((left, right) => left.regimeId.localeCompare(right.regimeId) || left.taskFamily.localeCompare(right.taskFamily)),
    metrics: orderedMetrics(input.metrics),
    seedProfile: {
      ...structuredClone(input.seedProfile),
      streamRefs: [...new Set(input.seedProfile.streamRefs)].sort(),
    },
    runtimeProfile: {
      ...structuredClone(input.runtimeProfile),
      runtimeId: requireIdentity(input.runtimeProfile.runtimeId, 'runtimeProfile runtimeId'),
    },
    runId: requireIdentity(input.runId, 'runId'),
    evaluatedAt: input.evaluatedAt,
    authorityRequest: input.authorityRequest,
    authorityDecision: authorityDecision(input.authorityRequest, input.evaluationPassed),
  };
  validateReceiptCore(core);
  return Object.freeze({ ...core, receiptHash: await hashCanonical(core) });
}

export async function verifyCausalBenchEvaluationReceiptHash(receipt: CausalBenchEvaluationReceipt): Promise<boolean> {
  try {
    if (receipt.schema !== 'worldgen-causalbench-evaluation-receipt-v1' || receipt.receiptSchemaVersion !== '1.0.0') return false;
    validateReceiptCore(receipt);
    requireDigest(receipt.receiptHash, 'receiptHash');
    return await hashCanonical(receiptCore(receipt)) === receipt.receiptHash;
  } catch {
    return false;
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export async function attestCausalBenchEvaluation(
  receipt: CausalBenchEvaluationReceipt,
  identity: Readonly<{ keyId: string; privateKey: CryptoKey }>,
): Promise<EvaluatorAttestation> {
  if (!await verifyCausalBenchEvaluationReceiptHash(receipt)) throw new Error('Cannot attest an invalid evaluation receipt');
  if (identity.privateKey.type !== 'private' || !identity.privateKey.usages.includes('sign')) throw new Error('Evaluator signing key is invalid');
  if (identity.privateKey.algorithm.name !== 'Ed25519') throw new Error('Evaluator signing key must use Ed25519');
  const core: EvaluatorAttestationCore = {
    schema: 'worldgen-causalbench-evaluator-attestation-v1',
    algorithm: 'Ed25519',
    keyId: requireIdentity(identity.keyId, 'attestation keyId'),
    receiptHash: receipt.receiptHash,
    evaluatorId: receipt.evaluatorId,
    evaluatorVersion: receipt.evaluatorVersion,
    evaluatorConfigHash: receipt.evaluatorConfigHash,
  };
  const signatureBytes = await crypto.subtle.sign('Ed25519', identity.privateKey, new TextEncoder().encode(canonicalize(core)));
  const signature = bytesToBase64(new Uint8Array(signatureBytes));
  return Object.freeze({ ...core, signature, attestationHash: await hashCanonical({ ...core, signature }) });
}

export async function verifyCausalBenchAttestation(
  receipt: CausalBenchEvaluationReceipt,
  attestation: EvaluatorAttestation,
  publicKey: CryptoKey,
): Promise<boolean> {
  try {
    if (!await verifyCausalBenchEvaluationReceiptHash(receipt)) return false;
    if (publicKey.type !== 'public' || !publicKey.usages.includes('verify')) return false;
    if (publicKey.algorithm.name !== 'Ed25519') return false;
    if (attestation.schema !== 'worldgen-causalbench-evaluator-attestation-v1' || attestation.algorithm !== 'Ed25519') return false;
    if (attestation.receiptHash !== receipt.receiptHash
      || attestation.evaluatorId !== receipt.evaluatorId
      || attestation.evaluatorVersion !== receipt.evaluatorVersion
      || attestation.evaluatorConfigHash !== receipt.evaluatorConfigHash) return false;
    const { signature, attestationHash, ...core } = attestation;
    if (await hashCanonical({ ...core, signature }) !== attestationHash) return false;
    return await crypto.subtle.verify(
      'Ed25519',
      publicKey,
      base64ToBytes(signature),
      new TextEncoder().encode(canonicalize(core)),
    );
  } catch {
    return false;
  }
}
