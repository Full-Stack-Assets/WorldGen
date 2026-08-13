import type { WorldlineState } from '../../worldline/types';
import { listEarthAdapters } from '../../worldline/earthAdapters';
import { createProviderRegistry } from '../../worldline/providers';
import { PlanetaryStatePanel } from './PlanetaryStatePanel';
import { SourceInspector } from './SourceInspector';

export function DataPanel({ state }: { state: WorldlineState }) {
  const branch = state.branches[state.activeBranchId];
  const snapshots = branch?.snapshots ?? [];
  const nearest = [...snapshots].sort((a, b) => Math.abs(a.year - state.selectedYear) - Math.abs(b.year - state.selectedYear))[0];
  const hasCommittedMetrics = state.activeWorld.id === 'worldgen-prime' && nearest?.worldId === 'worldgen-prime';

  return (
    <section className="wl-panel glass-panel">
      <div className="wl-panel-kicker">DATA</div>
      <h2>{state.activeWorld.name}</h2>
      {hasCommittedMetrics ? (
        <div className="wl-compare-grid">
          {Object.entries(nearest.metrics).map(([key, value]) => (
            <div className="wl-metric" key={key}><span>{key}</span><strong>{value.toLocaleString()}</strong><small>nearest committed WorldGen slice · {nearest.year}</small></div>
          ))}
        </div>
      ) : (
        <p className="wl-help">No committed WorldGen metric series is attached to this world. Real-world source state, planetary metadata, and simulation metrics remain separate.</p>
      )}
      <PlanetaryStatePanel world={state.activeWorld} />
      <SourceInspector worldId={state.activeWorld.id} />
      <section className="wl-earth-adapters">
        <div className="wl-panel-kicker">EARTH ADAPTERS</div>
        <p className="wl-help">Provider IDs never become world identity. Free-first Open Earth remains the mandatory path; credentialed photoreal tiles stay optional.</p>
        {listEarthAdapters(createProviderRegistry({ localNewBedfordAvailable: true })).map((adapter) => (
          <div key={adapter.id} className="wl-metric">
            <span>{adapter.label}</span>
            <strong>{adapter.available ? 'available' : 'unavailable'}</strong>
            <small>{adapter.epistemicRendering} · {adapter.credentialRequired ? 'credentialed optional' : 'free-first'} · not canonical</small>
          </div>
        ))}
      </section>
    </section>
  );
}
