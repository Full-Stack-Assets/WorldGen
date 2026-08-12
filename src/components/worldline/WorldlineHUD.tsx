import type { WorldlineState } from '../../worldline/types';

export function WorldlineHUD({ state }: { state: WorldlineState }) {
  const branch = state.branches[state.activeBranchId];
  return (
    <div className="wl-hud glass-panel" aria-label="Worldline status">
      <div className="wl-brand">
        <span className="wl-brand-mark">W</span>
        <div>
          <strong>WORLDLINE</strong>
          <span>Navigate what remains possible</span>
        </div>
      </div>
      <div className="wl-hud-meta">
        <span>{state.activeWorld.name}</span>
        <span>{state.selectedYear}</span>
        <span>{branch?.label ?? 'Baseline'}</span>
        <span className="wl-badge">{state.activeWorld.epistemicClass}</span>
        <span className="wl-badge">{state.activeWorld.fidelity}</span>
        <span className="wl-provider">{state.activeWorld.provider}</span>
      </div>
    </div>
  );
}
