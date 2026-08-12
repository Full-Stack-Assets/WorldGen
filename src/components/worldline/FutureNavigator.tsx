import { clusterFutureFamilies, selectFutureRepresentation } from '../../worldline/futures';
import type { WorldlineState } from '../../worldline/types';

export function FutureNavigator({
  state,
  onCreateBranch,
  onSelectBranch,
}: {
  state: WorldlineState;
  onCreateBranch: () => void;
  onSelectBranch: (branchId: string) => void;
}) {
  const simulationAttached = state.activeWorld.id === 'worldgen-prime';
  const branches = Object.values(state.branches);
  const representation = selectFutureRepresentation(branches.length);
  const families = clusterFutureFamilies(branches);

  if (!simulationAttached) {
    return (
      <section className="wl-panel glass-panel">
        <div className="wl-panel-kicker">FUTURES</div>
        <h2>Simulation model not attached</h2>
        <p className="wl-help">{state.activeWorld.name} can be explored as {state.activeWorld.epistemicClass.toLowerCase()} world state, but the v0.2 release does not attach the WorldGen branch metrics to this world. Future generation is disabled here rather than presenting unrelated synthetic metrics as a city or planetary forecast.</p>
      </section>
    );
  }

  return (
    <section className="wl-panel glass-panel">
      <div className="wl-panel-header">
        <div>
          <div className="wl-panel-kicker">FUTURES</div>
          <h2>{representation === 'CONTINENTS' ? 'Future Continents' : representation === 'LANDSCAPE' ? 'Future Landscape' : representation === 'FAMILIES' ? 'Future Families' : 'Branch Atlas'}</h2>
        </div>
        <span className="wl-badge">{branches.length} worlds</span>
      </div>
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
      <p className="wl-help">Future geography is a visualization of discrete scenario similarity and reachability, not a calibrated probability map.</p>
    </section>
  );
}
