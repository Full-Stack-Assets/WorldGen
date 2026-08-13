import { describe, expect, it } from 'vitest';
import {
  FORGE_LAYER_IDS,
  addForgeLayers,
  applyForgeScene,
  setForgeSelection,
  setForgeVisibility,
} from '../forgeMapLayers';
import type { MapLibreMap } from '../maplibreRuntime';

class FakeMap {
  readonly sources = new Map<string, { data: unknown; setData: (data: unknown) => void }>();
  readonly layers = new Map<string, unknown>();
  readonly paintCalls: Array<[string, string, unknown]> = [];

  getSource(id: string) { return this.sources.get(id); }
  addSource(id: string, source: unknown) {
    const initial = source as { data: unknown };
    this.sources.set(id, {
      data: initial.data,
      setData: (data: unknown) => {
        const current = this.sources.get(id);
        if (current) current.data = data;
      },
    });
  }
  getLayer(id: string) { return this.layers.get(id); }
  addLayer(layer: unknown) {
    const value = layer as { id: string };
    this.layers.set(value.id, layer);
  }
  setPaintProperty(layerId: string, property: string, value: unknown) {
    this.paintCalls.push([layerId, property, value]);
  }
}

function asMap(fake: FakeMap): MapLibreMap {
  return fake as unknown as MapLibreMap;
}

describe('FORGE MapLibre layers', () => {
  it('adds one source and six stable layers exactly once', () => {
    const fake = new FakeMap();
    addForgeLayers(asMap(fake));
    addForgeLayers(asMap(fake));
    expect(fake.sources.size).toBe(1);
    expect([...fake.layers.keys()]).toEqual([...FORGE_LAYER_IDS]);
  });

  it('updates the shared source and selected variant palette', () => {
    const fake = new FakeMap();
    addForgeLayers(asMap(fake));
    applyForgeScene(asMap(fake), {
      variantId: 'tidal-works', transformation: 1, ghostOpacity: 0.46,
      ghostVisible: true, visible: true, selected: true,
    });
    expect(JSON.stringify(fake.sources.get('worldgen-forge-scene')?.data)).toContain('tidal-works');
    expect(fake.paintCalls).toContainEqual([
      'worldgen-forge-buildings', 'fill-extrusion-color', '#6D8290',
    ]);
  });

  it('hides transformed layers at zero transformation', () => {
    const fake = new FakeMap();
    addForgeLayers(asMap(fake));
    applyForgeScene(asMap(fake), {
      variantId: 'harbor-commons', transformation: 0, ghostOpacity: 0.46,
      ghostVisible: true, visible: true, selected: false,
    });
    expect(fake.paintCalls).toContainEqual([
      'worldgen-forge-buildings', 'fill-extrusion-opacity', 0,
    ]);
    expect(fake.paintCalls).toContainEqual([
      'worldgen-forge-public-realm', 'line-opacity', 0,
    ]);
    expect(fake.paintCalls).toContainEqual([
      'worldgen-forge-vegetation', 'circle-opacity', 0,
    ]);
  });

  it('changes visibility and selection without recreating layers', () => {
    const fake = new FakeMap();
    addForgeLayers(asMap(fake));
    setForgeVisibility(asMap(fake), false);
    setForgeSelection(asMap(fake), true);
    expect(fake.paintCalls).toContainEqual([
      'worldgen-forge-parcel-surface', 'fill-opacity', 0,
    ]);
    expect(fake.paintCalls).toContainEqual([
      'worldgen-forge-parcel-line', 'line-width', 5,
    ]);
  });

  it('keeps parcel overlays hidden after FORGE closes', () => {
    const fake = new FakeMap();
    addForgeLayers(asMap(fake));
    applyForgeScene(asMap(fake), {
      variantId: 'lumen-quay', transformation: 1, ghostOpacity: 0.46,
      ghostVisible: true, visible: false, selected: false,
    });

    const surfaceOpacity = fake.paintCalls
      .filter(([layer, property]) =>
        layer === 'worldgen-forge-parcel-surface' && property === 'fill-opacity')
      .at(-1);
    const lineOpacity = fake.paintCalls
      .filter(([layer, property]) =>
        layer === 'worldgen-forge-parcel-line' && property === 'line-opacity')
      .at(-1);

    expect(surfaceOpacity).toEqual([
      'worldgen-forge-parcel-surface', 'fill-opacity', 0,
    ]);
    expect(lineOpacity).toEqual([
      'worldgen-forge-parcel-line', 'line-opacity', 0,
    ]);
  });
});
