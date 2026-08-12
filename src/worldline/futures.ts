import type { BranchRecord } from './types';

export type FutureRepresentation = 'DIRECT' | 'WORLDLINES' | 'FAMILIES' | 'LANDSCAPE' | 'CONTINENTS';

export interface FutureFamily {
  id: string;
  label: string;
  branchIds: string[];
  signature: string;
}

export function selectFutureRepresentation(branchCount: number): FutureRepresentation {
  if (branchCount <= 2) return 'DIRECT';
  if (branchCount <= 4) return 'WORLDLINES';
  if (branchCount <= 50) return 'FAMILIES';
  if (branchCount <= 10000) return 'LANDSCAPE';
  return 'CONTINENTS';
}

export function clusterFutureFamilies(branches: BranchRecord[]): FutureFamily[] {
  const groups = new Map<string, string[]>();
  for (const branch of branches) {
    const last = branch.snapshots[branch.snapshots.length - 1];
    const vitality = last?.metrics.vitality ?? 0;
    const resilience = last?.metrics.resilience ?? 0;
    const population = last?.metrics.population ?? 0;
    const signature = `${Math.round(vitality / 10) * 10}:${Math.round(resilience / 10) * 10}:${Math.round(population / 10000) * 10000}`;
    groups.set(signature, [...(groups.get(signature) ?? []), branch.id]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([signature, branchIds], index) => ({
      id: `family-${index + 1}`,
      label: `Future Family ${index + 1}`,
      branchIds,
      signature,
    }));
}
