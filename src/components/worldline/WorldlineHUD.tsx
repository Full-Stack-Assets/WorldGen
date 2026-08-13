import type { WorldProject } from '../../worldline/studioProjects';
import type { WorldlineState } from '../../worldline/types';
import { FidelityBadge } from './FidelityBadge';

export function WorldlineHUD({ state, project }: { state: WorldlineState; project?: WorldProject }) {
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
        {project && <span className="wl-hud-project">STUDIO · {project.title}</span>}
        <span>{state.activeWorld.name}</span>
        <span>{state.selectedYear}</span>
        <span>{branch?.label ?? 'Baseline'}</span>
        <span className="wl-badge">{state.activeWorld.epistemicClass}</span>
        <FidelityBadge fidelity={state.activeWorld.fidelity} />
        <span className="wl-provider">{state.activeWorld.provider}</span>
      </div>
    </div>
  );
}
