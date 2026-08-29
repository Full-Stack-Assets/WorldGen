import { ROOT_BRANCH, WORLD_CATALOG } from './fixtures';
import type {
  BranchRecord,
  CanonicalWorldState,
  SnapshotDifference,
  WorldSnapshot,
  WorldlineSessionState,
  WorldlineState,
} from './types';

export function createInitialCanonicalWorldState(): CanonicalWorldState {
  const root = structuredClone(ROOT_BRANCH);
  const worlds = structuredClone(WORLD_CATALOG);
  return {
    worlds,
    branches: { [root.id]: root },
  };
}

export function createInitialWorldlineSessionState(canonical: CanonicalWorldState): WorldlineSessionState {
  const firstWorld = canonical.worlds[0];
  const firstBranchId = Object.keys(canonical.branches)[0];
  if (!firstWorld || !firstBranchId) throw new Error('Canonical world state requires a world and branch');
  return {
    activeWorldId: firstWorld.id,
    activeBranchId: firstBranchId,
    selectedYear: 2026,
    timeMode: 'SLICE',
  };
}

function composeWorldlineState(canonical: CanonicalWorldState, session: WorldlineSessionState): WorldlineState {
  const activeWorld = canonical.worlds.find((world) => world.id === session.activeWorldId);
  if (!activeWorld) throw new Error(`Unknown world ${session.activeWorldId}`);
  if (!canonical.branches[session.activeBranchId]) throw new Error(`Unknown branch ${session.activeBranchId}`);
  return {
    worlds: structuredClone(canonical.worlds),
    activeWorld: structuredClone(activeWorld),
    branches: structuredClone(canonical.branches),
    activeBranchId: session.activeBranchId,
    selectedYear: session.selectedYear,
    timeMode: session.timeMode,
  };
}

export function createInitialWorldlineState(): WorldlineState {
  const canonical = createInitialCanonicalWorldState();
  return composeWorldlineState(canonical, createInitialWorldlineSessionState(canonical));
}

export function createFlagshipWorldlineState(): WorldlineState {
  return selectWorld(createInitialWorldlineState(), 'new-bedford-001');
}

export function commitSnapshot(state: WorldlineState, snapshot: WorldSnapshot): WorldlineState {
  const branch = state.branches[snapshot.branchId];
  if (!branch) throw new Error(`Unknown branch ${snapshot.branchId}`);
  const nextBranch: BranchRecord = {
    ...branch,
    snapshots: [...branch.snapshots.filter((item) => item.year !== snapshot.year), structuredClone(snapshot)].sort((a, b) => a.year - b.year),
  };
  return { ...state, branches: { ...state.branches, [branch.id]: nextBranch } };
}

function divergedSnapshot(source: WorldSnapshot, branchId: string, forkYear: number, direction: number): WorldSnapshot {
  const steps = Math.max(0, Math.round((source.year - forkYear) / 5));
  const metrics = Object.fromEntries(Object.entries(source.metrics).map(([key, value]) => {
    if (key === 'population') return [key, Math.round(value + direction * steps * 850)];
    if (key === 'affordability') return [key, Math.max(0, Math.min(100, value + direction * steps * 1.5))];
    if (key === 'vitality') return [key, Math.max(0, Math.min(100, value + direction * steps * 2.2))];
    if (key === 'resilience') return [key, Math.max(0, Math.min(100, value + direction * steps * 1.8))];
    return [key, value];
  }));
  const metricText = Object.entries(metrics).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}:${value}`).join('|');
  return {
    ...structuredClone(source),
    id: `${branchId}-${source.year}`,
    branchId,
    metrics,
    commitment: `${branchId}:${source.year}:${metricText}`,
  };
}

export function createBranch(state: WorldlineState, input: { label: string; atYear: number }): WorldlineState {
  const parent = state.branches[state.activeBranchId];
  if (!parent) throw new Error('Active branch is missing');
  const eligibleSnapshots = parent.snapshots.filter((snapshot) => snapshot.year <= input.atYear);
  if (eligibleSnapshots.length === 0) throw new Error('Cannot branch before the first committed snapshot');
  const actualForkYear = eligibleSnapshots[eligibleSnapshots.length - 1].year;
  const branchIndex = Object.keys(state.branches).length;
  const id = `branch-${branchIndex}-${input.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const direction = branchIndex % 2 === 0 ? -1 : 1;
  const sourceSnapshots = parent.snapshots.filter((snapshot) => snapshot.year >= actualForkYear);
  const childSnapshots = sourceSnapshots.map((snapshot) => divergedSnapshot(snapshot, id, actualForkYear, direction));
  const child: BranchRecord = {
    id,
    label: input.label,
    parentId: parent.id,
    forkYear: actualForkYear,
    seed: parent.seed + branchIndex * 7919,
    events: [{
      id: `${id}-event`,
      year: actualForkYear,
      type: 'scenario-intervention',
      label: direction > 0 ? 'Adaptive intervention' : 'Constraint shock',
      delta: { direction },
    }],
    snapshots: childSnapshots,
  };
  return {
    ...state,
    branches: { ...state.branches, [id]: child },
    activeBranchId: id,
    selectedYear: actualForkYear,
  };
}

export function replayBranch(state: Pick<WorldlineState, 'branches'>, branchId: string): WorldSnapshot[] {
  const branch = state.branches[branchId];
  if (!branch) throw new Error(`Unknown branch ${branchId}`);
  return structuredClone(branch.snapshots).sort((a, b) => a.year - b.year);
}

export function compareSnapshots(left: WorldSnapshot, right: WorldSnapshot): SnapshotDifference[] {
  const keys = Array.from(new Set([...Object.keys(left.metrics), ...Object.keys(right.metrics)])).sort();
  return keys.map((metric) => {
    const leftValue = left.metrics[metric] ?? 0;
    const rightValue = right.metrics[metric] ?? 0;
    return { metric, left: leftValue, right: rightValue, delta: rightValue - leftValue };
  });
}

export function selectSessionWorld(session: WorldlineSessionState, worldId: string): WorldlineSessionState {
  return { ...session, activeWorldId: worldId };
}

export function selectSessionYear(session: WorldlineSessionState, year: number): WorldlineSessionState {
  return { ...session, selectedYear: year };
}

export function selectSessionBranch(session: WorldlineSessionState, branchId: string): WorldlineSessionState {
  return { ...session, activeBranchId: branchId };
}

export function selectSessionTimeMode(session: WorldlineSessionState, timeMode: WorldlineSessionState['timeMode']): WorldlineSessionState {
  return { ...session, timeMode };
}

export function selectWorld(state: WorldlineState, worldId: string): WorldlineState {
  const next = state.worlds.find((world) => world.id === worldId);
  if (!next) throw new Error(`Unknown world ${worldId}`);
  return { ...state, activeWorld: structuredClone(next) };
}

export function selectYear(state: WorldlineState, year: number): WorldlineState {
  return { ...state, selectedYear: year };
}

export function selectBranch(state: WorldlineState, branchId: string): WorldlineState {
  if (!state.branches[branchId]) throw new Error(`Unknown branch ${branchId}`);
  return { ...state, activeBranchId: branchId };
}
