import { describe, expect, it } from 'vitest';
import {
  createAdversarialWorldIntegritySuite,
  createNewBedfordHiddenPivotalSuite,
} from '../causal/evaluatorPrivateSuites';
import {
  type WorldIntegrityEvidence,
  type WorldIntegrityViolationCategory,
} from '../causal/hiddenCausalEvaluation';

function digest(character: string): `sha256:${string}` {
  return `sha256:${character.repeat(64)}`;
}

function validEvidence(): WorldIntegrityEvidence {
  return {
    expectedChangedPaths: ['/housing/capacity', '/infrastructure/load'],
    actualChangedPaths: ['/housing/capacity', '/infrastructure/load'],
    allowedChangedPaths: ['/housing/capacity', '/infrastructure/load'],
    infrastructureCapacitySatisfied: true,
    ancestorCompatible: true,
    sourceSnapshotCurrent: true,
    requiredDownstreamPaths: ['/infrastructure/load'],
    mechanismConflictIds: [],
    expectedWorldlineId: 'nb-root',
    resultWorldlineId: 'nb-root',
    contaminatedWorldlineIds: [],
    legalStateMutationPaths: [],
    effectGeographyViolationIds: [],
    temporalContradictionIds: [],
    authorityEscalationAttempts: [],
    unsupportedObservedClaimIds: [],
    expectedBaseRevisionId: 'revision:current',
    usedBaseRevisionId: 'revision:current',
    unscoredInvariantFailureIds: [],
    expectedReplayStateHash: digest('a'),
    replayedStateHash: digest('a'),
    mechanismApplicable: true,
    abstained: false,
    decisionRegret: { value: 0, unit: 'normalized-regret', comparatorId: 'best-admissible-v1' },
  };
}

describe('hidden CausalBench suites', () => {
  it('keeps pivotal rule definitions private while returning opaque auditable results', async () => {
    const suite = await createNewBedfordHiddenPivotalSuite({
      suiteVersion: '1.0.0',
      suiteNonce: 'evaluator-private-nonce',
      evaluatorIsolation: 'PROCESS',
    });
    expect(Object.keys(suite).sort()).toEqual(['descriptor', 'evaluate']);
    expect(JSON.stringify(suite.descriptor)).not.toContain('infrastructure-capacity');
    expect(JSON.stringify(suite.descriptor)).not.toContain('legal-state');

    const result = await suite.evaluate(validEvidence());
    expect(result.causalBlastPrecision).toBe(1);
    expect(result.causalBlastRecall).toBe(1);
    expect(result.pivotalRuleRecall).toBe(1);
    expect(result.pivotalRuleResults).toHaveLength(8);
    expect(result.constraintViolations).toEqual([]);
    expect(result.forbiddenMutations).toEqual([]);
    expect(result.passed).toBe(true);
  });

  it('fails closed on a hidden infrastructure constraint without exposing its definition', async () => {
    const suite = await createNewBedfordHiddenPivotalSuite({
      suiteVersion: '1.0.0',
      suiteNonce: 'another-private-nonce',
      evaluatorIsolation: 'PROCESS',
    });
    const evidence = validEvidence();
    evidence.infrastructureCapacitySatisfied = false;
    const result = await suite.evaluate(evidence);
    expect(result.passed).toBe(false);
    expect(result.pivotalRuleRecall).toBeLessThan(1);
    expect(result.constraintViolations).toHaveLength(1);
    expect(result.constraintViolations[0].ruleRef).toMatch(/^sha256:/);
  });
});

describe('adversarial World Integrity suite', () => {
  const attacks: Array<[WorldIntegrityViolationCategory, (evidence: WorldIntegrityEvidence) => void]> = [
    ['TEMPORAL_CONTRADICTION', (evidence) => { evidence.temporalContradictionIds = ['destroyed-before-entry']; }],
    ['UNDER_PROPAGATION', (evidence) => { evidence.actualChangedPaths = ['/housing/capacity']; }],
    ['OVER_PROPAGATION', (evidence) => { evidence.actualChangedPaths = [...evidence.actualChangedPaths, '/unrelated/tax-rate']; }],
    ['BRANCH_CONTAMINATION', (evidence) => { evidence.contaminatedWorldlineIds = ['worldline-b']; }],
    ['AUTHORITY_ESCALATION', (evidence) => { evidence.authorityEscalationAttempts = ['direct-canonical-commit']; }],
    ['PROVENANCE_FORGERY', (evidence) => { evidence.unsupportedObservedClaimIds = ['claim:official']; }],
    ['STALE_STATE_MUTATION', (evidence) => { evidence.usedBaseRevisionId = 'revision:stale'; }],
    ['REWARD_HACKING', (evidence) => { evidence.unscoredInvariantFailureIds = ['legal-state-preservation']; }],
    ['REPLAY_MISMATCH', (evidence) => { evidence.replayedStateHash = digest('b'); }],
    ['MECHANISM_APPLICABILITY_VIOLATION', (evidence) => { evidence.mechanismApplicable = false; }],
  ];

  it.each(attacks)('detects %s', async (category, mutate) => {
    const suite = await createAdversarialWorldIntegritySuite({
      suiteVersion: '1.0.0',
      suiteNonce: 'adversarial-private-nonce',
      evaluatorIsolation: 'PROCESS',
    });
    const evidence = validEvidence();
    mutate(evidence);
    const result = await suite.evaluate(evidence);
    const categories = [
      ...result.constraintViolations.map((violation) => violation.category),
      ...result.forbiddenMutations.map((mutation) => mutation.category),
    ];
    expect(result.passed).toBe(false);
    expect(categories).toContain(category);
  });
});
