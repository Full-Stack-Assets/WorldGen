import { useEffect, useMemo, useState } from 'react';
import { getSourceTimelineForWorld, nearestSourceSnapshot } from '../../worldline/sourceTimeline';
import { createTwinTimelineState } from '../../worldline/twinTimeline';
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
  const sourceTimeline = useMemo(() => getSourceTimelineForWorld(state.activeWorld.id), [state.activeWorld.id]);
  const initialSourceYear = nearestSourceSnapshot(sourceTimeline, Math.min(state.selectedYear, 2026))?.entry.year ?? state.selectedYear;
  const [sourceYear, setSourceYear] = useState(initialSourceYear);

  useEffect(() => {
    const nearest = nearestSourceSnapshot(sourceTimeline, Math.min(state.selectedYear, 2026));
    setSourceYear(nearest?.entry.year ?? state.selectedYear);
  }, [state.activeWorld.id, sourceTimeline]);

  const sourceSelection = nearestSourceSnapshot(sourceTimeline, sourceYear);
  const twin = createTwinTimelineState(state.selectedYear, sourceYear);

  return (
    <section className="wl-panel wl-time-panel glass-panel">
      <div className="wl-panel-kicker">TIME</div>
      <label className="wl-timeline-label" htmlFor="worldline-simulation-year">SIMULATION TIME</label>
      <div className="wl-time-row">
        <input
          id="worldline-simulation-year"
          aria-label="Worldline simulation year"
          type="range"
          min={2026}
          max={2046}
          value={twin.simulationYear}
          onChange={(event) => onYear(Number(event.target.value))}
        />
        <output>{twin.simulationYear}</output>
      </div>

      {sourceTimeline.length > 0 && (
        <div className="wl-source-timeline">
          <label className="wl-timeline-label" htmlFor="worldline-source-year">SOURCE TIME</label>
          <select id="worldline-source-year" value={twin.sourceYear} onChange={(event) => setSourceYear(Number(event.target.value))}>
            {sourceTimeline.map((entry) => <option key={entry.id} value={entry.year}>{entry.year} · {entry.label}</option>)}
          </select>
          {sourceSelection && (
            <div className="wl-source-time-note">
              <strong>{sourceSelection.entry.epistemicClass}</strong>
              <span>{sourceSelection.entry.note}</span>
              <small>Source time is independent of simulation time. Gaps are not silently interpolated.</small>
            </div>
          )}
        </div>
      )}

      <div className="wl-segmented">
        {MODES.map((mode) => (
          <button key={mode} className={state.timeMode === mode ? 'active' : ''} onClick={() => onMode(mode)} type="button">
            {mode === 'PARALLAX' ? 'Temporal Parallax' : mode === 'SLICE' ? 'Time Slice' : mode === 'VOLUME' ? 'Time Volume' : 'Playback'}
          </button>
        ))}
      </div>
      <p className="wl-help">Observation time, reconstruction time, and simulation time remain distinct. The source selector inspects evidence history; the simulation slider moves the active worldline.</p>
    </section>
  );
}
