import type { ChronosGameplayState, ChronosPoint } from './chronosGameplay';

export type ChronosDynamicRange =
  | 'QUIET'
  | 'TENSION'
  | 'ACTION'
  | 'CONVERGENCE'
  | 'RUPTURE'
  | 'SILENCE';

export interface ChronosDivergenceChoice {
  id: string;
  label: string;
  dx: number;
  dy: number;
}

export function chronosDynamicRange(state: ChronosGameplayState, converging = false): ChronosDynamicRange {
  if (state.samples.length <= 1 && !state.anchor) return 'QUIET';
  if (state.convergenceCount >= 3) return 'RUPTURE';
  if (converging) return 'CONVERGENCE';
  if (state.echo) return 'ACTION';
  if (state.anchor) return 'TENSION';
  if (state.samples.length > 12) return 'SILENCE';
  return 'ACTION';
}

export function chronosDivergenceChoices(state: ChronosGameplayState): ChronosDivergenceChoice[] {
  const heading = state.samples.length < 2
    ? { x: 1, y: 0 }
    : {
        x: state.position.x - (state.samples.at(-2)?.x ?? state.position.x),
        y: state.position.y - (state.samples.at(-2)?.y ?? state.position.y),
      };
  const len = Math.hypot(heading.x, heading.y) || 1;
  const nx = heading.x / len;
  const ny = heading.y / len;
  const step = 8;
  return [
    { id: 'continue', label: 'Continue the recorded heading', dx: Math.round(nx * step), dy: Math.round(ny * step) },
    { id: 'veer-port', label: 'Veer port of the current worldline', dx: Math.round(-ny * step), dy: Math.round(nx * step) },
    { id: 'veer-starboard', label: 'Veer starboard of the current worldline', dx: Math.round(ny * step), dy: Math.round(-nx * step) },
  ];
}

export function applyChronosDivergence(
  move: (state: ChronosGameplayState, dx: number, dy: number) => ChronosGameplayState,
  state: ChronosGameplayState,
  choice: ChronosDivergenceChoice,
): ChronosGameplayState {
  return move(state, choice.dx, choice.dy);
}

export function isConverging(current: ChronosPoint | undefined, echo: ChronosPoint | null, threshold: number): boolean {
  if (!current || !echo) return false;
  return Math.hypot(current.x - echo.x, current.y - echo.y) <= threshold;
}
