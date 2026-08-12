import { describe, expect, it } from 'vitest';
import {
  anchorChronos,
  createChronosEcho,
  createChronosGameplayState,
  detectChronosConvergence,
  echoPointAt,
  moveChronos,
  resetChronos,
} from '../chronosGameplay';

describe('Chronos gameplay kernel', () => {
  it('records immutable movement samples', () => {
    const initial = createChronosGameplayState();
    const before = JSON.stringify(initial);
    const moved = moveChronos(initial, 8, -4);
    expect(JSON.stringify(initial)).toBe(before);
    expect(moved.position).toEqual({ x: 58, y: 46 });
    expect(moved.samples.at(-1)).toEqual({ x: 58, y: 46, t: 1 });
  });

  it('anchors the exact current sample boundary', () => {
    const moved = moveChronos(createChronosGameplayState(), 5, 0);
    const anchored = anchorChronos(moved);
    expect(anchored.anchor?.sampleIndex).toBe(moved.samples.length - 1);
  });

  it('replays the exact post-anchor segment as an Echo', () => {
    const anchored = anchorChronos(moveChronos(createChronosGameplayState(), 5, 0));
    const recorded = moveChronos(moveChronos(anchored, 0, 10), 10, 0);
    const withEcho = createChronosEcho(recorded);
    expect(withEcho.echo?.samples).toEqual(recorded.samples.slice((anchored.anchor?.sampleIndex ?? 0) + 1));
    expect(echoPointAt(withEcho.echo!, 1)).toEqual(withEcho.echo?.samples[1]);
  });

  it('detects convergence deterministically using the fixed distance threshold', () => {
    expect(detectChronosConvergence({ x: 10, y: 10, t: 3 }, { x: 12, y: 12, t: 1 }, 3)).toBe(true);
    expect(detectChronosConvergence({ x: 10, y: 10, t: 3 }, { x: 20, y: 20, t: 1 }, 3)).toBe(false);
  });

  it('resets to the same fixed initial state', () => {
    const altered = createChronosEcho(moveChronos(anchorChronos(moveChronos(createChronosGameplayState(), 7, 4)), 3, 2));
    expect(resetChronos(altered)).toEqual(createChronosGameplayState());
  });
});