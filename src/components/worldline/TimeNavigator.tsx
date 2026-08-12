import type { TimeMode, WorldlineState } from '../../worldline/types';

const MODES: TimeMode[] = ['PLAYBACK', 'SLICE', 'PARALLAX', 'VOLUME'];

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
          min={2026}
          max={2046}
          value={state.selectedYear}
          onChange={(event) => onYear(Number(event.target.value))}
        />
        <output>{state.selectedYear}</output>
      </div>
      <div className="wl-segmented">
        {MODES.map((mode) => (
          <button key={mode} className={state.timeMode === mode ? 'active' : ''} onClick={() => onMode(mode)} type="button">
            {mode === 'PARALLAX' ? 'Temporal Parallax' : mode === 'SLICE' ? 'Time Slice' : mode === 'VOLUME' ? 'Time Volume' : 'Playback'}
          </button>
        ))}
      </div>
      <p className="wl-help">Past committed state stays distinct from reachable and speculative futures. Time controls visualization; they do not rewrite committed simulation state.</p>
    </section>
  );
}
