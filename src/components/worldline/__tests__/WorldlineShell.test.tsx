import { describe, expect, it } from 'vitest';
import { NAV_ITEMS } from '../WorldlineShell';
import { createInitialWorldlineState } from '../../../worldline/state';

describe('Worldline shell', () => {
  it('exposes the six canonical primary surfaces', () => {
    expect(NAV_ITEMS).toEqual(['WORLD', 'TIME', 'FUTURES', 'COMPARE', 'DATA', 'LIBRARY']);
  });

  it('starts with explicit generated and field labels', () => {
    const state = createInitialWorldlineState();
    expect(state.activeWorld.epistemicClass).toBe('GENERATED');
    expect(state.activeWorld.fidelity).toBe('FIELD');
  });
});
