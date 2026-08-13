import { useEffect, useMemo, useRef, useState } from 'react';
import { getSourceTimelineForWorld, nearestSourceSnapshot } from '../../worldline/sourceTimeline';
import { describeTimeMode, nextPlaybackYear, timeVolumeSamples } from '../../worldline/timeEngine';
import { createTwinTimelineState } from '../../worldline/twinTimeline';
import type { TimeMode, WorldlineState } from '../../worldline/types';

const MODES: TimeMode[] = ['PLAYBACK', 'SLICE', 'PARALLAX', 'VOLUME'];
const PLAYBACK_INTERVAL_MS = 800;

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

  const [playing, setPlaying] = useState(false);
  const selectedYearRef = useRef(state.selectedYear);
  const onYearRef = useRef(onYear);

  useEffect(() => {
    selectedYearRef.current = state.selectedYear;
  }, [state.selectedYear]);

  useEffect(() => {
    onYearRef.current = onYear;
  }, [onYear]);

  useEffect(() => {
    if (state.timeMode !== 'PLAYBACK') setPlaying(false);
  }, [state.timeMode]);

  useEffect(() => {
    if (state.timeMode !== 'PLAYBACK' || !playing) return;
    const timer = window.setInterval(() => {
      const current = selectedYearRef.current;
      const next = nextPlaybackYear(current);
      onYearRef.current(next);
    }, PLAYBACK_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [state.timeMode, playing]);

  const volumeSamples = timeVolumeSamples(state.selectedYear, 3);
  const volumeLowerYear = volumeSamples[0]?.year ?? state.selectedYear;
  const volumeUpperYear = volumeSamples.at(-1)?.year ?? state.selectedYear;

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

      {state.timeMode === 'PLAYBACK' && (
        <div className="wl-time-playback">
          <button
            type="button"
            className="wl-primary"
            aria-pressed={playing}
            onClick={() => setPlaying((value) => !value)}
          >
            {playing ? 'Pause' : 'Play'}
          </button>
          <p className="wl-help">{describeTimeMode('PLAYBACK')} Years loop from 2026 to 2046.</p>
        </div>
      )}

      {state.timeMode === 'VOLUME' && (
        <div className="wl-time-volume">
          <p className="wl-help">{describeTimeMode('VOLUME')}</p>
          <div className="wl-time-volume-readout">
            <span>{volumeLowerYear}</span>
            <strong>{state.selectedYear}</strong>
            <span>{volumeUpperYear}</span>
          </div>
        </div>
      )}

      <p className="wl-help">Observation time, reconstruction time, and simulation time remain distinct. The source selector inspects evidence history; the simulation slider moves the active worldline.</p>
    </section>
  );
}
