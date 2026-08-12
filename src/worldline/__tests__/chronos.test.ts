import { describe, expect, it } from 'vitest';
import { createChronosExport, serializeChronosExport } from '../chronos';
import { createInitialWorldlineState, selectWorld } from '../state';

describe('Chronos export v0.7', () => {
  it('is deterministic and provider-independent', () => {
    const state = createInitialWorldlineState();
    const first = serializeChronosExport(createChronosExport(state));
    const second = serializeChronosExport(createChronosExport(state));
    expect(first).toBe(second);
    expect(first.toLowerCase()).not.toContain('openfreemap');
    expect(first.toLowerCase()).not.toContain('google-photorealistic');
  });

  it('uses the v0.7 schema and preserves surface-rendering semantics', () => {
    const mars = selectWorld(createInitialWorldlineState(), 'mars');
    const bundle = createChronosExport(mars);
    expect(bundle.schema).toBe('worldline-chronos-v0.7');
    expect(bundle.world.epistemicClass).toBe('OBSERVED');
    expect(bundle.world.surfaceEpistemicClass).toBe('GENERATED');
    expect(bundle.world.surfaceRenderingClass).toBe('GENERATED');
    expect(bundle.world.referenceFrame).toMatch(/mars/i);
    expect(bundle.world.terrainSourceStatus).toBeTruthy();
  });
});
