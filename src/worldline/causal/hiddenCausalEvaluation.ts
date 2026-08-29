import { hashCanonical, type Sha256Digest } from './canonicalJson';
import type {
  CausalBenchEvaluationMetrics,
  CausalBenchViolationCategory,
  CausalConstraintViolation,
  EvaluatorIsolation,
  ForbiddenStateMutation,
  PivotalRuleResult,
} from './causalBenchAttestation';

export type WorldIntegrityViolationCategory = CausalBenchViolationCategory;

export interface WorldIntegrityEvidence {
  expectedChangedPaths: string[];
  actualChangedPaths: string[];
  allowedChangedPaths: string[];
  infrastructureCapacitySatisfied: boolean;
  ancestorCompatible: boolean;
  sourceSnapshotCurrent: boolean;
  requiredDownstreamPaths: string[];
  mechanismConflictIds: string[];
  expectedWorldlineId: string;
  resultWorldlineId: string;
  contaminatedWorldlineIds: string[];
  legalStateMutationPaths: string[];
  effectGeographyViolationIds: string[];
  temporalContradictionIds: string[];
  authorityEscalationAttempts: string[];
  unsupportedObservedClaimIds: string[];
  expectedBaseRevisionId: string;
  usedBaseRevisionId: string;
  unscoredInvariantFailureIds: string[];
  expectedReplayStateHash: Sha256Digest;
  replayedStateHash: Sha256Digest;
  mechanismApplicable: boolean;
  abstained: boolean;
  decisionRegret: Readonly<{ value: number; unit: string; comparatorId: string }>;
}

export interface HiddenEvaluationSuiteDescriptor {
  schema: 'worldgen-hidden-evaluation-suite-descriptor-v1';
  suiteId: string;
  suiteVersion: string;
  taskFamily: string;
  caseCount: number;
  hiddenSuiteIdentifier: Sha256Digest;
  frozenBeforeProposal: true;
  evaluatorIsolation: EvaluatorIsolation;
}

export interface HiddenEvaluationSummary extends CausalBenchEvaluationMetrics {
  suiteId: string;
  suiteVersion: string;
  hiddenSuiteIdentifier: Sha256Digest;
  passed: boolean;
  abstained: boolean;
}

export interface HiddenEvaluationSuite {
  descriptor: Readonly<HiddenEvaluationSuiteDescriptor>;
  evaluate(evidence: WorldIntegrityEvidence): Promise<HiddenEvaluationSummary>;
}

export interface EvaluatorPrivateWorldIntegrityRule {
  internalId: string;
  category: CausalBenchViolationCategory;
  severity: PivotalRuleResult['severity'];
  violationKind: 'CONSTRAINT' | 'FORBIDDEN_MUTATION';
  passes(evidence: WorldIntegrityEvidence): boolean;
  mutationPaths?(evidence: WorldIntegrityEvidence): readonly string[];
}

interface BoundPrivateRule extends EvaluatorPrivateWorldIntegrityRule {
  ruleRef: Sha256Digest;
}

function intersectionSize(left: ReadonlySet<string>, right: ReadonlySet<string>): number {
  let count = 0;
  for (const value of left) if (right.has(value)) count += 1;
  return count;
}

function ratio(numerator: number, denominator: number, emptyValue: number): number {
  return denominator === 0 ? emptyValue : Number((numerator / denominator).toFixed(6));
}

function requireSuiteIdentity(value: string, field: string): string {
  const normalized = value.normalize('NFC').trim();
  if (!normalized) throw new Error(`${field} is required`);
  return normalized;
}

