import { createChronosExport, serializeChronosExport } from '../../worldline/chronos';
import type { WorldlineState } from '../../worldline/types';

export function ChronosExportPanel({ state }: { state: WorldlineState }) {
  const download = () => {
    const content = serializeChronosExport(createChronosExport(state));
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'worldline-chronos-v0.7.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="wl-chronos-export">
      <div className="wl-panel-kicker">CHRONOS BRIDGE</div>
      <h3>Runtime-neutral interchange</h3>
      <p>Exports committed world identity, time, branch ancestry, events, evidence labels, surface-rendering class, reference-frame metadata, deterministic seeds, and replay commitments without binding to the active map or tile provider.</p>
      <button className="wl-primary" type="button" onClick={download}>Export Chronos v0.7 bundle</button>
      <small>This is an interchange package for future Unreal/Cesium tooling, not a shipping Unreal build.</small>
    </section>
  );
}
