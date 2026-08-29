import { canonicalize, hashCanonical, type Sha256Digest } from './causal/canonicalJson';

export type HarnessAuthorityCeiling = 'READ_ONLY' | 'SANDBOX_WRITE' | 'INTERNAL_WRITE' | 'HUMAN_REQUIRED';

export interface HarnessBudget {
  maxTokens: number;
  maxCostUsd: number;
  maxLatencyMs: number;
  maxTurns: number;
}

export interface HarnessSpec {
  schema: 'worldline-harness-spec-v1';
  harnessKey: string;
  version: string;
  modelRouting: Readonly<{ allowedModelFamilies: readonly string[]; policy: 'FIXED' | 'COST_AWARE' | 'QUALITY_AWARE' }>;
  memory: Readonly<{ kind: 'NONE' | 'EPISODIC' | 'DISK_BACKED'; maxItems: number }>;
  contextConstructor: Readonly<{ strategy: 'FULL' | 'RELEVANCE' | 'CHECKPOINT'; maxTokens: number }>;
  planningPolicy: 'DIRECT' | 'PLAN_THEN_ACT' | 'VERIFIER_GUIDED';
  actionProtocol: 'JSON_TOOL_CALLS' | 'TRANSITION_PROPOSALS';
  skills: readonly string[];
  tools: readonly string[];
  subagents: Readonly<{ allowed: boolean; maxConcurrent: number; maxDepth: number }>;
  compaction: Readonly<{ enabled: boolean; preserveAuthoritativeState: boolean }>;
  retry: Readonly<{ maxAttempts: number; backoff: 'NONE' | 'EXPONENTIAL' }>;
  stopping: Readonly<{ maxNoProgressTurns: number; requireVerifierPass: boolean }>;
  budget: Readonly<HarnessBudget>;
  verifier: Readonly<{ verifierId: string; configDigest: Sha256Digest; frozen: true }>;
  authorityCeiling: HarnessAuthorityCeiling;
}

export interface HarnessEvaluation {
  harnessHash: Sha256Digest;
  evaluatorDigest: Sha256Digest;
  split: 'DEVELOPMENT' | 'HELD_OUT';
  taskFamily: string;
  modelFamily: string;
  cases: number;
  passed: number;
  meanTokens: number;
  meanCostUsd: number;
  meanLatencyMs: number;
}

export interface HarnessMutation {
  schema: 'worldline-harness-mutation-v1';
  mutationId: string;
  parentHash: Sha256Digest;
  rationale: string;
  patch: Readonly<Partial<Pick<HarnessSpec,
    'modelRouting' | 'memory' | 'contextConstructor' | 'planningPolicy' | 'actionProtocol' |
    'skills' | 'tools' | 'subagents' | 'compaction' | 'retry' | 'stopping' | 'budget' | 'authorityCeiling'
  >>>;
}

export interface HarnessEvolutionPolicy {
  evaluatorDigest: Sha256Digest;
  minimumHeldOutImprovement: number;
  maximumCostRegression: number;
  maximumLatencyRegression: number;
  maximumTokenRegression: number;
}

export interface HarnessArchiveEntry {
  schema: 'worldline-harness-archive-entry-v1';
  entryHash: Sha256Digest;
  previousEntryHash: Sha256Digest | null;
  parentHarnessHash: Sha256Digest | null;
  harnessHash: Sha256Digest;
  mutationId: string | null;
  decision: 'CHAMPION' | 'REJECTED' | 'ROLLED_BACK';
  reasons: readonly string[];
}

export interface HarnessEvolutionResult {
  accepted: boolean;
  candidate: HarnessSpec;
  candidateHash: Sha256Digest;
  reasons: readonly string[];
  entry: HarnessArchiveEntry;
}

const AUTHORITY_RANK: Record<HarnessAuthorityCeiling, number> = {
  READ_ONLY: 0,
  SANDBOX_WRITE: 1,
  INTERNAL_WRITE: 2,
  HUMAN_REQUIRED: 3,
};

function passRate(evaluation: HarnessEvaluation): number {
  return evaluation.cases === 0 ? 0 : evaluation.passed / evaluation.cases;
}

function regression(candidate: number, champion: number): number {
  if (champion === 0) return candidate === 0 ? 0 : Number.POSITIVE_INFINITY;
  return (candidate - champion) / champion;
}

