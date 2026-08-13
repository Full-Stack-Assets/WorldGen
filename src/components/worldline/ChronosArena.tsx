import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  anchorChronos,
  countChronosConvergence,
  createChronosEcho,
  createChronosGameplayState,
  detectChronosConvergence,
  echoPointAt,
  moveChronos,
  resetChronos,
  type ChronosGameplayState,
  type ChronosPoint,
} from '../../worldline/chronosGameplay';
import {
  applyChronosDivergence,
  chronosDivergenceChoices,
  chronosDynamicRange,
  isConverging,
} from '../../worldline/chronosSpectacle';

export const CHRONOS_EVIDENCE_COPY = 'Fictional gameplay mechanic inspired by worldline and spacetime concepts. Echoes are deterministic replays, not experimentally verified time manipulation.';

function polylinePoints(samples: ChronosPoint[]): string {
  return samples.map((point) => `${point.x},${point.y}`).join(' ');
}

export function ChronosArena({ onClose }: { onClose?: () => void }) {
  const [state, setState] = useState<ChronosGameplayState>(() => createChronosGameplayState());
  const [playbackIndex, setPlaybackIndex] = useState<number | null>(null);
  const lastConvergenceRef = useRef<string | null>(null);

  const move = useCallback((dx: number, dy: number) => {
    setState((current) => moveChronos(current, dx, dy));
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const directions: Record<string, [number, number]> = {
        ArrowUp: [0, -4], w: [0, -4], W: [0, -4],
        ArrowDown: [0, 4], s: [0, 4], S: [0, 4],
        ArrowLeft: [-4, 0], a: [-4, 0], A: [-4, 0],
        ArrowRight: [4, 0], d: [4, 0], D: [4, 0],
      };
      const delta = directions[event.key];
      if (!delta) return;
      event.preventDefault();
      move(delta[0], delta[1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move]);

  useEffect(() => {
    if (playbackIndex === null || !state.echo || state.echo.samples.length === 0) return;
    if (playbackIndex >= state.echo.samples.length - 1) return;
    const timer = window.setTimeout(() => setPlaybackIndex((index) => index === null ? null : index + 1), 280);
    return () => window.clearTimeout(timer);
  }, [playbackIndex, state.echo]);

  const echoPoint = useMemo(() => {
    if (!state.echo || playbackIndex === null) return null;
    return echoPointAt(state.echo, playbackIndex);
  }, [playbackIndex, state.echo]);

  useEffect(() => {
    if (!state.echo || !echoPoint || playbackIndex === null) return;
    const current = state.samples.at(-1);
    if (!current || !detectChronosConvergence(current, echoPoint, 4.5)) return;
    const key = `${state.echo.id}:${playbackIndex}`;
    if (lastConvergenceRef.current === key) return;
    lastConvergenceRef.current = key;
    setState((value) => countChronosConvergence(value));
  }, [echoPoint, playbackIndex, state.echo, state.samples]);

  const createAnchor = () => {
    setState((current) => anchorChronos(current));
    setPlaybackIndex(null);
    lastConvergenceRef.current = null;
  };

  const createEcho = () => {
    setState((current) => {
      const next = createChronosEcho(current);
      setPlaybackIndex(next.echo && next.echo.samples.length > 0 ? 0 : null);
      return next;
    });
    lastConvergenceRef.current = null;
  };

  const reset = () => {
    setState((current) => resetChronos(current));
    setPlaybackIndex(null);
    lastConvergenceRef.current = null;
  };

  const echoEnabled = Boolean(state.anchor && state.samples.length > state.anchor.sampleIndex + 1);
  const anchorPoint = state.anchor ? state.samples[state.anchor.sampleIndex] : null;
  const converging = isConverging(state.samples.at(-1), echoPoint, 4.5);
  const range = chronosDynamicRange(state, converging);
  const choices = chronosDivergenceChoices(state);

  return (
    <section className={`wl-chronos-arena glass-panel wl-chronos-${range.toLowerCase()}`} aria-label="Chronos playable worldline arena" data-dynamic-range={range}>
      <header className="wl-chronos-header">
        <div><div className="wl-panel-kicker">CHRONOS PARADIGM</div><h2>Worldline Arena</h2></div>
        {onClose && <button type="button" className="wl-secondary" onClick={onClose}>Close</button>}
      </header>
      <p className="wl-chronos-boundary">{CHRONOS_EVIDENCE_COPY}</p>
      <p className="wl-chronos-range" aria-live="polite">Dynamic range · {range} · fictional intensity, not physics</p>
      <div className={`wl-chronos-stage ${converging ? 'converging' : ''}`}>
        <svg viewBox="0 0 100 100" role="img" aria-label="Recorded current worldline and deterministic temporal Echo">
          <defs>
            <filter id="chronos-glow"><feGaussianBlur stdDeviation="1.3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          <rect x="1" y="1" width="98" height="98" rx="5" className="wl-chronos-grid" />
          <polyline points={polylinePoints(state.samples)} className="wl-chronos-current-line" />
          {state.echo && <polyline points={polylinePoints(state.echo.samples)} className="wl-chronos-echo-line" />}
          {anchorPoint && <g className="wl-chronos-anchor"><circle cx={anchorPoint.x} cy={anchorPoint.y} r="3.2"/><circle cx={anchorPoint.x} cy={anchorPoint.y} r="1.1"/></g>}
          <circle cx={state.position.x} cy={state.position.y} r="2.7" className="wl-chronos-player" filter="url(#chronos-glow)" />
          {echoPoint && <circle cx={echoPoint.x} cy={echoPoint.y} r="2.3" className="wl-chronos-echo" filter="url(#chronos-glow)" />}
        </svg>
        <div className="wl-chronos-readout"><span>t {state.samples.at(-1)?.t ?? 0}</span><span>samples {state.samples.length}</span><span>convergences {state.convergenceCount}</span></div>
      </div>
      <div className="wl-chronos-controls" aria-label="Chronos movement controls">
        <button type="button" onClick={() => move(0, -4)}>↑</button>
        <div><button type="button" onClick={() => move(-4, 0)}>←</button><button type="button" onClick={() => move(0, 4)}>↓</button><button type="button" onClick={() => move(4, 0)}>→</button></div>
      </div>
      <div className="wl-chronos-actions">
        <button type="button" className="wl-primary" onClick={createAnchor}>Anchor</button>
        <button type="button" className="wl-primary" disabled={!echoEnabled} onClick={createEcho}>Create exact Echo</button>
        <button type="button" className="wl-secondary" onClick={reset}>Reset</button>
      </div>
      <div className="wl-chronos-divergence" aria-label="Readable future choices">
        {choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            className="wl-secondary"
            onClick={() => setState((current) => applyChronosDivergence(moveChronos, current, choice))}
          >
            {choice.label}
          </button>
        ))}
      </div>
      <p className="wl-help">Move with WASD/arrow keys or the controls. Anchor a moment, move again, then replay the exact post-anchor segment as an Echo. Divergence offers a few readable fictional choices. The arena is local gameplay state and does not alter the active Worldline simulation branch.</p>
    </section>
  );
}
