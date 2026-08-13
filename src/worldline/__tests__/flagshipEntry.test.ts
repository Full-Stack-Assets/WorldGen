import { describe, expect, it } from 'vitest';
import { createFlagshipWorldlineState } from '../state';

describe('WorldGen entry state', () => {
  it('opens on New Bedford so the cinematic sequence is mounted immediately', () => {
    const state = createFlagshipWorldlineState();
    expect(state.activeWorld.id).toBe('new-bedford-001');
    expect(state.activeWorld.kind).toBe('EARTH');
  });
});
