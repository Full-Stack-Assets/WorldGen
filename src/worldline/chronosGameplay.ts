export interface ChronosPoint {
  x: number;
  y: number;
  t: number;
}

export interface ChronosAnchor {
  id: string;
  sampleIndex: number;
}

export interface ChronosEcho {
  id: string;
  samples: ChronosPoint[];
}

export interface ChronosGameplayState {
  position: { x: number; y: number };
  samples: ChronosPoint[];
  anchor: ChronosAnchor | null;
  echo: ChronosEcho | null;
  convergenceCount: number;
}

const INITIAL_X = 50;
const INITIAL_Y = 50;
const MIN_COORDINATE = 4;
const MAX_COORDINATE = 96;

function clampCoordinate(value: number): number {
  return Math.max(MIN_COORDINATE, Math.min(MAX_COORDINATE, value));
}

export function createChronosGameplayState(): ChronosGameplayState {
  return {
    position: { x: INITIAL_X, y: INITIAL_Y },
    samples: [{ x: INITIAL_X, y: INITIAL_Y, t: 0 }],
    anchor: null,
    echo: null,
    convergenceCount: 0,
  };
}

export function moveChronos(state: ChronosGameplayState, dx: number, dy: number): ChronosGameplayState {
  const nextPosition = {
    x: clampCoordinate(state.position.x + dx),
    y: clampCoordinate(state.position.y + dy),
  };
  const nextTime = (state.samples.at(-1)?.t ?? -1) + 1;
  return {
    ...state,
    position: nextPosition,
    samples: [...state.samples.map((sample) => ({ ...sample })), { ...nextPosition, t: nextTime }],
    anchor: state.anchor ? { ...state.anchor } : null,
    echo: state.echo ? { ...state.echo, samples: state.echo.samples.map((sample) => ({ ...sample })) } : null,
  };
}

export function anchorChronos(state: ChronosGameplayState): ChronosGameplayState {
  const sampleIndex = Math.max(0, state.samples.length - 1);
  return {
    ...state,
    samples: state.samples.map((sample) => ({ ...sample })),
    anchor: { id: `anchor-${sampleIndex}`, sampleIndex },
    echo: null,
  };
}

export function createChronosEcho(state: ChronosGameplayState): ChronosGameplayState {
  if (!state.anchor) return { ...state, samples: state.samples.map((sample) => ({ ...sample })) };
  const samples = state.samples.slice(state.anchor.sampleIndex + 1).map((sample) => ({ ...sample }));
  return {
    ...state,
    samples: state.samples.map((sample) => ({ ...sample })),
    anchor: { ...state.anchor },
    echo: {
      id: `echo-${state.anchor.sampleIndex}-${samples.length}`,
      samples,
    },
  };
}

export function echoPointAt(echo: ChronosEcho, index: number): ChronosPoint | null {
  const point = echo.samples[index];
  return point ? { ...point } : null;
}

export function detectChronosConvergence(current: ChronosPoint, echoPoint: ChronosPoint, threshold: number): boolean {
  const dx = current.x - echoPoint.x;
  const dy = current.y - echoPoint.y;
  return Math.hypot(dx, dy) <= threshold;
}

export function countChronosConvergence(state: ChronosGameplayState): ChronosGameplayState {
  return { ...state, convergenceCount: state.convergenceCount + 1 };
}

export function resetChronos(_state?: ChronosGameplayState): ChronosGameplayState {
  return createChronosGameplayState();
}
