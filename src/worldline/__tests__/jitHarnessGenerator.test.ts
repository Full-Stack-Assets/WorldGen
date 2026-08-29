import { describe, expect, it } from 'vitest';
import { hashCanonical } from '../causal/canonicalJson';
import { hashHarnessSpec, type HarnessSpec } from '../harnessEvolution';
import { BoundedHarnessGenerator, compareHarnesses, type HarnessComparisonCell } from '../jitHarnessGenerator';

function base(): HarnessSpec {
  return {
    schema: 'worldline-harness-spec-v1', harnessKey: 'jit-base', version: '1',
    modelRouting: { allowedModelFamilies: ['m1'], policy: 'FIXED' }, memory: { kind: 'EPISODIC', maxItems: 4 },
    contextConstructor: { strategy: 'RELEVANCE', maxTokens: 100 }, planningPolicy: 'PLAN_THEN_ACT', actionProtocol: 'TRANSITION_PROPOSALS',
    skills: [], tools: ['sandbox'], subagents: { allowed: false, maxConcurrent: 0, maxDepth: 0 },
    compaction: { enabled: true, preserveAuthoritativeState: true }, retry: { maxAttempts: 1, backoff: 'NONE' },
    stopping: { maxNoProgressTurns: 1, requireVerifierPass: true }, budget: { maxTokens: 500, maxCostUsd: 1, maxLatencyMs: 1_000, maxTurns: 5 },
    verifier: { verifierId: 'fixed', configDigest: 'sha256:e', frozen: true }, authorityCeiling: 'SANDBOX_WRITE',
  };
}

describe('BoundedHarnessGenerator', () => {
  it('emits a compile-and-evaluate-only proposal from leakage-safe development records', async () => {
    const evaluatorDigest = await hashCanonical({ eval: 1 });
    const generator = new BoundedHarnessGenerator('bounded', '1');
    const proposal = await generator.propose(
      { schema: 'worldline-harness-generation-request-v1', requestId: 'r1', taskFamily: 'causal', modelFamily: 'm1', taskTags: ['verifier-guided'], heldOutTaskFamilies: ['robotics'], heldOutModelFamilies: ['m2'], authorityCeiling: 'SANDBOX_WRITE', evaluatorDigest, seed: '42' },
      base(),
      [
        { recordId: 'dev', taskFamily: 'other', modelFamily: 'm1', split: 'DEVELOPMENT', harnessHash: 'sha256:dev', accepted: true, tags: ['verifier-guided'] },
        { recordId: 'leak-task', taskFamily: 'robotics', modelFamily: 'm1', split: 'DEVELOPMENT', harnessHash: 'sha256:leak', accepted: true, tags: ['verifier-guided'] },
        { recordId: 'test', taskFamily: 'other', modelFamily: 'm1', split: 'HELD_OUT', harnessHash: 'sha256:test', accepted: true, tags: ['verifier-guided'] },
      ],
    );
    expect(proposal.selectedRecordIds).toEqual(['dev']);
    expect(proposal.proposedSpec.planningPolicy).toBe('VERIFIER_GUIDED');
    expect(proposal.proposedSpec.authorityCeiling).toBe('SANDBOX_WRITE');
    expect(proposal.requestedAuthority).toBe('COMPILE_AND_EVALUATE_ONLY');
    expect(proposal.leakageAudit.directTestSamplesUsed).toBe(false);
  });

  it('rejects generation for a declared held-out family', async () => {
    const generator = new BoundedHarnessGenerator('bounded', '1');
    await expect(generator.propose(
      { schema: 'worldline-harness-generation-request-v1', requestId: 'r', taskFamily: 'held', modelFamily: 'm1', taskTags: ['x'], heldOutTaskFamilies: ['held'], heldOutModelFamilies: [], authorityCeiling: 'SANDBOX_WRITE', evaluatorDigest: 'sha256:e', seed: '42' },
      base(), [{ recordId: 'dev', taskFamily: 'x', modelFamily: 'm1', split: 'DEVELOPMENT', harnessHash: 'sha256:d', accepted: true, tags: ['x'] }],
    )).rejects.toThrow('declared holdout');
  });

  it('reports no clear difference when uplift does not exceed repeated-run variation', async () => {
    const harnessHash = await hashHarnessSpec(base());
    const cell = (role: HarnessComparisonCell['role'], completionMean: number): HarnessComparisonCell => ({ role, harnessHash, evaluatorDigest: 'sha256:e', taskFamily: 'held', modelFamily: 'm2', split: 'HELD_OUT', seeds: ['1', '2', '3'], completionMean, completionStdDev: 0.03, meanCostUsd: 1, meanLatencyMs: 100 });
    const report = await compareHarnesses([cell('FIXED_HUMAN', 0.6), cell('EVOLVED', 0.62), cell('GENERATED', 0.64)]);
    expect(report.conclusion).toBe('NO_CLEAR_DIFFERENCE');
    expect(report.label).toBe('INTERNAL_SYNTHETIC_EXPERIMENT');
  });
});