function assertFiniteNonNegative(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${field} must be finite and non-negative`);
}

export function validateHarnessSpec(spec: HarnessSpec): void {
  if (!spec.harnessKey || !spec.version) throw new Error('Harness identity is required');
  if (spec.verifier.frozen !== true) throw new Error('Harness verifier must be frozen');
  if (!spec.verifier.verifierId || !spec.verifier.configDigest.startsWith('sha256:')) throw new Error('Verifier identity is required');
  if (spec.contextConstructor.maxTokens > spec.budget.maxTokens) throw new Error('Context budget exceeds total token budget');
  if (!spec.compaction.preserveAuthoritativeState) throw new Error('Authoritative environment state must survive compaction');
  if (!spec.subagents.allowed && (spec.subagents.maxConcurrent !== 0 || spec.subagents.maxDepth !== 0)) {
    throw new Error('Disabled subagents must have zero topology limits');
  }
  assertFiniteNonNegative(spec.budget.maxTokens, 'maxTokens');
  assertFiniteNonNegative(spec.budget.maxCostUsd, 'maxCostUsd');
  assertFiniteNonNegative(spec.budget.maxLatencyMs, 'maxLatencyMs');
  assertFiniteNonNegative(spec.budget.maxTurns, 'maxTurns');
}

export async function hashHarnessSpec(spec: HarnessSpec): Promise<Sha256Digest> {
  validateHarnessSpec(spec);
  return hashCanonical(spec);
}

export class HarnessEvolutionLab {
  readonly policy: Readonly<HarnessEvolutionPolicy>;
  private champion: HarnessSpec;
  private championHash: Sha256Digest;
  private readonly entries: HarnessArchiveEntry[] = [];

  private constructor(policy: HarnessEvolutionPolicy, champion: HarnessSpec, championHash: Sha256Digest) {
    this.policy = Object.freeze({ ...policy });
    this.champion = structuredClone(champion);
    this.championHash = championHash;
  }

  static async create(policy: HarnessEvolutionPolicy, initialChampion: HarnessSpec): Promise<HarnessEvolutionLab> {
    const championHash = await hashHarnessSpec(initialChampion);
    const lab = new HarnessEvolutionLab(policy, initialChampion, championHash);
    await lab.record(initialChampion, null, null, 'CHAMPION', ['INITIAL_CHAMPION']);
    return lab;
  }

  currentChampion(): Readonly<{ spec: HarnessSpec; hash: Sha256Digest }> {
    return Object.freeze({ spec: structuredClone(this.champion), hash: this.championHash });
  }

  archive(): readonly HarnessArchiveEntry[] {
    return this.entries.map((entry) => Object.freeze({ ...entry, reasons: [...entry.reasons] }));
  }

  async evaluateMutation(
    mutation: HarnessMutation,
    championEvaluation: HarnessEvaluation,
    candidateEvaluation: HarnessEvaluation,
  ): Promise<HarnessEvolutionResult> {
    if (mutation.parentHash !== this.championHash) throw new Error('Mutation parent is not the current champion');
    if (championEvaluation.harnessHash !== this.championHash) throw new Error('Champion evaluation hash mismatch');
    if (championEvaluation.split !== 'HELD_OUT' || candidateEvaluation.split !== 'HELD_OUT') throw new Error('Promotion requires held-out evaluations');
    if (championEvaluation.evaluatorDigest !== this.policy.evaluatorDigest || candidateEvaluation.evaluatorDigest !== this.policy.evaluatorDigest) {
      throw new Error('Evaluator must remain frozen');
    }
    if (championEvaluation.taskFamily !== candidateEvaluation.taskFamily || championEvaluation.modelFamily !== candidateEvaluation.modelFamily) {
      throw new Error('Candidate and champion must use the same held-out matrix cell');
    }

    const candidate = structuredClone({ ...this.champion, ...mutation.patch, version: `${this.champion.version}+${mutation.mutationId}` }) as HarnessSpec;
    validateHarnessSpec(candidate);
    const candidateHash = await hashHarnessSpec(candidate);
    if (candidateEvaluation.harnessHash !== candidateHash) throw new Error('Candidate evaluation hash mismatch');

    const reasons: string[] = [];
    if (AUTHORITY_RANK[candidate.authorityCeiling] > AUTHORITY_RANK[this.champion.authorityCeiling]) reasons.push('AUTHORITY_EXPANSION');
    const improvement = passRate(candidateEvaluation) - passRate(championEvaluation);
    if (improvement < this.policy.minimumHeldOutImprovement) reasons.push('INSUFFICIENT_HELD_OUT_IMPROVEMENT');
    if (regression(candidateEvaluation.meanCostUsd, championEvaluation.meanCostUsd) > this.policy.maximumCostRegression) reasons.push('COST_REGRESSION');
    if (regression(candidateEvaluation.meanLatencyMs, championEvaluation.meanLatencyMs) > this.policy.maximumLatencyRegression) reasons.push('LATENCY_REGRESSION');
    if (regression(candidateEvaluation.meanTokens, championEvaluation.meanTokens) > this.policy.maximumTokenRegression) reasons.push('TOKEN_REGRESSION');

    const accepted = reasons.length === 0;
    const entry = await this.record(candidate, this.championHash, mutation.mutationId, accepted ? 'CHAMPION' : 'REJECTED', accepted ? ['HELD_OUT_GATE_PASSED'] : reasons);
    if (accepted) {
      this.champion = candidate;
      this.championHash = candidateHash;
    }
    return { accepted, candidate: structuredClone(candidate), candidateHash, reasons, entry };
  }

  async rollback(targetHash: Sha256Digest, reason: string): Promise<HarnessArchiveEntry> {
    const target = this.entries.find((entry) => entry.harnessHash === targetHash && entry.decision === 'CHAMPION');
    if (!target) throw new Error('Rollback target is not a retained champion');
    if (targetHash === this.championHash) throw new Error('Rollback target is already champion');
    const previous = this.championHash;
    const entry = await this.record(this.champion, previous, null, 'ROLLED_BACK', [reason, `TARGET:${targetHash}`]);
    // Specs are supplied by the caller's durable artifact store; the archive proves the retained target.
    this.championHash = targetHash;
    return entry;
  }

  private async record(
    spec: HarnessSpec,
    parentHarnessHash: Sha256Digest | null,
    mutationId: string | null,
    decision: HarnessArchiveEntry['decision'],
    reasons: readonly string[],
  ): Promise<HarnessArchiveEntry> {
    const harnessHash = decision === 'ROLLED_BACK' ? this.championHash : await hashHarnessSpec(spec);
    const previousEntryHash = this.entries.at(-1)?.entryHash ?? null;
    const payload = { schema: 'worldline-harness-archive-entry-v1', previousEntryHash, parentHarnessHash, harnessHash, mutationId, decision, reasons } as const;
    const entry = Object.freeze({ ...payload, entryHash: await hashCanonical(payload), reasons: Object.freeze([...reasons]) }) as HarnessArchiveEntry;
    this.entries.push(entry);
    return entry;
  }
}

export function canonicalHarnessArtifact(spec: HarnessSpec): string {
  validateHarnessSpec(spec);
  return canonicalize(spec);
}
