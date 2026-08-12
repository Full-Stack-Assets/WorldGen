export type EpistemicClass = 'OBSERVED' | 'RECONSTRUCTED' | 'SIMULATED' | 'GENERATED' | 'SPECULATIVE';
export type ModelFidelity = 'FIELD' | 'COHORT' | 'MICROSIM' | 'AGENT' | 'INTERACTING_AGENT' | 'COGNITIVE_AGENT' | 'EXPERIENTIAL_MODEL';
export type WorldKind = 'EARTH' | 'SOLAR_SYSTEM' | 'EXOWORLD' | 'GENERATED' | 'SCIENTIFIC' | 'CIVILIZATION';
export type TimeMode = 'PLAYBACK' | 'SLICE' | 'PARALLAX' | 'VOLUME';

export interface PlanetaryState {
  gravityG: number;
  atmosphere: string;
  temperature: string;
  radiation: string;
  illumination: string;
  lightTime: string;
  habitability: {
    microbial: string;
    complexLife: string;
    unprotectedHuman: string;
    supportedSettlement: string;
  };
}

export interface WorldRecord {
  id: string;
  name: string;
  kind: WorldKind;
  epistemicClass: EpistemicClass;
  fidelity: ModelFidelity;
  provider: string;
  description: string;
  planetary?: PlanetaryState;
}

export interface WorldlineEvent {
  id: string;
  year: number;
  type: string;
  label: string;
  delta: Record<string, number>;
}

export interface WorldSnapshot {
  id: string;
  worldId: string;
  branchId: string;
  year: number;
  metrics: Record<string, number>;
  eventIds: string[];
  commitment: string;
}

export interface BranchRecord {
  id: string;
  label: string;
  parentId: string | null;
  forkYear: number;
  seed: number;
  snapshots: WorldSnapshot[];
  events: WorldlineEvent[];
}

export interface WorldlineState {
  worlds: WorldRecord[];
  activeWorld: WorldRecord;
  branches: Record<string, BranchRecord>;
  activeBranchId: string;
  selectedYear: number;
  timeMode: TimeMode;
}

export interface SnapshotDifference {
  metric: string;
  left: number;
  right: number;
  delta: number;
}
