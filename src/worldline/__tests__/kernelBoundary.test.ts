import { describe, expect, it } from 'vitest';
import * as kernel from '../kernel';
import * as legacyState from '../state';
import { createInitialWorldlineState, selectWorld, selectYear } from '../state';

describe('causal-kernel public boundary', () => {
  it('exports the causal-kernel primitives from one package boundary', () => {
    expect(typeof kernel.hashCanonical).toBe('function');
    expect(typeof kernel.admitTransition).toBe('function');
    expect(typeof kernel.createRenderEnvelope).toBe('function');
    expect(typeof kernel.createProducerIdentity).toBe('function');
    expect(typeof kernel.verifyTransitionReceipt).toBe('function');
  });

  it('removes the legacy unchecked snapshot commit API', () => {
    expect('commitSnapshot' in legacyState).toBe(false);
  });

  it('keeps view/session changes outside the canonical state hash', () => {
    const initial = createInitialWorldlineState();
    const initialHash = kernel.hashCanonical(kernel.splitWorldlineState(initial).canonical);
    const moved = selectYear(selectWorld(initial, 'mars'), 2035);
    expect(kernel.hashCanonical(kernel.splitWorldlineState(moved).canonical)).toBe(initialHash);
  });
});
