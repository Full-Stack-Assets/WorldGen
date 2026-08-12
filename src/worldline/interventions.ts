import type { EpistemicClass } from './types';

export type InterventionCategory =
  | 'housing'
  | 'mobility'
  | 'climate-resilience'
  | 'energy'
  | 'land-use'
  | 'public-realm'
  | 'custom';

export interface Intervention {
  id: string;
  worldId: string;
  branchId: string;
  label: string;
  category: InterventionCategory;
  startYear: number;
  durationYears: number | null;
  magnitude: number;
  metricEffects: Record<string, number>;
  notes: string;
  epistemicClass: Extract<EpistemicClass, 'SIMULATED' | 'GENERATED' | 'SPECULATIVE'>;
}

export interface InterventionInput extends Omit<Intervention, 'id' | 'epistemicClass'> {
  epistemicClass: string;
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

export function createIntervention(input: InterventionInput): Intervention {
  if (input.epistemicClass === 'OBSERVED') throw new Error('Interventions cannot be observed evidence');
  if (!['SIMULATED', 'GENERATED', 'SPECULATIVE'].includes(input.epistemicClass)) {
    throw new Error(`Unsupported intervention epistemic class: ${input.epistemicClass}`);
  }
  const normalized = {
    ...structuredClone(input),
    label: input.label.trim() || 'Untitled intervention',
    metricEffects: Object.fromEntries(Object.entries(input.metricEffects).sort(([a], [b]) => a.localeCompare(b))),
  };
  return {
    ...normalized,
    id: `intervention-${hashText(JSON.stringify(stableValue(normalized)))}`,
    epistemicClass: input.epistemicClass as Intervention['epistemicClass'],
  };
}

export function isInterventionActive(intervention: Intervention, year: number): boolean {
  if (year < intervention.startYear) return false;
  if (intervention.durationYears === null) return true;
  return year < intervention.startYear + Math.max(0, intervention.durationYears);
}

export function applyInterventions(
  baseline: Record<string, number>,
  input: Intervention[],
  year: number,
): { metrics: Record<string, number>; interventionIds: string[] } {
  const metrics = { ...baseline };
  const active = input.filter((item) => isInterventionActive(item, year)).sort((a, b) => a.id.localeCompare(b.id));
  for (const intervention of active) {
    for (const [metric, effect] of Object.entries(intervention.metricEffects).sort(([a], [b]) => a.localeCompare(b))) {
      metrics[metric] = (metrics[metric] ?? 0) + effect * intervention.magnitude;
    }
  }
  return { metrics, interventionIds: active.map((item) => item.id) };
}
