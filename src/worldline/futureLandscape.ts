import { clusterFutureFamilies } from './futures';
import type { BranchRecord } from './types';

export interface FutureLandscapePoint {
  branchId: string;
  x: number;
  y: number;
  divergence: number;
  familyId: string;
}

function latestMetrics(branch: BranchRecord): Record<string, number> {
  const latest = [...branch.snapshots].sort((a, b) => a.year - b.year).at(-1);
  return latest?.metrics ?? {};
}

function clamp100(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function projectFutureLandscape(input: BranchRecord[]): FutureLandscapePoint[] {
  const branches = [...input].sort((a, b) => a.id.localeCompare(b.id));
  if (branches.length === 0) return [];

  const metricKeys = [...new Set(branches.flatMap((branch) => Object.keys(latestMetrics(branch))))].sort();
  const metricsByBranch = new Map(branches.map((branch) => [branch.id, latestMetrics(branch)]));
  const ranges = new Map(metricKeys.map((key) => {
    const values = branches.map((branch) => metricsByBranch.get(branch.id)?.[key] ?? 0);
    return [key, { min: Math.min(...values), max: Math.max(...values) }] as const;
  }));

  const vectors = new Map<string, number[]>();
  for (const branch of branches) {
    const metrics = metricsByBranch.get(branch.id) ?? {};
    vectors.set(branch.id, metricKeys.map((key) => {
      const range = ranges.get(key)!;
      if (range.max === range.min) return 0.5;
      return ((metrics[key] ?? 0) - range.min) / (range.max - range.min);
    }));
  }

  const root = branches.find((branch) => branch.parentId === null) ?? branches[0];
  const rootVector = vectors.get(root.id) ?? [];
  const rawDistances = new Map<string, number>();
  let maxDistance = 0;
  for (const branch of branches) {
    const vector = vectors.get(branch.id) ?? [];
    const distance = Math.sqrt(vector.reduce((sum, value, index) => {
      const delta = value - (rootVector[index] ?? 0);
      return sum + delta * delta;
    }, 0));
    rawDistances.set(branch.id, distance);
    maxDistance = Math.max(maxDistance, distance);
  }

  const familyByBranch = new Map<string, string>();
  for (const family of clusterFutureFamilies(branches)) {
    for (const branchId of family.branchIds) familyByBranch.set(branchId, family.id);
  }

  return branches.map((branch) => {
    const vector = vectors.get(branch.id) ?? [];
    const even = vector.filter((_, index) => index % 2 === 0);
    const odd = vector.filter((_, index) => index % 2 === 1);
    const xUnit = even.length ? even.reduce((sum, value) => sum + value, 0) / even.length : 0.5;
    const yUnit = odd.length ? odd.reduce((sum, value) => sum + value, 0) / odd.length : xUnit;
    return {
      branchId: branch.id,
      x: Number(clamp100(8 + xUnit * 84).toFixed(4)),
      y: Number(clamp100(8 + (1 - yUnit) * 84).toFixed(4)),
      divergence: branch.id === root.id || maxDistance === 0 ? 0 : Number(((rawDistances.get(branch.id) ?? 0) / maxDistance).toFixed(6)),
      familyId: familyByBranch.get(branch.id) ?? 'family-unclassified',
    };
  });
}
