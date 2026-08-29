import { canonicalize } from './canonicalJson';
import type { BranchRecord, CanonicalWorldState, WorldSnapshot } from '../types';

export const BRANCH_RULES_V1 = Object.freeze({
  rulesVersion: 'worldline-branch-rules-v1',
  branchIdNormalization: 'lowercase-nonalphanumeric-to-hyphen',
  seedMultiplier: 7919,
  snapshotStepYears: 5,
  metricDeltas: Object.freeze({
    population: 850,
    affordability: 1.5,
    vitality: 2.2,
    resilience: 1.8,
  }),
});

function keyCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function divergedSnapshot(source: WorldSnapshot, branchId: string, forkYear: number, direction: number): WorldSnapshot {
  const steps = Math.max(0, Math.round((source.year - forkYear) / BRANCH_RULES_V1.snapshotStepYears));
  const metrics = Object.fromEntries(Object.entries(source.metrics).map(([key, value]) => {
    if (key === 'population') return [key, Math.round(value + direction * steps * BRANCH_RULES_V1.metricDeltas.population)];
    if (key === 'affordability') return [key, Math.max(0, Math.min(100, value + direction * steps * BRANCH_RULES_V1.metricDeltas.affordability))];
    if (key === 'vitality') return [key, Math.max(0, Math.min(100, value + direction * steps * BRANCH_RULES_V1.metricDeltas.vitality))];
    if (key === 'resilience') return [key, Math.max(0, Math.min(100, value + direction * steps * BRANCH_RULES_V1.metricDeltas.resilience))];
    return [key, value];
  }));
  const metricText = Object.entries(metrics)
    .sort(([a], [b]) => keyCompare(a, b))
    .map(([key, value]) => `${key}:${value}`)
    .join('|');
  return {
    ...structuredClone(source),
    id: `${branchId}-${source.year}`,
    branchId,
    metrics,
    commitment: `${branchId}:${source.year}:${metricText}`,
  };
}

export function buildWorldlineBranch(canonical: CanonicalWorldState, activeBranchId: string, input: { label: string; atYear: number }) {
  const parent = canonical.branches[activeBranchId];
  if (!parent) throw new Error('Active branch is missing');
  const eligibleSnapshots = parent.snapshots.filter((snapshot) => snapshot.year <= input.atYear);
  if (eligibleSnapshots.length === 0) throw new Error('Cannot branch before the first committed snapshot');
  const actualForkYear = eligibleSnapshots[eligibleSnapshots.length - 1].year;
  const branchIndex = Object.keys(canonical.branches).length;
  const slug = input.label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const id = `branch-${branchIndex}-${slug}`;
  const direction = branchIndex % 2 === 0 ? -1 : 1;
  const sourceSnapshots = parent.snapshots.filter((snapshot) => snapshot.year >= actualForkYear);
  const childSnapshots = sourceSnapshots.map((snapshot) => divergedSnapshot(snapshot, id, actualForkYear, direction));
  const child: BranchRecord = {
    id,
    label: input.label,
    parentId: parent.id,
    forkYear: actualForkYear,
    seed: parent.seed + branchIndex * BRANCH_RULES_V1.seedMultiplier,
    events: [{
      id: `${id}-event`,
      year: actualForkYear,
      type: 'scenario-intervention',
      label: direction > 0 ? 'Adaptive intervention' : 'Constraint shock',
      delta: { direction },
    }],
    snapshots: childSnapshots,
  };
  const next: CanonicalWorldState = {
    worlds: structuredClone(canonical.worlds),
    branches: { ...structuredClone(canonical.branches), [id]: child },
  };
  return { canonical: next, branchId: id, actualForkYear };
}

export function branchCandidateMatchesRules(
  baseState: CanonicalWorldState,
  candidateState: CanonicalWorldState,
  inputs: Record<string, unknown>,
): boolean {
  if (typeof inputs.activeBranchId !== 'string' || typeof inputs.label !== 'string' || typeof inputs.atYear !== 'number') return false;
  const expected = buildWorldlineBranch(baseState, inputs.activeBranchId, {
    label: inputs.label,
    atYear: inputs.atYear,
  }).canonical;
  return canonicalize(expected) === canonicalize(candidateState);
}
