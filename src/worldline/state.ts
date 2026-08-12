import { ROOT_BRANCH, WORLD_CATALOG } from './fixtures';
import type { BranchRecord, SnapshotDifference, WorldSnapshot, WorldlineState } from './types';

export function createInitialWorldlineState(): WorldlineState {
  const root = structuredClone(ROOT_BRANCH);
  const worlds = structuredClone(WORLD_CATALOG);
  return {
    worlds,
    activeWorld: worlds[0],
    branches: { [root.id]: root },
    activeBranchId: root.id,
    selectedYear: 2026,
    timeMode: 'SLICE',
  };
}

export function commitSnapshot(state: WorldlineState, snapshot: WorldSnapshot): WorldlineState {
  const branch = state.branches[snapshot.branchId];
  if (!branch) throw new Error(`Unknown branch ${snapshot.branchId}`);
  const nextBranch: BranchRecord = {
    ...branch,
    snapshots: [...branch.snapshots.filter((item) => item.year !== snapshot.year), structuredClone(snapshot)].sort((a, b) => a.year - b.year),
  };
  return {
    ...state,
    branches: { ...state.branches, [branch.id]: nextBranch },
  };
}

export function createBranch(
  state: WorldlineState,
  input: { label: string; atYear: number },
): WorldlineState {
  const parent = state.branches[state.activeBranchId];
  if (!parent) throw new Error('Active branch is missing');
  const eligibleSnapshots = parent.snapshots.filter((snapshot) => snapshot.year <= input.atYear);
  if (eligibleSnapshots.length === 0) throw new Error('Cannot branch before the first committed snapshot');
  const forkSnapshot = eligibleSnapshots[eligibleSnapshots.length - 1];
  const id = `branch-${Object.keys(state.branches).length}-${input.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const child: BranchRecord = {
    id,
    label: input.label,
    parentId: parent.id,
    forkYear: input.atYear,
    seed: parent.seed + Object.keys(state.branches).length * 7919,
    events: [],
    snapshots: [{ ...structuredClone(forkSnapshot), id: `${id}-${forkSnapshot.year}`, branchId: id }],
  };
  return {
    ...state,
    branches: { ...state.branches, [id]: child },
    activeBranchId: id,
    selectedYear: input.atYear,
  };
}

export function replayBranch(state: WorldlineState, branchId: string): WorldSnapshot[] {
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
