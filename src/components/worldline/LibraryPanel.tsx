import type { WorldlineState } from '../../worldline/types';
import { ChronosExportPanel } from './ChronosExportPanel';

export function LibraryPanel({ state, onSelectWorld }: { state: WorldlineState; onSelectWorld: (id: string) => void }) {
  return (
    <section className="wl-panel glass-panel">
      <div className="wl-panel-kicker">LIBRARY · COSMOS</div>
      <h2>World Catalog</h2>
      <div className="wl-world-grid">
        {state.worlds.map((world) => (
          <button key={world.id} type="button" className={`wl-world-card ${world.id === state.activeWorld.id ? 'active' : ''}`} onClick={() => onSelectWorld(world.id)}>
            <span className="wl-world-orb" data-kind={world.kind} />
            <div><strong>{world.name}</strong><small>{world.kind} · world {world.epistemicClass} · surface {world.surfaceEpistemicClass ?? world.epistemicClass}</small><p>{world.description}</p></div>
          </button>
        ))}
      </div>
      <p className="wl-help">Observed identity, reconstructed surface, simulation, generation, and speculation remain separate even when a procedural renderer is used as visual fallback.</p>
      <ChronosExportPanel state={state} />
    </section>
  );
}