export async function createEvaluatorPrivateHiddenSuite(input: {
  suiteId: string;
  suiteVersion: string;
  taskFamily: string;
  suiteNonce: string;
  evaluatorIsolation: EvaluatorIsolation;
  rules: readonly EvaluatorPrivateWorldIntegrityRule[];
}): Promise<HiddenEvaluationSuite> {
  if (input.rules.length === 0) throw new Error('Hidden evaluation suite requires private rules');
  const suiteId = requireSuiteIdentity(input.suiteId, 'suiteId');
  const suiteVersion = requireSuiteIdentity(input.suiteVersion, 'suiteVersion');
  const nonce = requireSuiteIdentity(input.suiteNonce, 'suiteNonce');
  const identities = input.rules.map((rule) => ({
    internalId: requireSuiteIdentity(rule.internalId, 'private rule id'),
    category: rule.category,
    severity: rule.severity,
    violationKind: rule.violationKind,
  }));
  if (new Set(identities.map(({ internalId }) => internalId)).size !== identities.length) throw new Error('Hidden rule identities must be unique');
  const hiddenSuiteIdentifier = await hashCanonical({
    domain: 'WORLDGEN_HIDDEN_CAUSAL_EVALUATION_V1',
    suiteId,
    suiteVersion,
    nonce,
    rules: identities,
  });
  const boundRules: readonly BoundPrivateRule[] = Object.freeze(await Promise.all(input.rules.map(async (rule) => Object.freeze({
    ...rule,
    ruleRef: await hashCanonical({ hiddenSuiteIdentifier, internalId: rule.internalId }),
  }))));
  const descriptor: HiddenEvaluationSuiteDescriptor = Object.freeze({
    schema: 'worldgen-hidden-evaluation-suite-descriptor-v1',
    suiteId,
    suiteVersion,
    taskFamily: requireSuiteIdentity(input.taskFamily, 'taskFamily'),
    caseCount: boundRules.length,
    hiddenSuiteIdentifier,
    frozenBeforeProposal: true,
    evaluatorIsolation: input.evaluatorIsolation,
  });

  const evaluate = async (sourceEvidence: WorldIntegrityEvidence): Promise<HiddenEvaluationSummary> => {
    const evidence = structuredClone(sourceEvidence);
    if (!/^sha256:[0-9a-f]{64}$/i.test(evidence.expectedReplayStateHash)
      || !/^sha256:[0-9a-f]{64}$/i.test(evidence.replayedStateHash)) {
      throw new Error('World-integrity replay evidence requires SHA-256 state hashes');
    }
    const expected = new Set(evidence.expectedChangedPaths);
    const actual = new Set(evidence.actualChangedPaths);
    const overlap = intersectionSize(expected, actual);
    const causalBlastPrecision = ratio(overlap, actual.size, expected.size === 0 ? 1 : 0);
    const causalBlastRecall = ratio(overlap, expected.size, 1);
    const pivotalRuleResults: PivotalRuleResult[] = [];
    const constraintViolations: CausalConstraintViolation[] = [];
    const forbiddenMutations: ForbiddenStateMutation[] = [];

    for (const rule of boundRules) {
      let passed = false;
      try {
        passed = rule.passes(evidence);
      } catch {
        passed = false;
      }
      const evidenceDigest = await hashCanonical({
        hiddenSuiteIdentifier,
        ruleRef: rule.ruleRef,
        passed,
        evidence,
      });
      pivotalRuleResults.push({
        ruleRef: rule.ruleRef,
        category: rule.category,
        passed,
        severity: rule.severity,
        evidenceDigest,
      });
      if (passed) continue;
      if (rule.violationKind === 'CONSTRAINT') {
        constraintViolations.push({ ruleRef: rule.ruleRef, category: rule.category, count: 1, evidenceDigest });
      } else {
        const paths = [...new Set(rule.mutationPaths?.(evidence) ?? [`category:${rule.category}`])].sort();
        for (const path of paths) forbiddenMutations.push({ path, category: rule.category, evidenceDigest });
      }
    }
    const pivotal = pivotalRuleResults.filter((result) => result.severity === 'PIVOTAL');
    const pivotalRuleRecall = ratio(pivotal.filter((result) => result.passed).length, pivotal.length, 0);
    const passed = !evidence.abstained
      && pivotalRuleResults.every((result) => result.passed)
      && constraintViolations.length === 0
      && forbiddenMutations.length === 0;
    return Object.freeze({
      suiteId,
      suiteVersion,
      hiddenSuiteIdentifier,
      causalBlastPrecision,
      causalBlastRecall,
      pivotalRuleRecall,
      pivotalRuleResults: Object.freeze(pivotalRuleResults),
      constraintViolations: Object.freeze(constraintViolations),
      forbiddenMutations: Object.freeze(forbiddenMutations),
      decisionRegret: structuredClone(evidence.decisionRegret),
      cost: Object.freeze({ amount: 0, currency: 'USD' as const }),
      latencyMs: 0,
      retryCount: 0,
      passed,
      abstained: evidence.abstained,
    });
  };

  return Object.freeze({ descriptor, evaluate });
}
