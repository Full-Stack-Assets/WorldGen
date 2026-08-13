import { describe, expect, it } from 'vitest';
import { DEFAULT_FORGE_PROMPT, FORGE_VARIANTS, createInitialForgeState, matchForgePrompt, serializeForgeScenePackage } from '../forgeModel';

describe('WorldGen FORGE model', () => {
  it('starts closed with the locked v5 defaults', () => {
    const state = createInitialForgeState();
    expect(state.mode).toBe('closed');
    expect(state.variantId).toBe('lumen-quay');
    expect(state.transformation).toBe(0.68);
    expect(state.ghostOpacity).toBe(0.46);
    expect(state.prompt).toBe(DEFAULT_FORGE_PROMPT);
  });

  it('exposes three materially distinct directions', () => {
    expect(FORGE_VARIANTS.map((variant) => variant.id)).toEqual(['harbor-commons', 'tidal-works', 'lumen-quay']);
    expect(new Set(FORGE_VARIANTS.map((variant) => variant.palette.accent)).size).toBe(3);
    expect(new Set(FORGE_VARIANTS.map((variant) => variant.maxHeight)).size).toBe(3);
  });

  it('matches visual language to a deterministic direction', () => {
    expect(matchForgePrompt('historic timber terraces and green roofs')).toBe('harbor-commons');
    expect(matchForgePrompt('industrial steel ferry piers and cyan lighting')).toBe('tidal-works');
    expect(matchForgePrompt('bioluminescent elevated gardens at blue hour')).toBe('lumen-quay');
  });

  it('serializes an explicitly conceptual scene package', () => {
    const json = serializeForgeScenePackage({ ...createInitialForgeState(), mode: 'editing' }, { center: [-70.9217, 41.6349], zoom: 17.4, pitch: 72, bearing: -40 });
    const scene = JSON.parse(json);
    expect(scene.product).toBe('WorldGen FORGE');
    expect(scene.version).toBe('5.0.0');
    expect(scene.classification).toBe('VISUAL_CONCEPT');
    expect(scene.location.id).toBe('new-bedford-waterfront');
  });
});
