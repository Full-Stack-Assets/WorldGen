import { applyInterventions, type Intervention } from './interventions';

export interface ExperimentSession {
  schema: 'worldline-experiment-v2';
  id: string;
  projectId: string;
  worldId: string;
  branchId: string;
  year: number;
  seed: number;
  inputFingerprint: string;
  interventionIds: string[];
  baselineMetrics: Record<string, number>;
  resultMetrics: Record<string, number>;
  createdAt: string;
}

export interface RunExperimentInput {
  projectId: string;
  worldId: string;
  branchId: string;
  year: number;
  seed: number;
  baselineMetrics: Record<string, number>;
  interventions: Intervention[];
  now: string;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => [key, stableValue(item)]));
  }
  return value;
}

function hashText(text: string): string {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).padStart(7, '0');
}

export function fingerprintExperiment(input: Omit<RunExperimentInput, 'now'>): string {
  const orderedInterventions = [...input.interventions]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((item) => stableValue(item));
  const payload = stableValue({
    projectId: input.projectId,
    worldId: input.worldId,
    branchId: input.branchId,
    year: input.year,
    seed: input.seed,
    baselineMetrics: input.baselineMetrics,
    interventions: orderedInterventions,
  });
  return `exp-input-${hashText(JSON.stringify(payload))}`;
}

export function runExperiment(input: RunExperimentInput): ExperimentSession {
  const fingerprint = fingerprintExperiment(input);
  const applied = applyInterventions(input.baselineMetrics, input.interventions, input.year);
  const resultMetrics = Object.fromEntries(Object.entries(applied.metrics)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => [key, Number(value.toFixed(6))]));
  return {
    schema: 'worldline-experiment-v2',
    id: `experiment-${hashText(`${fingerprint}|${input.now}`)}`,
    projectId: input.projectId,
    worldId: input.worldId,
    branchId: input.branchId,
    year: input.year,
    seed: input.seed,
    inputFingerprint: fingerprint,
    interventionIds: applied.interventionIds,
    baselineMetrics: structuredClone(input.baselineMetrics),
    resultMetrics,
    createdAt: input.now,
  };
}
