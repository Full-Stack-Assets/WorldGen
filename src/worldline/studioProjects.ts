import type { ExperimentSession } from './experiments';
import type { Intervention } from './interventions';
import type { WorldlineState } from './types';

export type StudioSurface = 'WORLD' | 'TIME' | 'FUTURES' | 'COMPARE' | 'DATA' | 'LIBRARY';

export interface WorldProject {
  schema: 'worldline-project-v2';
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  state: WorldlineState;
  interventions: Intervention[];
  experiments: ExperimentSession[];
  preferences: {
    primarySurface: StudioSurface;
    truthLens: boolean;
  };
}

export type WorldProjectParseResult =
  | { ok: true; project: WorldProject }
  | { ok: false; error: string };

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

function projectId(state: WorldlineState, input: { title: string; now: string; sequence: number }): string {
  const payload = stableValue({
    title: input.title.trim(),
    now: input.now,
    sequence: input.sequence,
    worldId: state.activeWorld.id,
    branchId: state.activeBranchId,
  });
  return `project-${hashText(JSON.stringify(payload))}`;
}

export function createWorldProject(
  state: WorldlineState,
  input: { title: string; now: string; sequence: number },
): WorldProject {
  const title = input.title.trim() || 'Untitled Worldline';
  return {
    schema: 'worldline-project-v2',
    id: projectId(state, { ...input, title }),
    title,
    createdAt: input.now,
    updatedAt: input.now,
    state: structuredClone(state),
    interventions: [],
    experiments: [],
    preferences: { primarySurface: 'WORLD', truthLens: false },
  };
}

export function serializeWorldProject(project: WorldProject): string {
  return JSON.stringify(stableValue(project));
}

function isProject(value: unknown): value is WorldProject {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<WorldProject>;
  return candidate.schema === 'worldline-project-v2'
    && typeof candidate.id === 'string'
    && typeof candidate.title === 'string'
    && typeof candidate.createdAt === 'string'
    && typeof candidate.updatedAt === 'string'
    && !!candidate.state
    && Array.isArray(candidate.interventions)
    && Array.isArray(candidate.experiments)
    && !!candidate.preferences;
}

export function parseWorldProject(text: string): WorldProjectParseResult {
  try {
    const value: unknown = JSON.parse(text);
    if (!isProject(value)) return { ok: false, error: 'Unsupported or malformed Worldline project schema' };
    return { ok: true, project: structuredClone(value) };
  } catch {
    return { ok: false, error: 'Worldline project JSON could not be parsed' };
  }
}
