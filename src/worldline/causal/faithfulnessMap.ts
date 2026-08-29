import { canonicalize, hashCanonical, type Sha256Digest } from './canonicalJson';
import type { EpistemicClass } from '../types';
import type { CausalBenchComplexity } from './causalBenchAttestation';

export type WorldGenCapabilityDimension =
  | 'DETERMINISTIC_STATE_MANIPULATION'
  | 'TEMPORAL_CAUSAL_REASONING'
  | 'MULTI_HOP_CAUSAL_PROPAGATION'
  | 'CROSS_DOMAIN_MODELING'
  | 'DSL_GENERATION'
  | 'CODE_REPAIR'
  | 'AMBIGUITY_RESOLUTION'
  | 'HIDDEN_RULE_ROBUSTNESS'
  | 'BRANCH_INTEGRITY'
  | 'LONG_AUTONOMOUS_HORIZON'
  | 'VALIDATOR_REJECTION_RECOVERY'
  | 'COST_EFFICIENCY'
  | 'LATENCY';

export interface FaithfulnessRegime {
  regimeId: string;
  domain: string;
  geography: string;
  temporalHorizon: string;
  mechanismClass: string;
  epistemicClass: EpistemicClass;
}

export interface FaithfulnessCellKey {
  model: Readonly<{ provider: string; model: string; version: string }>;
  taskFamily: string;
  capability: WorldGenCapabilityDimension;
  regime: FaithfulnessRegime;
  complexity: CausalBenchComplexity;
}

export interface FaithfulnessObservation extends FaithfulnessCellKey {
  schema: 'worldline-faithfulness-observation-v1';
  observationId: string;
  success: boolean;
  causalBlastPrecision: number;
  causalBlastRecall: number;
  decisionRegret: number;
  costUsd: number;
  latencyMs: number;
  evaluationReceiptHash: Sha256Digest;
  attestationHash: Sha256Digest;
}

export interface FaithfulnessCell extends FaithfulnessCellKey {
  trials: number;
  successes: number;
  empiricalSuccessRate: number;
  meanCausalBlastPrecision: number;
  meanCausalBlastRecall: number;
  meanDecisionRegret: number;
  meanCostUsd: number;
  meanLatencyMs: number;
  observationIds: readonly string[];
  evidenceReceiptHashes: readonly Sha256Digest[];
}

export interface FaithfulnessMapSnapshotCore {
  schema: 'worldline-regime-conditioned-faithfulness-map-v1';
  observations: readonly FaithfulnessObservation[];
}

export interface FaithfulnessMapSnapshot extends FaithfulnessMapSnapshotCore {
  snapshotHash: Sha256Digest;
}

function cellKey(input: FaithfulnessCellKey): string {
  return canonicalize({
    model: input.model,
    taskFamily: input.taskFamily,
    capability: input.capability,
    regime: input.regime,
    complexity: input.complexity,
  });
}

function requireMetric(value: number, field: string, unitInterval = false): void {
  if (!Number.isFinite(value) || value < 0 || (unitInterval && value > 1)) throw new Error(`${field} is outside its valid range`);
}

function validateObservation(observation: FaithfulnessObservation): void {
  if (observation.schema !== 'worldline-faithfulness-observation-v1' || !observation.observationId.trim()) throw new Error('Faithfulness observation identity is required');
  requireMetric(observation.causalBlastPrecision, 'causalBlastPrecision', true);
  requireMetric(observation.causalBlastRecall, 'causalBlastRecall', true);
  requireMetric(observation.decisionRegret, 'decisionRegret');
  requireMetric(observation.costUsd, 'costUsd');
  requireMetric(observation.latencyMs, 'latencyMs');
  if (!/^sha256:[0-9a-f]{64}$/i.test(observation.evaluationReceiptHash)
    || !/^sha256:[0-9a-f]{64}$/i.test(observation.attestationHash)) {
    throw new Error('Faithfulness observations require receipt and attestation evidence');
  }
}

function average(observations: readonly FaithfulnessObservation[], read: (observation: FaithfulnessObservation) => number): number {
  if (observations.length === 0) return 0;
  return Number((observations.reduce((sum, observation) => sum + read(observation), 0) / observations.length).toFixed(6));
}

function summarize(observations: readonly FaithfulnessObservation[]): FaithfulnessCell {
  const first = observations[0];
  const successes = observations.filter((observation) => observation.success).length;
  return Object.freeze({
    model: structuredClone(first.model),
    taskFamily: first.taskFamily,
    capability: first.capability,
    regime: structuredClone(first.regime),
    complexity: first.complexity,
    trials: observations.length,
    successes,
    empiricalSuccessRate: Number((successes / observations.length).toFixed(6)),
    meanCausalBlastPrecision: average(observations, (observation) => observation.causalBlastPrecision),
    meanCausalBlastRecall: average(observations, (observation) => observation.causalBlastRecall),
    meanDecisionRegret: average(observations, (observation) => observation.decisionRegret),
    meanCostUsd: average(observations, (observation) => observation.costUsd),
    meanLatencyMs: average(observations, (observation) => observation.latencyMs),
    observationIds: Object.freeze(observations.map(({ observationId }) => observationId).sort()),
    evidenceReceiptHashes: Object.freeze(observations.map(({ evaluationReceiptHash }) => evaluationReceiptHash).sort()),
  });
}

export function createRegimeConditionedFaithfulnessMap() {
  const observations = new Map<string, { digest: Sha256Digest; value: FaithfulnessObservation }>();
  const byCell = new Map<string, FaithfulnessObservation[]>();

  const record = async (source: FaithfulnessObservation): Promise<void> => {
    const observation = structuredClone(source);
    validateObservation(observation);
    const digest = await hashCanonical(observation);
    const existing = observations.get(observation.observationId);
    if (existing) {
      if (existing.digest !== digest) throw new Error('Faithfulness observation replacement rejected');
      return;
    }
    observations.set(observation.observationId, { digest, value: observation });
    const key = cellKey(observation);
    const cell = byCell.get(key) ?? [];
    cell.push(observation);
    byCell.set(key, cell);
  };

  const getCell = (query: FaithfulnessCellKey): FaithfulnessCell | null => {
    const values = byCell.get(cellKey(query));
    return values?.length ? summarize(values) : null;
  };

  const cells = (): readonly FaithfulnessCell[] => Object.freeze([...byCell.entries()]
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([, values]) => summarize(values)));

  const exportSnapshot = async (): Promise<FaithfulnessMapSnapshot> => {
    const core: FaithfulnessMapSnapshotCore = {
      schema: 'worldline-regime-conditioned-faithfulness-map-v1',
      observations: [...observations.values()].map(({ value }) => structuredClone(value))
        .sort((left, right) => left.observationId.localeCompare(right.observationId)),
    };
    return Object.freeze({ ...core, snapshotHash: await hashCanonical(core) });
  };

  return Object.freeze({ record, getCell, cells, exportSnapshot });
}

export async function verifyFaithfulnessMapSnapshot(snapshot: FaithfulnessMapSnapshot): Promise<boolean> {
  try {
    const { snapshotHash, ...core } = snapshot;
    if (await hashCanonical(core) !== snapshotHash) return false;
    const ids = core.observations.map(({ observationId }) => observationId);
    return new Set(ids).size === ids.length;
  } catch {
    return false;
  }
}
