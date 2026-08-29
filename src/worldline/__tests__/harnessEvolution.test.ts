import { describe, expect, it } from 'vitest';
import { hashCanonical } from '../causal/canonicalJson';
import {
  HarnessEvolutionLab,
  hashHarnessSpec,
  type HarnessEvaluation,
  type HarnessSpec,
} from '../harnessEvolution';

function spec(): HarnessSpec {
  return {
    schema: 'worldline-harness-spec-v1', harnessKey: 'mechanism-author', version: '1.0.0',
    modelRouting: { allowedModelFamilies: ['fixed-model'], policy: 'FIXED' },
    memory: { kind: 'EPISODIC', maxItems: 24 },
    contextConstructor: { strategy: 'CHECKPOINT', maxTokens: 4_000 },
    planningPolicy: 'PLAN_THEN_ACT', actionProtocol: 'TRANSITION_PROPOSALS',
    skills: ['causal-authoring'], tools: ['sandbox'],
    subagents: { allowed: false, maxConcurrent: 0, maxDepth: 0 },
    compaction: { enabled: true, preserveAuthoritativeState: true },
    retry: { maxAttempts: 2, backoff: 'EXPONENTIAL' },
    stopping: { maxNoProgressTurns: 2, requireVerifierPass: true },
    budget: { maxTokens: 10_000, maxCostUsd: 2, maxLatencyMs: 30_000, maxTurns: 20 },
    verifier: { verifierId: 'fixed-evaluator', configDigest: 'sha256:evaluator', frozen: true },
    authorityCeiling: 'SANDBOX_WRITE',
  };
}

function evaluation(harnessHash: `sha256:${string}`, evaluatorDigest: `sha256:${string}`, passed: number, overrides: Partial<HarnessEvaluation> = {}): HarnessEvaluation {
  return {
    harnessHash, evaluatorDigest, split: 'HELD_OUT', taskFamily: 'causal-transition', modelFamily: 'fixed-model',
    cases: 100, passed, meanTokens: 1_000, meanCostUsd: 0.2, meanLatencyMs: 1_000, ...overrides,
  };
}

describe('HarnessEvolutionLab', () => {
  it('retains a held-out improvement under frozen authority, cost, latency, and token gates', async () => {
    const initial = spec();
    const evaluatorDigest = await hashCanonical({ evaluator: 'v1' });
    const lab = await HarnessEvolutionLab.create({ evaluatorDigest, minimumHeldOutImprovement: 0.05, maximumCostRegression: 0.1, maximumLatencyRegression: 0.1, maximumTokenRegression: 0.1 }, initial);
    const parentHash = await hashHarnessSpec(initial);
    const mutation = { schema: 'worldline-harness-mutation-v1' as const, mutationId: 'guided', parentHash, rationale: 'Use verifier feedback', patch: { planningPolicy: 'VERIFIER_GUIDED' as const } };
    const candidate = { ...initial, version: '1.0.0+guided', planningPolicy: 'VERIFIER_GUIDED' as const };
    const candidateHash = await hashHarnessSpec(candidate);
    const result = await lab.evaluateMutation(mutation, evaluation(parentHash, evaluatorDigest, 60), evaluation(candidateHash, evaluatorDigest, 70));
    expect(result.accepted).toBe(true);
    expect(lab.currentChampion().hash).toBe(candidateHash);
    expect(lab.archive().map((entry) => entry.decision)).toEqual(['CHAMPION', 'CHAMPION']);
  });

  it('rejects authority expansion and resource regression while retaining the champion', async () => {
    const initial = spec();
    const evaluatorDigest = await hashCanonical({ evaluator: 'v1' });
    const lab = await HarnessEvolutionLab.create({ evaluatorDigest, minimumHeldOutImprovement: 0.01, maximumCostRegression: 0.1, maximumLatencyRegression: 0.1, maximumTokenRegression: 0.1 }, initial);
    const parentHash = await hashHarnessSpec(initial);
    const candidate = { ...initial, version: '1.0.0+unsafe', authorityCeiling: 'INTERNAL_WRITE' as const };
    const candidateHash = await hashHarnessSpec(candidate);
    const result = await lab.evaluateMutation(
      { schema: 'worldline-harness-mutation-v1', mutationId: 'unsafe', parentHash, rationale: 'Rejected', patch: { authorityCeiling: 'INTERNAL_WRITE' } },
      evaluation(parentHash, evaluatorDigest, 60),
      evaluation(candidateHash, evaluatorDigest, 80, { meanCostUsd: 0.4 }),
    );
    expect(result.accepted).toBe(false);
    expect(result.reasons).toEqual(expect.arrayContaining(['AUTHORITY_EXPANSION', 'COST_REGRESSION']));
    expect(lab.currentChampion().hash).toBe(parentHash);
  });

  it('refuses evaluator changes and non-held-out promotion evidence', async () => {
    const initial = spec();
    const evaluatorDigest = await hashCanonical({ evaluator: 'v1' });
    const lab = await HarnessEvolutionLab.create({ evaluatorDigest, minimumHeldOutImprovement: 0, maximumCostRegression: 1, maximumLatencyRegression: 1, maximumTokenRegression: 1 }, initial);
    const parentHash = await hashHarnessSpec(initial);
    await expect(lab.evaluateMutation(
      { schema: 'worldline-harness-mutation-v1', mutationId: 'x', parentHash, rationale: 'x', patch: {} },
      evaluation(parentHash, evaluatorDigest, 60),
      evaluation(await hashHarnessSpec({ ...initial, version: '1.0.0+x' }), 'sha256:changed', 61),
    )).rejects.toThrow('Evaluator must remain frozen');
  });
});
