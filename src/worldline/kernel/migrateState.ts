import type { WorldlineState } from '../types';
import type { CanonicalWorldState, WorldlineSessionState } from './types';

export function deriveSessionState(state: WorldlineState): WorldlineSessionState {
  return {
    activeWorldId: state.activeWorld.id,
    activeBranchId: state.activeBranchId,
    selectedYear: state.selectedYear,
    timeMode: state.timeMode,
  };
}

export function splitWorldlineState(state: WorldlineState): {
  canonical: CanonicalWorldState;
  session: WorldlineSessionState;
} {
  return {
    canonical: structuredClone({
      schema: 'worldline-canonical-state-v1' as const,
      worlds: state.worlds,
      branches: state.branches,
    }),
    session: deriveSessionState(state),
  };
}
