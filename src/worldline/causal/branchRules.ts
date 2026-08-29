import { canonicalize, hashCanonical } from './canonicalJson';
import { createPrng, seedToPrngState } from './prng';
import type { BranchRecord, CanonicalWorldState, WorldSnapshot } from '../types';

export const BRANCH_RULES_V1 = Object.freeze({
  rulesVersion: 'worldline-branch-rules-v1',
  branchIdDerivation: 'sha256-parent-fork-label-rules-v1',
  labelNormalization: 'nfc-trim-v1',
  prng: 'xoshiro128ss-v1',
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
    .sort(([left], [right]) => keyCompare(left, right))
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

export async function buildWorldlineBranch(
  canonical: CanonicalWorldState,
  activeBranchId: string,
  input: { label: string; atYear: number },
) {
  const parent = canonical.branches[activeBranchId];
  if (!parent) throw new Error('Active branch is missing');
  const eligibleSnapshots = parent.snapshots.filter((snapshot) => snapshot.year <= input.atYear);
  if (eligibleSnapshots.length === 0) throw new Error('Cannot branch before the first committed snapshot');
  const forkSnapshot = eligibleSnapshots[eligibleSnapshots.length - 1];
  const actualForkYear = forkSnapshot.year;
  const label = input.label.normalize('NFC').trim();
  if (!label) throw new Error('Branch label is required');
  const constructionHash = await hashCanonical({
    schema: 'worldline-branch-construction-v1',
    parentBranchId: parent.id,
    forkSnapshotCommitment: forkSnapshot.commitment,
    forkYear: actualForkYear,
    label,
    rulesVersion: BRANCH_RULES_V1.rulesVersion,
  });
  const id = `branch-${constructionHash.slice('sha256:'.length)}`;
  if (canonical.branches[id]) throw new Error('Identical branch construction already exists');
  const prng = createPrng(await seedToPrngState(`${parent.seed}:${constructionHash}`));
  const direction = prng.nextInt(2) === 0 ? -1 : 1;
  const sourceSnapshots = parent.snapshots.filter((snapshot) => snapshot.year >= actualForkYear);
  const childSnapshots = sourceSnapshots.map((snapshot) => divergedSnapshot(snapshot, id, actualForkYear, direction));
  const child: BranchRecord = {
    id,
    label,
    parentId: parent.id,
    forkYear: actualForkYear,
    seed: prng.nextUint32(),
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
  return { canonical: next, branchId: id, actualForkYear, constructionHash };
}

export async function branchCandidateMatchesRules(
  baseState: CanonicalWorldState,
  candidateState: CanonicalWorldState,
  inputs: Record<string, unknown>,
): Promise<boolean> {
  if (typeof inputs.activeBranchId !== 'string' || typeof inputs.label !== 'string' || typeof inputs.atYear !== 'number') return false;
  const expected = await buildWorldlineBranch(baseState, inputs.activeBranchId, {
    label: inputs.label,
    atYear: inputs.atYear,
  });
  return canonicalize(expected.canonical) === canonicalize(candidateState);
}
