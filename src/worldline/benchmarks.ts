import type { WorldlineState } from './types';

export type BenchmarkName = '4DWorldBench' | 'Omni-WorldBench';
export type BenchmarkStatus = 'NOT_RUN' | 'COMPLETED' | 'FAILED' | 'INCOMPATIBLE';

export interface BenchmarkReceipt {
  id: string;
  benchmark: BenchmarkName;
  benchmarkVersion: string;
  artifactVersion: string;
  seed: number;
  evaluatorConfigId: string;
  verifierId: string;
  heldOut: boolean;
  status: BenchmarkStatus;
  score: number | null;
  notes: string;
}

export interface FourDWorldBenchExport {
  schema: 'worldline-4dworldbench-export-v0.2';
  worldId: string;
  branchId: string;
  years: number[];
  renderFrames: Array<{ year: number; snapshotCommitment: string }>;
  note: string;
}

export interface OmniWorldBenchTrace {
  schema: 'worldline-omniworldbench-trace-v0.2';
  worldId: string;
  branchId: string;
  transitions: Array<{ year: number; eventIds: string[]; snapshotCommitment: string }>;
  note: string;
}

export function createBenchmarkReceipt(input: {
  benchmark: BenchmarkName;
  status: BenchmarkStatus;
  score?: number | null;
  benchmarkVersion?: string;
  artifactVersion?: string;
  seed?: number;
  evaluatorConfigId?: string;
  verifierId?: string;
  heldOut?: boolean;
  notes?: string;
}): BenchmarkReceipt {
  if (input.status !== 'COMPLETED' && input.score != null) {
    throw new Error('Benchmark score may only be recorded for a completed executed benchmark');
  }
  return {
    id: `${input.benchmark.toLowerCase()}-${input.status.toLowerCase()}`,
    benchmark: input.benchmark,
    benchmarkVersion: input.benchmarkVersion ?? 'adapter-contract-v0.2',
    artifactVersion: input.artifactVersion ?? 'worldline-v0.2',
    seed: input.seed ?? 424242,
    evaluatorConfigId: input.evaluatorConfigId ?? 'not-executed',
    verifierId: input.verifierId ?? 'worldline-benchmark-ledger',
    heldOut: input.heldOut ?? false,
    status: input.status,
    score: input.score ?? null,
    notes: input.notes ?? 'Adapter/export contract available; benchmark has not been executed.',
  };
}

export function create4DWorldBenchExport(state: WorldlineState): FourDWorldBenchExport {
  const branch = state.branches[state.activeBranchId];
  if (!branch) throw new Error('Active branch missing');
  const snapshots = [...branch.snapshots].sort((a, b) => a.year - b.year);
  return {
    schema: 'worldline-4dworldbench-export-v0.2',
    worldId: state.activeWorld.id,
    branchId: branch.id,
    years: snapshots.map((snapshot) => snapshot.year),
    renderFrames: snapshots.map((snapshot) => ({ year: snapshot.year, snapshotCommitment: snapshot.commitment })),
    note: 'Compatibility export only. No benchmark score is implied until the external benchmark is actually executed.',
  };
}

export function createOmniWorldBenchTrace(state: WorldlineState): OmniWorldBenchTrace {
  const branch = state.branches[state.activeBranchId];
  if (!branch) throw new Error('Active branch missing');
  return {
    schema: 'worldline-omniworldbench-trace-v0.2',
    worldId: state.activeWorld.id,
    branchId: branch.id,
    transitions: [...branch.snapshots].sort((a, b) => a.year - b.year).map((snapshot) => ({
      year: snapshot.year,
      eventIds: [...snapshot.eventIds].sort(),
      snapshotCommitment: snapshot.commitment,
    })),
    note: 'Deterministic interaction/state-transition trace. It is not an Omni-WorldBench result until evaluated externally.',
  };
}
