import { WORLDLINE_RELEASE } from '../../worldline/release';
import type { WorldProject } from '../../worldline/studioProjects';
import type { WorldlineState } from '../../worldline/types';
import { BenchmarkLab } from './BenchmarkLab';
import { RecursiveLoopPanel } from './RecursiveLoopPanel';
import { ReleaseStatus } from './ReleaseStatus';
import { WorldModelReferencePanel } from './WorldModelReferencePanel';

export function MechanicsPanel({ state, project }: { state: WorldlineState; project?: WorldProject }) {
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
      {project && (
        <section className="wl-studio-mechanics" aria-label="Worldline Studio schemas">
          <div className="wl-panel-kicker">STUDIO PROJECT</div>
          <h3>{project.title}</h3>
          <dl className="wl-mechanics-list">
            <div><dt>Project</dt><dd>{project.id}</dd></div>
            <div><dt>Project schema</dt><dd>{WORLDLINE_RELEASE.projectSchema}</dd></div>
            <div><dt>Experiment schema</dt><dd>{WORLDLINE_RELEASE.experimentSchema}</dd></div>
            <div><dt>Worldpack schema</dt><dd>{WORLDLINE_RELEASE.worldpackSchema}</dd></div>
            <div><dt>Interventions</dt><dd>{project.interventions.length}</dd></div>
            <div><dt>Experiments</dt><dd>{project.experiments.length}</dd></div>
          </dl>
          <p className="wl-help">Studio interventions and experiment results remain scenario artifacts. They cannot be promoted to observed evidence by the project layer.</p>
        </section>
      )}
      <ReleaseStatus />
      <WorldModelReferencePanel />
      <BenchmarkLab state={state} />
      <RecursiveLoopPanel />
    </section>
  );
}
