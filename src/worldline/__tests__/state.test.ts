import { describe, expect, it } from 'vitest';
import { createBranch, createInitialWorldlineState, replayBranch, selectWorld } from '../state';

describe('Worldline state', () => {
  it('starts on the procedural generated world with explicit epistemic and fidelity labels', () => {
    const state = createInitialWorldlineState();
    expect(state.activeWorld.epistemicClass).toBe('GENERATED');
    expect(state.activeWorld.fidelity).toBe('FIELD');
  });

  it('replays a deterministic branch to identical committed state', () => {
    const state = createInitialWorldlineState();
    const branched = createBranch(state, { label: 'reinvention', atYear: 2030 });
    expect(replayBranch(branched, branched.activeBranchId)).toEqual(replayBranch(branched, branched.activeBranchId));
  });

  it('never mutates a parent branch when creating a child', () => {
    const state = createInitialWorldlineState();
    const before = JSON.stringify(state.branches[state.activeBranchId]);
    createBranch(state, { label: 'alternate', atYear: 2032 });
    expect(JSON.stringify(state.branches[state.activeBranchId])).toBe(before);
  });

  it('keeps observed and speculative cosmos worlds semantically distinct', () => {
    const state = createInitialWorldlineState();
    const mars = selectWorld(state, 'mars');
    const exoworld = selectWorld(state, 'exoworld-a');
    expect(mars.activeWorld.epistemicClass).toBe('OBSERVED');
    expect(exoworld.activeWorld.epistemicClass).toBe('SPECULATIVE');
    expect(exoworld.activeWorld.epistemicClass).not.toBe('OBSERVED');
  });
});
