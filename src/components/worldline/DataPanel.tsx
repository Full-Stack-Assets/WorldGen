import type { WorldlineState } from '../../worldline/types';

export function DataPanel({ state }: { state: WorldlineState }) {
  const branch = state.branches[state.activeBranchId];
  const snapshots = branch?.snapshots ?? [];
  const nearest = [...snapshots].sort((a, b) => Math.abs(a.year - state.selectedYear) - Math.abs(b.year - state.selectedYear))[0];
  const planetary = state.activeWorld.planetary;

  return (
    <section className="wl-panel glass-panel">
      <div className="wl-panel-kicker">DATA</div>
      <h2>{state.activeWorld.name}</h2>
      <div className="wl-compare-grid">
        {nearest && Object.entries(nearest.metrics).map(([key, value]) => (
          <div className="wl-metric" key={key}><span>{key}</span><strong>{value.toLocaleString()}</strong><small>nearest committed slice · {nearest.year}</small></div>
        ))}
      </div>
      {planetary && (
        <div className="wl-planetary-state">
          <h3>Planetary State</h3>
          <dl>
            <div><dt>Gravity</dt><dd>{planetary.gravityG} g</dd></div>
            <div><dt>Atmosphere</dt><dd>{planetary.atmosphere}</dd></div>
            <div><dt>Temperature</dt><dd>{planetary.temperature}</dd></div>
            <div><dt>Radiation</dt><dd>{planetary.radiation}</dd></div>
            <div><dt>Illumination</dt><dd>{planetary.illumination}</dd></div>
            <div><dt>Light-time</dt><dd>{planetary.lightTime}</dd></div>
          </dl>
          <h3>Habitability Landscape</h3>
          <dl>
            {Object.entries(planetary.habitability).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}
          </dl>
        </div>
      )}
    </section>
  );
}
