export interface FutureFamilyInput {
  id: string;
  resultMetrics: Record<string, number>;
}

export interface FutureFamily {
  key: string;
  label: string;
  memberIds: string[];
  centroid: Record<string, number>;
  divergenceBand: 'NEAR' | 'MID' | 'FAR';
}

function metricKeys(input: FutureFamilyInput[]): string[] {
  return Array.from(new Set(input.flatMap((item) => Object.keys(item.resultMetrics)))).sort();
}

function normalize(value: number, min: number, max: number): number {
  return max === min ? 0.5 : (value - min) / (max - min);
}

function alphaLabel(index: number): string {
  let value = index;
  let label = '';
  do {
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);
  return `Family ${label}`;
}

export function buildFutureFamilies(input: FutureFamilyInput[]): FutureFamily[] {
  const sessions = [...input].sort((a, b) => a.id.localeCompare(b.id));
  if (sessions.length === 0) return [];
  const keys = metricKeys(sessions);
  const primary = keys[0];
  const secondary = keys[1] ?? keys[0];
  const bounds = Object.fromEntries(keys.map((key) => {
    const values = sessions.map((item) => item.resultMetrics[key] ?? 0);
    return [key, { min: Math.min(...values), max: Math.max(...values) }];
  })) as Record<string, { min: number; max: number }>;

  const buckets = new Map<string, FutureFamilyInput[]>();
  for (const session of sessions) {
    const x = normalize(session.resultMetrics[primary] ?? 0, bounds[primary].min, bounds[primary].max);
    const y = normalize(session.resultMetrics[secondary] ?? 0, bounds[secondary].min, bounds[secondary].max);
    const divergence = Math.hypot(x - 0.5, y - 0.5);
    const band: FutureFamily['divergenceBand'] = divergence < 0.2 ? 'NEAR' : divergence < 0.5 ? 'MID' : 'FAR';
    const quadrant = `${x >= 0.5 ? 'H' : 'L'}${y >= 0.5 ? 'H' : 'L'}`;
    const key = `${quadrant}-${band}`;
    buckets.set(key, [...(buckets.get(key) ?? []), session]);
  }

  return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, members], index) => {
    const memberIds = members.map((item) => item.id).sort();
    const centroid = Object.fromEntries(keys.map((metric) => {
      const total = members.reduce((sum, item) => sum + (item.resultMetrics[metric] ?? 0), 0);
      return [metric, Number((total / members.length).toFixed(6))];
    }));
    return { key, label: alphaLabel(index), memberIds, centroid, divergenceBand: key.endsWith('NEAR') ? 'NEAR' : key.endsWith('MID') ? 'MID' : 'FAR' };
  });
}
