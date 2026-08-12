import type { WorldlineState } from '../../worldline/types';
import { RecursiveLoopPanel } from './RecursiveLoopPanel';

export function MechanicsPanel({ state }: { state: WorldlineState }) {
  const branch = state.branches[state.activeBranchId];
  return (
    <section className="wl-panel glass-panel">
      <div className="wl-panel-kicker">MECHANICS</div>
      <h2>Evidence & Lineage</h2>
      <dl className="wl-mechanics-list">
        <div><dt>World class</dt><dd>{state.activeWorld.epistemicClass}</dd></div>
        <div><dt>Model fidelity</dt><dd>{state.activeWorld.fidelity}</dd></div>
        <div><dt>Provider</dt><dd>{state.activeWorld.provider}</dd></div>
        <div><dt>Branch</dt><dd>{branch?.id}</dd></div>
        <div><dt>Parent</dt><dd>{branch?.parentId ?? 'root'}</dd></div>
        <div><dt>Fork year</dt><dd>{branch?.forkYear}</dd></div>
        <div><dt>Seed</dt><dd>{branch?.seed}</dd></div>
      </dl>
      <RecursiveLoopPanel />
    </section>
  );
}
