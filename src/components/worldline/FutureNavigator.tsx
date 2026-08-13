import type { ExperimentSession } from '../../worldline/experiments';
import { clusterFutureFamilies, selectFutureRepresentation } from '../../worldline/futures';
import type { Intervention, InterventionInput } from '../../worldline/interventions';
import type { WorldlineState } from '../../worldline/types';
import { ExperimentHistory } from './ExperimentHistory';
import { FutureLandscape } from './FutureLandscape';
import { InterventionComposer } from './InterventionComposer';

export function FutureNavigator({
  state,
  interventions = [],
  experiments = [],
  onCreateBranch,
  onSelectBranch,
  onAddIntervention = () => undefined,
  onRunExperiment = () => undefined,
}: {
  state: WorldlineState;
  interventions?: Intervention[];
  experiments?: ExperimentSession[];
  onCreateBranch: () => void;
  onSelectBranch: (branchId: string) => void;
  onAddIntervention?: (input: InterventionInput) => void;
  onRunExperiment?: () => void;
}) {
  const simulationAttached = state.activeWorld.id === 'worldgen-prime';
  const branches = Object.values(state.branches);
  const representation = selectFutureRepresentation(branches.length);
  const families = clusterFutureFamilies(branches);
  const showLandscape = representation === 'FAMILIES' || representation === 'LANDSCAPE' || representation === 'CONTINENTS';
  const activeInterventions = interventions
    .filter((item) => item.worldId === state.activeWorld.id && item.branchId === state.activeBranchId)
    .sort((a, b) => a.id.localeCompare(b.id));
  const activeExperiments = experiments
    .filter((item) => item.worldId === state.activeWorld.id && item.branchId === state.activeBranchId);

  if (!simulationAttached) {
    return (
      <section className="wl-panel glass-panel">
        <div className="wl-panel-kicker">FUTURES</div>
        <h2>Simulation model not attached</h2>
        <p className="wl-help">{state.activeWorld.name} can be explored as {state.activeWorld.epistemicClass.toLowerCase()} world state, but Worldline Studio does not attach WorldGen branch metrics to this world. Scenario execution is disabled here rather than presenting unrelated synthetic metrics as a city or planetary forecast.</p>
      </section>
    );
  }

  return (
    <section className={`wl-panel glass-panel ${showLandscape ? 'wl-futures-wide' : ''}`}>
      <div className="wl-panel-header">
        <div>
          <div className="wl-panel-kicker">FUTURES</div>
          <h2>{representation === 'CONTINENTS' ? 'Future Continents' : representation === 'LANDSCAPE' ? 'Future Landscape' : representation === 'FAMILIES' ? 'Future Families' : 'Branch Atlas'}</h2>
        </div>
        <span className="wl-badge">{branches.length} worlds</span>
      </div>
      {showLandscape && <FutureLandscape branches={branches} activeBranchId={state.activeBranchId} onSelectBranch={onSelectBranch} />}
      <div className="wl-branch-list">
        {branches.map((branch) => (
          <button key={branch.id} type="button" className={`wl-branch-card ${state.activeBranchId === branch.id ? 'active' : ''}`} onClick={() => onSelectBranch(branch.id)}>
            <span>{branch.label}</span>
            <small>{branch.parentId ? `fork ${branch.forkYear}` : 'root worldline'}</small>
          </button>
        ))}
      </div>
      <button className="wl-primary" type="button" onClick={onCreateBranch}>Branch from {state.selectedYear}</button>
      <div className="wl-family-strip" aria-label="Future families">
        {families.map((family) => <span key={family.id}>{family.label} · {family.branchIds.length}</span>)}
      </div>
      <p className="wl-help">Future geography is a visualization of discrete scenario similarity and reachability. Landscape position and divergence are deterministic branch-metric projections, not calibrated probability.</p>

      <InterventionComposer
        worldId={state.activeWorld.id}
        branchId={state.activeBranchId}
        selectedYear={state.selectedYear}
        onAdd={onAddIntervention}
        onRun={onRunExperiment}
      />
      {activeInterventions.length > 0 && (
        <div className="wl-studio-interventions" aria-label="Active Studio interventions">
          {activeInterventions.map((intervention) => (
            <div key={intervention.id} className="wl-studio-intervention">
              <span>{intervention.label}</span>
              <small>{intervention.category} · {intervention.startYear}</small>
            </div>
          ))}
        </div>
      )}
      <ExperimentHistory experiments={activeExperiments} />
    </section>
  );
}
