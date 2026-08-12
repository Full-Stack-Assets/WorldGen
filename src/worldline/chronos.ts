import type { BranchRecord, WorldlineState } from './types';

export interface ChronosExportBundle {
  schema: 'worldline-chronos-v0.7';
  world: {
    id: string;
    kind: string;
    epistemicClass: string;
    surfaceEpistemicClass: string;
    surfaceRenderingClass: string;
    fidelity: string;
    spatialReference: string;
    referenceFrame: string;
    terrainSourceStatus: string;
    familyId: string | null;
    variantId: string | null;
  };
  selectedYear: number;
  activeBranchId: string;
  branches: Array<{
    id: string;
    parentId: string | null;
    forkYear: number;
    seed: number;
    events: BranchRecord['events'];
    snapshots: Array<{ year: number; commitment: string; eventIds: string[]; metrics: Record<string, number> }>;
  }>;
  replayCommitment: string;
}

function sortedMetrics(metrics: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(metrics).sort(([a], [b]) => a.localeCompare(b)));
}

export function createChronosExport(state: WorldlineState): ChronosExportBundle {
  const branches = Object.values(state.branches)
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((branch) => ({
      id: branch.id,
      parentId: branch.parentId,
      forkYear: branch.forkYear,
      seed: branch.seed,
      events: [...branch.events].sort((a, b) => a.year - b.year || a.id.localeCompare(b.id)).map((event) => ({ ...event, delta: sortedMetrics(event.delta) })),
      snapshots: [...branch.snapshots].sort((a, b) => a.year - b.year || a.id.localeCompare(b.id)).map((snapshot) => ({
        year: snapshot.year,
        commitment: snapshot.commitment,
        eventIds: [...snapshot.eventIds].sort(),
        metrics: sortedMetrics(snapshot.metrics),
      })),
    }));
  const replayCommitment = branches.map((branch) => `${branch.id}:${branch.snapshots.map((snapshot) => snapshot.commitment).join(',')}`).join('|');
  const planetary = state.activeWorld.planetary;
  const surfaceEpistemicClass = state.activeWorld.surfaceEpistemicClass ?? state.activeWorld.epistemicClass;
  return {
    schema: 'worldline-chronos-v0.7',
    world: {
      id: state.activeWorld.id,
      kind: state.activeWorld.kind,
      epistemicClass: state.activeWorld.epistemicClass,
      surfaceEpistemicClass,
      surfaceRenderingClass: planetary?.surfaceRenderingClass ?? surfaceEpistemicClass,
      fidelity: state.activeWorld.fidelity,
      spatialReference: state.activeWorld.spatialReference ?? 'UNSPECIFIED',
      referenceFrame: planetary?.referenceFrame ?? 'UNSPECIFIED',
      terrainSourceStatus: planetary?.terrainSourceStatus ?? 'UNSPECIFIED',
      familyId: state.activeWorld.familyId ?? null,
      variantId: state.activeWorld.variantId ?? null,
    },
    selectedYear: state.selectedYear,
    activeBranchId: state.activeBranchId,
    branches,
    replayCommitment,
  };
}

export function serializeChronosExport(bundle: ChronosExportBundle): string {
  return JSON.stringify(bundle, null, 2);
}
