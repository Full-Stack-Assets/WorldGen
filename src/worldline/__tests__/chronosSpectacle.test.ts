import { describe, expect, it } from 'vitest';
import {
  anchorChronos,
  createChronosEcho,
  createChronosGameplayState,
  moveChronos,
} from '../chronosGameplay';
import {
  applyChronosDivergence,
  chronosDivergenceChoices,
  chronosDynamicRange,
} from '../chronosSpectacle';

describe('Chronos spectacle', () => {
  it('maps gameplay intensity along QUIET → TENSION → ACTION without claiming physics', () => {
    expect(chronosDynamicRange(createChronosGameplayState())).toBe('QUIET');
    const anchored = anchorChronos(moveChronos(createChronosGameplayState(), 8, 0));
    expect(chronosDynamicRange(anchored)).toBe('TENSION');
    const echoed = createChronosEcho(moveChronos(anchored, 0, 8));
    expect(chronosDynamicRange(echoed)).toBe('ACTION');
    expect(chronosDynamicRange(echoed, true)).toBe('CONVERGENCE');
  });

  it('exposes a small number of readable divergence choices', () => {
    const state = moveChronos(createChronosGameplayState(), 8, 0);
    const choices = chronosDivergenceChoices(state);
    expect(choices).toHaveLength(3);
    const next = applyChronosDivergence(moveChronos, state, choices[0]);
    expect(next.samples.length).toBe(state.samples.length + 1);
    expect(next.position).not.toEqual(state.position);
  });
});
