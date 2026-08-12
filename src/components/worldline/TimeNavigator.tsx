import type { TimeMode, WorldlineState } from '../../worldline/types';

const MODES: TimeMode[] = ['PLAYBACK', 'SLICE', 'PARALLAX', 'VOLUME'];

function sourceTimeNote(state: WorldlineState): string {
  if (state.activeWorld.id !== 'new-bedford-001') return 'Simulation timeline';
  if (state.selectedYear <= 2023) return 'Observation source: parcel-service baseline (2023 metadata)';
  if (state.selectedYear <= 2025) return 'Nearest observation: MassGIS 2025 aerial source';
  if (state.selectedYear === 2026) return 'Reconstructed present: open geography + public-source package';
  return 'Simulated future layered over reconstructed present';
}

export function TimeNavigator({
  state,
  onYear,
  onMode,
}: {
  state: WorldlineState;
  onYear: (year: number) => void;
  onMode: (mode: TimeMode) => void;
}) {
  return (
    <section className="wl-panel wl-time-panel glass-panel">
      <div className="wl-panel-kicker">TIME</div>
      <div className="wl-time-row">
        <input
          aria-label="Worldline year"
          type="range"
          min={2023}
          max={2046}
          value={state.selectedYear}
          onChange={(event) => onYear(Number(event.target.value))}
        />
        <output>{state.selectedYear}</output>
      </div>
      <div className="wl-source-time-note">{sourceTimeNote(state)}</div>
      <div className="wl-segmented">
        {MODES.map((mode) => (
          <button key={mode} className={state.timeMode === mode ? 'active' : ''} onClick={() => onMode(mode)} type="button">
            {mode === 'PARALLAX' ? 'Temporal Parallax' : mode === 'SLICE' ? 'Time Slice' : mode === 'VOLUME' ? 'Time Volume' : 'Playback'}
          </button>
        ))}
      </div>
      <p className="wl-help">Observation time, nearest-observation time, reconstruction time, and simulation time remain distinct. Time controls visualization; they do not rewrite committed state.</p>
    </section>
  );
}
