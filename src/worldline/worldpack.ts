import type { WorldProject } from './studioProjects';

export interface Worldpack {
  schema: 'worldline-worldpack-v2';
  version: '2.0.0';
  exportedAt: string;
  project: WorldProject;
  provenance: Record<string, unknown>;
}

export type WorldpackParseResult =
  | { ok: true; worldpack: Worldpack }
  | { ok: false; error: string };

function shouldStripKey(key: string): boolean {
  return /(token|secret|credential|password|apiKey|providerKey)/i.test(key);
}

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !shouldStripKey(key))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => [key, sanitize(item)]));
  }
  return value;
}

export function createWorldpack(
  project: WorldProject,
  input: { exportedAt: string; provenance?: Record<string, unknown> },
): Worldpack {
  const raw = {
    schema: 'worldline-worldpack-v2' as const,
    version: '2.0.0' as const,
    exportedAt: input.exportedAt,
    project: structuredClone(project),
    provenance: structuredClone(input.provenance ?? {}),
  };
  return sanitize(raw) as Worldpack;
}

export function describeWorldpackPortability(worldpack: Worldpack): {
  schema: Worldpack['schema'];
  offlineCapable: true;
  credentialSanitized: true;
  rendererAgnostic: true;
} {
  return {
    schema: worldpack.schema,
    offlineCapable: true,
    credentialSanitized: true,
    rendererAgnostic: true,
  };
}

export function serializeWorldpack(worldpack: Worldpack): string {
  return JSON.stringify(sanitize(worldpack));
}

function isWorldpack(value: unknown): value is Worldpack {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Worldpack>;
  return candidate.schema === 'worldline-worldpack-v2'
    && candidate.version === '2.0.0'
    && typeof candidate.exportedAt === 'string'
    && !!candidate.project
    && candidate.project.schema === 'worldline-project-v2'
    && !!candidate.provenance;
}

export function parseWorldpack(text: string): WorldpackParseResult {
  try {
    const parsed: unknown = JSON.parse(text);
    if (!isWorldpack(parsed)) return { ok: false, error: 'Unsupported or malformed Worldpack schema' };
    return { ok: true, worldpack: structuredClone(sanitize(parsed) as Worldpack) };
  } catch {
    return { ok: false, error: 'Worldpack JSON could not be parsed' };
  }
}
