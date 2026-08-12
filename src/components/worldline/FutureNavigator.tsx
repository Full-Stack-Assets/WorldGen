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
  const branches = Object.values(state.branches);
  const representation = selectFutureRepresentation(branches.length);
  const families = clusterFutureFamilies(branches);
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
