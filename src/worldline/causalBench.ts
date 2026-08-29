import { hashCanonical, type Sha256Digest } from './causal/canonicalJson';

export type CausalBenchLevel = 'C0' | 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7' | 'C8' | 'C9' | 'C10';

export interface CausalBenchDimension {
  level: CausalBenchLevel;
  label: string;
  question: string;
  evidenceClass: 'PERCEPTUAL' | 'STATE' | 'CAUSAL' | 'EXECUTION' | 'PHYSICAL';
}

export const WORLDLINE_CAUSALBENCH_V1: readonly CausalBenchDimension[] = Object.freeze([
  { level: 'C0', label: 'Perceptual quality', question: 'Is the projection legible and visually coherent?', evidenceClass: 'PERCEPTUAL' },
  { level: 'C1', label: 'Spatiotemporal consistency', question: 'Do objects and spatial relations remain coherent through time?', evidenceClass: 'PERCEPTUAL' },
  { level: 'C2', label: 'Persistent state identity', question: 'Do canonical entities and state commitments persist across frames and branches?', evidenceClass: 'STATE' },
  { level: 'C3', label: 'Control adherence', question: 'Did the world follow the declared action or intervention?', evidenceClass: 'CAUSAL' },
  { level: 'C4', label: 'Paired intervention sensitivity', question: 'Did a single changed cause produce the required paired divergence?', evidenceClass: 'CAUSAL' },
  { level: 'C5', label: 'Mechanism grounding', question: 'Are contact, transfer, and reaction linked by an executable mechanism?', evidenceClass: 'CAUSAL' },
  { level: 'C6', label: 'Counterfactual consistency', question: 'Do alternate branches preserve shared history and change only downstream consequences?', evidenceClass: 'CAUSAL' },
  { level: 'C7', label: 'OOD regime behavior', question: 'Does the system expose uncertainty or failure outside the mechanism regime?', evidenceClass: 'CAUSAL' },
  { level: 'C8', label: 'Reference executability', question: 'Can the transition execute deterministically in the reference sandbox?', evidenceClass: 'EXECUTION' },
  { level: 'C9', label: 'Closed-loop agreement', question: 'Do planner expectations agree with verified environment transitions?', evidenceClass: 'EXECUTION' },
  { level: 'C10', label: 'Physical validation', question: 'Where applicable, does physical or HIL evidence agree with the simulated mechanism?', evidenceClass: 'PHYSICAL' },
]);

export interface CausalBenchObservation {
  caseId: string;
  level: CausalBenchLevel;
  passed: boolean;
  weight: number;
  detail: string;
  evidenceRefs: readonly string[];
}

export interface CausalBenchReceipt {
  schema: 'worldline-causalbench-receipt-v1';
  benchmarkVersion: 'worldline-causalbench-v1';
  artifactVersion: string;
  evaluatorConfigId: string;
  verifierId: string;
  heldOut: boolean;
  observationsDigest: Sha256Digest;
  dimensionScores: Readonly<Record<CausalBenchLevel, number>>;
  visualFidelity: number;
  causalReliability: number;
  status: 'COMPLETED' | 'INCOMPATIBLE';
  limitations: readonly string[];
}

function mean(values: readonly number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number): number {
  return Number(value.toFixed(2));
}

export async function runCausalBench(input: {
  artifactVersion: string;
  evaluatorConfigId: string;
  verifierId: string;
  heldOut: boolean;
  observations: readonly CausalBenchObservation[];
  limitations?: readonly string[];
}): Promise<CausalBenchReceipt> {
  if (!input.artifactVersion || !input.evaluatorConfigId || !input.verifierId) throw new Error('CausalBench identities are required');
  const allowed = new Set(WORLDLINE_CAUSALBENCH_V1.map((dimension) => dimension.level));
  const observations = input.observations.map((observation) => {
    if (!allowed.has(observation.level)) throw new Error(`Unknown CausalBench level: ${observation.level}`);
    if (!observation.caseId || !observation.detail || observation.evidenceRefs.length === 0) throw new Error('Every CausalBench case requires detail and evidence');
    if (!Number.isFinite(observation.weight) || observation.weight <= 0) throw new Error('CausalBench weights must be positive');
    return { ...observation, evidenceRefs: [...observation.evidenceRefs].sort() };
  }).sort((left, right) => left.level.localeCompare(right.level, undefined, { numeric: true }) || left.caseId.localeCompare(right.caseId));

  const scores = {} as Record<CausalBenchLevel, number>;
  const missing: CausalBenchLevel[] = [];
  for (const dimension of WORLDLINE_CAUSALBENCH_V1) {
    const cases = observations.filter((observation) => observation.level === dimension.level);
    if (cases.length === 0) {
      scores[dimension.level] = 0;
      missing.push(dimension.level);
      continue;
    }
    const totalWeight = cases.reduce((sum, observation) => sum + observation.weight, 0);
    const passedWeight = cases.reduce((sum, observation) => sum + (observation.passed ? observation.weight : 0), 0);
    scores[dimension.level] = round((passedWeight / totalWeight) * 100);
  }
  const limitations = [...(input.limitations ?? [])];
  if (!input.heldOut) limitations.push('Evaluation cases were not held out from the producer.');
  if (missing.length > 0) limitations.push(`Missing benchmark dimensions: ${missing.join(', ')}.`);
  return {
    schema: 'worldline-causalbench-receipt-v1',
    benchmarkVersion: 'worldline-causalbench-v1',
    artifactVersion: input.artifactVersion,
    evaluatorConfigId: input.evaluatorConfigId,
    verifierId: input.verifierId,
    heldOut: input.heldOut,
    observationsDigest: await hashCanonical(observations),
    dimensionScores: Object.freeze(scores),
    visualFidelity: round(mean(['C0', 'C1', 'C2'].map((level) => scores[level as CausalBenchLevel]))),
    causalReliability: round(mean(['C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'].map((level) => scores[level as CausalBenchLevel]))),
    status: missing.length === 0 ? 'COMPLETED' : 'INCOMPATIBLE',
    limitations: Object.freeze(limitations),
  };
}
