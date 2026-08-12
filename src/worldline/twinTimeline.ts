export interface TwinTimelineState {
  simulationYear: number;
  sourceYear: number;
}

export function createTwinTimelineState(simulationYear: number, sourceYear: number): TwinTimelineState {
  return { simulationYear, sourceYear };
}

export function selectSourceYear(state: TwinTimelineState, sourceYear: number): TwinTimelineState {
  return { ...state, sourceYear };
}

export function selectSimulationYear(state: TwinTimelineState, simulationYear: number): TwinTimelineState {
  return { ...state, simulationYear };
}
