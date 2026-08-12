import type { WorldlineState } from '../../worldline/types';
import { BenchmarkLab } from './BenchmarkLab';
import { RecursiveLoopPanel } from './RecursiveLoopPanel';
import { ReleaseStatus } from './ReleaseStatus';

export function MechanicsPanel({ state }: { state: WorldlineState }) {
  const branch = state.branches[state.activeBranchId];
  return (
    <section className="wl-panel glass-panel">
      <div className="wl-panel-kicker">MECHANICS</div>
      <h2>Evidence & Lineage</h2>
      <dl className="wl-mechanics-list">
        <div><dt>World class</dt><dd>{state.activeWorld.epistemicClass}</dd></div>
        <div><dt>Surface class</dt><dd>{state.activeWorld.surfaceEpistemicClass ?? state.activeWorld.epistemicClass}</dd></div>
        <div><dt>Model fidelity</dt><dd>{state.activeWorld.fidelity}</dd></div>
        <div><dt>Spatial reference</dt><dd>{state.activeWorld.spatialReference ?? 'unspecified'}</dd></div>
        <div><dt>Provider description</dt><dd>{state.activeWorld.provider}</dd></div>
        <div><dt>Branch</dt><dd>{branch?.id}</dd></div>
        <div><dt>Parent</dt><dd>{branch?.parentId ?? 'root'}</dd></div>
        <div><dt>Fork year</dt><dd>{branch?.forkYear}</dd></div>
        <div><dt>Seed</dt><dd>{branch?.seed}</dd></div>
      </dl>
      <ReleaseStatus />
      <BenchmarkLab state={state} />
      <RecursiveLoopPanel />
    </section>
  );
}
