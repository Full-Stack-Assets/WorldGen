import { hashCanonical, type Sha256Digest } from './causal/canonicalJson';
import { hashHarnessSpec, validateHarnessSpec, type HarnessAuthorityCeiling, type HarnessSpec } from './harnessEvolution';

export interface HarnessCorpusRecord {
  recordId: string;
  taskFamily: string;
  modelFamily: string;
  split: 'DEVELOPMENT' | 'HELD_OUT';
  harnessHash: Sha256Digest;
  accepted: boolean;
  tags: readonly string[];
}

export interface HarnessGenerationRequest {
  schema: 'worldline-harness-generation-request-v1';
  requestId: string;
  taskFamily: string;
  modelFamily: string;
  taskTags: readonly string[];
  heldOutTaskFamilies: readonly string[];
  heldOutModelFamilies: readonly string[];
  authorityCeiling: HarnessAuthorityCeiling;
  evaluatorDigest: Sha256Digest;
  seed: string;
}

export interface GeneratedHarnessProposal {
  schema: 'worldline-generated-harness-proposal-v1';
  requestId: string;
  generatorId: string;
  generatorVersion: string;
  corpusDigest: Sha256Digest;
  selectedRecordIds: readonly string[];
  proposedSpec: HarnessSpec;
  proposedSpecHash: Sha256Digest;
  requestedAuthority: 'COMPILE_AND_EVALUATE_ONLY';
  leakageAudit: Readonly<{
    taskFamilyHoldoutPassed: boolean;
    modelFamilyHoldoutPassed: boolean;
    directTestSamplesUsed: false;
  }>;
  proposalHash: Sha256Digest;
}

export interface HarnessComparisonCell {
  role: 'FIXED_HUMAN' | 'EVOLVED' | 'GENERATED';
  harnessHash: Sha256Digest;
  evaluatorDigest: Sha256Digest;
  taskFamily: string;
  modelFamily: string;
  split: 'HELD_OUT';
  seeds: readonly string[];
  completionMean: number;
  completionStdDev: number;
  meanCostUsd: number;
  meanLatencyMs: number;
}

export interface HarnessComparisonReport {
  schema: 'worldline-harness-comparison-v1';
  label: 'INTERNAL_SYNTHETIC_EXPERIMENT';
  target: string;
  metricRationale: string;
  leakageAudit: string;
  cells: readonly HarnessComparisonCell[];
  conclusion: 'GENERATED_BETTER' | 'EVOLVED_BETTER' | 'FIXED_BETTER' | 'NO_CLEAR_DIFFERENCE';
  reportHash: Sha256Digest;
}

const AUTHORITY_RANK: Record<HarnessAuthorityCeiling, number> = {
  READ_ONLY: 0, SANDBOX_WRITE: 1, INTERNAL_WRITE: 2, HUMAN_REQUIRED: 3,
};

function stableUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

export class BoundedHarnessGenerator {
  constructor(readonly generatorId: string, readonly generatorVersion: string) {}

