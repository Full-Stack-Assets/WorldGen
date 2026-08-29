import type { WorldlineState } from '../../worldline/types';
import { NEW_BEDFORD_SCENARIO_LAB } from '../../worldline/validationLadder';

function latestMetrics(state: WorldlineState): Record<string, number> {
  const branch = state.branches[state.activeBranchId];
  const snapshot = branch?.snapshots.filter((item) => item.year <= state.selectedYear).sort((a, b) => a.year - b.year).at(-1);
  return snapshot?.metrics ?? {};
}

const FABRIC = [
  ['ACCESS', 'Travel time'],
  ['MOBILITY', 'Job reach'],
  ['ECONOMY', 'Rent pressure'],
  ['CLIMATE', 'Harbor risk'],
] as const;

export function TemporalRealityStudio({
  state,
  onYear,
  onCreateBranch,
  onSelectBranch,
}: {
  state: WorldlineState;
  onYear: (year: number) => void;
  onCreateBranch: () => void;
  onSelectBranch: (branchId: string) => void;
}) {
  const branch = state.branches[state.activeBranchId];
  const branches = Object.values(state.branches).sort((left, right) => left.id.localeCompare(right.id));
  const metrics = latestMetrics(state);
  const metricEntries = Object.entries(metrics).slice(0, 4);
  const epistemic = state.activeWorld.surfaceEpistemicClass ?? state.activeWorld.epistemicClass;
  const municipalScenario = state.activeWorld.id === 'new-bedford-001' ? NEW_BEDFORD_SCENARIO_LAB : null;
  return (
    <section className="tr-studio" aria-label="Temporal Reality Studio">
      <header className="tr-command">
        <div><span>WORLDLINE 4D</span><strong>Temporal Reality Studio</strong></div>
        <div className="tr-command-pills"><em>READ-ONLY PROJECTION</em><em>{epistemic}</em><em>{municipalScenario ? 'SCENARIO · NOT PREDICTION' : `${branches.length} WORLDLINES`}</em></div>
      </header>

      <aside className="tr-fabric glass-panel">
        <div className="tr-kicker">CAUSAL FABRIC</div>
        <h2>Shape the mechanism</h2>
        <p>Every edge is inspectable, versioned, and bounded by evidence.</p>
        <div className="tr-fabric-chain">
          {FABRIC.map(([code, label], index) => (
            <div className="tr-fabric-node" key={code}>
              <i data-index={index + 1}>{index + 1}</i><span><small>{code}</small><strong>{label}</strong></span>
            </div>
          ))}
        </div>
        <button type="button" className="tr-ghost-action">Open Mechanism Composer <span>↗</span></button>
      </aside>

      <div className="tr-aperture" aria-label="Read-only world projection">
        <div className="tr-orbit tr-orbit-a" /><div className="tr-orbit tr-orbit-b" /><div className="tr-orbit tr-orbit-c" />
        <div className="tr-aperture-core">
          <span>{state.activeWorld.name}</span>
          <strong>{state.selectedYear}</strong>
          <small>{branch?.label ?? 'Unknown branch'} · canonical projection</small>
        </div>
        <div className="tr-metric-constellation">
          {metricEntries.map(([label, value], index) => <div key={label} style={{ '--orbit-index': index } as React.CSSProperties}><small>{label}</small><strong>{Number(value).toLocaleString()}</strong></div>)}
        </div>
      </div>

      <aside className="tr-truth glass-panel">
        <div className="tr-kicker">TRUTH LENS</div>
        <h2>What kind of truth?</h2>
        <div className="tr-truth-state"><span className={`truth-${epistemic.toLowerCase()}`} /> <strong>{epistemic}</strong></div>
        <dl>
          <div><dt>Source time</dt><dd>{municipalScenario?.sourceTime ?? state.selectedYear}</dd></div>
          <div><dt>Simulation time</dt><dd>{municipalScenario?.simulationTime ?? state.selectedYear}</dd></div>
          <div><dt>Branch ancestry</dt><dd>{branch?.parentId ? 'FORKED' : 'ROOT'}</dd></div>
          <div><dt>Authority</dt><dd>READ ONLY</dd></div>
        </dl>
        <div className="tr-score-separation">
          <span><small>VISUAL FIDELITY</small><strong>NOT RUN</strong></span>
          <span><small>CAUSAL RELIABILITY</small><strong>NOT RUN</strong></span>
        </div>
        {municipalScenario && <div className="tr-municipal-boundary"><strong>EXPERT REVIEW REQUIRED</strong><span>2 bounded interventions · back-test NOT RUN</span></div>}
      </aside>

      <footer className="tr-loom glass-panel">
        <div className="tr-loom-label"><span>TEMPORAL LOOM</span><strong>{state.selectedYear}</strong></div>
        <div className="tr-loom-track">
          <span>2026</span>
          <input aria-label="Temporal Reality year" type="range" min={2026} max={2046} value={state.selectedYear} onChange={(event) => onYear(Number(event.target.value))} />
          <span>2046</span>
        </div>
        <div className="tr-branches" aria-label="Worldline branches">
          {branches.map((item) => <button key={item.id} type="button" className={item.id === state.activeBranchId ? 'active' : ''} onClick={() => onSelectBranch(item.id)}><i />{item.label}</button>)}
        </div>
        <button type="button" className="tr-fork" onClick={onCreateBranch}>Fork reality at {state.selectedYear}</button>
      </footer>
    </section>
  );
}
