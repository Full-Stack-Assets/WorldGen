import { describe, expect, it } from 'vitest';
import { deriveSessionState, splitWorldlineState } from '../kernel/migrateState';
import type { WorldlineState } from '../types';

const world = {
  id: 'w1',
  name: 'World',
  kind: 'GENERATED',
  epistemicClass: 'GENERATED',
  fidelity: 'FIELD',
  provider: 'procedural-worldgen',
  description: 'fixture',
} as const;

function stateFixture(): WorldlineState {
  return {
    worlds: [structuredClone(world)],
    activeWorld: structuredClone(world),
    branches: {
      root: {
        id: 'root',
        label: 'Root',
        parentId: null,
        forkYear: 2026,
        seed: 1,
        snapshots: [],
        events: [],
      },
    },
    activeBranchId: 'root',
    selectedYear: 2030,
    timeMode: 'PARALLAX',
  };
}

describe('Worldline state migration boundary', () => {
  it('separates durable canonical state from UI/session selections', () => {
    const state = stateFixture();
    const split = splitWorldlineState(state);

    expect(split.canonical.schema).toBe('worldline-canonical-state-v1');
    expect(split.canonical.worlds).toEqual(state.worlds);
    expect(split.canonical.branches).toEqual(state.branches);
    expect(split.session).toEqual({
      activeWorldId: 'w1',
      activeBranchId: 'root',
      selectedYear: 2030,
      timeMode: 'PARALLAX',
    });
  });

  it('does not alias the legacy mutable state into the canonical projection', () => {
    const state = stateFixture();
    const split = splitWorldlineState(state);
    split.canonical.worlds[0].name = 'Changed';
    expect(state.worlds[0].name).toBe('World');
  });

  it('derives session state without creating canonical history', () => {
    expect(deriveSessionState(stateFixture())).toEqual({
      activeWorldId: 'w1',
      activeBranchId: 'root',
      selectedYear: 2030,
      timeMode: 'PARALLAX',
    });
  });
});