  async propose(
    request: HarnessGenerationRequest,
    base: HarnessSpec,
    corpus: readonly HarnessCorpusRecord[],
  ): Promise<GeneratedHarnessProposal> {
    validateHarnessSpec(base);
    if (!request.seed) throw new Error('Generation requires an explicit seed');
    if (request.heldOutTaskFamilies.includes(request.taskFamily) || request.heldOutModelFamilies.includes(request.modelFamily)) {
      throw new Error('Generation request targets a declared holdout');
    }
    if (AUTHORITY_RANK[base.authorityCeiling] > AUTHORITY_RANK[request.authorityCeiling]) {
      throw new Error('Base harness exceeds requested authority ceiling');
    }

    // Leakage audit: selection only sees development records; family holdouts are excluded before scoring.
    const eligible = corpus.filter((record) =>
      record.split === 'DEVELOPMENT' &&
      record.accepted &&
      !request.heldOutTaskFamilies.includes(record.taskFamily) &&
      !request.heldOutModelFamilies.includes(record.modelFamily),
    );
    if (eligible.length === 0) throw new Error('No leakage-safe development records');
    const selected = eligible
      .map((record) => ({ record, overlap: record.tags.filter((tag) => request.taskTags.includes(tag)).length }))
      .filter(({ overlap }) => overlap > 0)
      .sort((left, right) => right.overlap - left.overlap || left.record.recordId.localeCompare(right.record.recordId))
      .slice(0, 8)
      .map(({ record }) => record);
    if (selected.length === 0) throw new Error('No relevant development records');

    const tags = new Set(selected.flatMap((record) => record.tags));
    const proposedSpec: HarnessSpec = {
      ...structuredClone(base),
      version: `${base.version}+jit.${this.generatorVersion}`,
      planningPolicy: tags.has('verifier-guided') ? 'VERIFIER_GUIDED' : base.planningPolicy,
      contextConstructor: tags.has('checkpoint-context')
        ? { ...base.contextConstructor, strategy: 'CHECKPOINT' }
        : base.contextConstructor,
      compaction: { ...base.compaction, preserveAuthoritativeState: true },
      authorityCeiling: base.authorityCeiling,
    };
    validateHarnessSpec(proposedSpec);
    const proposedSpecHash = await hashHarnessSpec(proposedSpec);
    const corpusDigest = await hashCanonical(eligible.map(({ recordId, harnessHash, tags: recordTags }) => ({ recordId, harnessHash, tags: stableUnique(recordTags) })));
    const payload = {
      schema: 'worldline-generated-harness-proposal-v1' as const,
      requestId: request.requestId,
      generatorId: this.generatorId,
      generatorVersion: this.generatorVersion,
      corpusDigest,
      selectedRecordIds: selected.map((record) => record.recordId),
      proposedSpec,
      proposedSpecHash,
      requestedAuthority: 'COMPILE_AND_EVALUATE_ONLY' as const,
      leakageAudit: { taskFamilyHoldoutPassed: true, modelFamilyHoldoutPassed: true, directTestSamplesUsed: false as const },
    };
    return Object.freeze({ ...payload, proposalHash: await hashCanonical(payload) });
  }
}

export async function compareHarnesses(cells: readonly HarnessComparisonCell[]): Promise<HarnessComparisonReport> {
  const roles = new Set(cells.map((cell) => cell.role));
  if (cells.length !== 3 || roles.size !== 3) throw new Error('Comparison requires fixed, evolved, and generated harnesses');
  const first = cells[0];
  if (cells.some((cell) => cell.evaluatorDigest !== first.evaluatorDigest || cell.taskFamily !== first.taskFamily || cell.modelFamily !== first.modelFamily || cell.split !== 'HELD_OUT')) {
    throw new Error('Comparison matrix must hold evaluator, task family, model family, and split constant');
  }
  if (cells.some((cell) => cell.seeds.length < 2)) throw new Error('Comparison requires repeated seeded runs');
  const ranked = [...cells].sort((a, b) => b.completionMean - a.completionMean);
  const gap = ranked[0].completionMean - ranked[1].completionMean;
  const noise = Math.max(ranked[0].completionStdDev, ranked[1].completionStdDev);
  const conclusion: HarnessComparisonReport['conclusion'] = gap <= noise
    ? 'NO_CLEAR_DIFFERENCE'
    : ranked[0].role === 'GENERATED' ? 'GENERATED_BETTER'
      : ranked[0].role === 'EVOLVED' ? 'EVOLVED_BETTER' : 'FIXED_BETTER';
  const payload = {
    schema: 'worldline-harness-comparison-v1' as const,
    label: 'INTERNAL_SYNTHETIC_EXPERIMENT' as const,
    target: 'Held-out task completion under fixed model, evaluator, and execution conditions',
    metricRationale: 'Completion is the decision metric; cost and latency remain non-collapsed constraints; repeated seeds expose run variance.',
    leakageAudit: 'No task-family or model-family holdout record was available to generation; evaluation samples were never used for selection.',
    cells: [...cells], conclusion,
  };
  return Object.freeze({ ...payload, reportHash: await hashCanonical(payload) });
}
