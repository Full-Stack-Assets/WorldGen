import { createForgeGeometry } from './forgeGeometry';
import { forgeVariant, type ForgeVariantId } from './forgeModel';
import type { MapLibreMap } from './maplibreRuntime';

export const FORGE_SOURCE_ID = 'worldgen-forge-scene';

export const FORGE_LAYER_IDS = [
  'worldgen-forge-parcel-surface',
  'worldgen-forge-parcel-line',
  'worldgen-forge-buildings',
  'worldgen-forge-public-realm',
  'worldgen-forge-vegetation',
  'worldgen-forge-harbor-glow',
] as const;

export type ForgeLayerId = (typeof FORGE_LAYER_IDS)[number];

export interface ForgeScenePaintInput {
  variantId: ForgeVariantId;
  transformation: number;
  ghostOpacity: number;
  ghostVisible: boolean;
  visible: boolean;
  selected: boolean;
}

function paint(map: MapLibreMap, layerId: string, property: string, value: unknown): void {
  map.setPaintProperty?.(layerId, property, value);
}

function emptyCollection() {
  return { type: 'FeatureCollection', features: [] as unknown[] };
}

export function addForgeLayers(map: MapLibreMap): void {
  if (!map.getSource(FORGE_SOURCE_ID)) {
    map.addSource(FORGE_SOURCE_ID, {
      type: 'geojson',
      data: emptyCollection(),
    });
  }

  if (!map.getLayer('worldgen-forge-parcel-surface')) {
    map.addLayer({
      id: 'worldgen-forge-parcel-surface',
      type: 'fill',
      source: FORGE_SOURCE_ID,
      filter: ['==', ['get', 'kind'], 'forge-surface'],
      paint: {
        'fill-color': '#63DFFF',
        'fill-opacity': 0.18,
      },
    });
  }

  if (!map.getLayer('worldgen-forge-parcel-line')) {
    map.addLayer({
      id: 'worldgen-forge-parcel-line',
      type: 'line',
      source: FORGE_SOURCE_ID,
      filter: ['==', ['get', 'kind'], 'forge-parcel'],
      paint: {
        'line-color': '#63DFFF',
        'line-width': 2.5,
        'line-opacity': 0.9,
      },
    });
  }

  if (!map.getLayer('worldgen-forge-buildings')) {
    map.addLayer({
      id: 'worldgen-forge-buildings',
      type: 'fill-extrusion',
      source: FORGE_SOURCE_ID,
      filter: ['==', ['get', 'kind'], 'forge-building'],
      paint: {
        'fill-extrusion-color': '#9BB6D8',
        'fill-extrusion-height': ['coalesce', ['get', 'height'], 0],
        'fill-extrusion-base': ['coalesce', ['get', 'base'], 0],
        'fill-extrusion-opacity': 0.72,
      },
    });
  }

  if (!map.getLayer('worldgen-forge-public-realm')) {
    map.addLayer({
      id: 'worldgen-forge-public-realm',
      type: 'line',
      source: FORGE_SOURCE_ID,
      filter: ['==', ['get', 'kind'], 'forge-public-realm'],
      paint: {
        'line-color': '#F0C979',
        'line-width': 3,
        'line-opacity': 0.8,
      },
    });
  }

  if (!map.getLayer('worldgen-forge-vegetation')) {
    map.addLayer({
      id: 'worldgen-forge-vegetation',
      type: 'circle',
      source: FORGE_SOURCE_ID,
      filter: ['==', ['get', 'kind'], 'forge-vegetation'],
      paint: {
        'circle-color': '#5FE3B1',
        'circle-radius': ['coalesce', ['get', 'radius'], 4],
        'circle-opacity': 0.85,
      },
    });
  }

  if (!map.getLayer('worldgen-forge-harbor-glow')) {
    map.addLayer({
      id: 'worldgen-forge-harbor-glow',
      type: 'circle',
      source: FORGE_SOURCE_ID,
      filter: ['==', ['get', 'kind'], 'forge-harbor-glow'],
      paint: {
        'circle-color': '#63DFFF',
        'circle-radius': 10,
        'circle-opacity': 0.35,
        'circle-blur': 0.6,
      },
    });
  }
}

export function applyForgeScene(map: MapLibreMap, input: ForgeScenePaintInput): void {
  addForgeLayers(map);
  const source = map.getSource(FORGE_SOURCE_ID) as { setData?: (data: unknown) => void } | undefined;
  const geometry = createForgeGeometry(input.variantId, input.transformation);
  source?.setData?.(geometry);

  const variant = forgeVariant(input.variantId);
  const visible = input.visible;
  const transformed = Math.max(0, Math.min(1, input.transformation));
  const ghostFactor = input.ghostVisible ? input.ghostOpacity : 1;
  const buildingOpacity = visible && transformed > 0 ? 0.55 + ghostFactor * 0.35 : 0;
  const lineOpacity = visible && transformed > 0 ? 0.55 + ghostFactor * 0.3 : 0;
  const vegetationOpacity = visible && transformed > 0 ? 0.7 * ghostFactor : 0;
  const glowOpacity = visible ? 0.2 + variant.glow * 0.25 * transformed : 0;

  paint(map, 'worldgen-forge-buildings', 'fill-extrusion-color', variant.palette.structure);
  paint(map, 'worldgen-forge-buildings', 'fill-extrusion-opacity', buildingOpacity);
  paint(map, 'worldgen-forge-public-realm', 'line-color', variant.palette.accent);
  paint(map, 'worldgen-forge-public-realm', 'line-opacity', lineOpacity);
  paint(map, 'worldgen-forge-vegetation', 'circle-color', variant.palette.vegetation);
  paint(map, 'worldgen-forge-vegetation', 'circle-opacity', vegetationOpacity);
  paint(map, 'worldgen-forge-harbor-glow', 'circle-color', variant.palette.glow);
  paint(map, 'worldgen-forge-harbor-glow', 'circle-opacity', glowOpacity);
  paint(map, 'worldgen-forge-parcel-surface', 'fill-color', variant.palette.surface);
  paint(map, 'worldgen-forge-parcel-surface', 'fill-opacity', visible ? 0.16 : 0);
  paint(map, 'worldgen-forge-parcel-line', 'line-color', variant.palette.accent);
  paint(map, 'worldgen-forge-parcel-line', 'line-opacity', visible ? 0.95 : 0);
  paint(map, 'worldgen-forge-parcel-line', 'line-width', input.selected ? 5 : 2.5);
}

export function setForgeVisibility(map: MapLibreMap, visible: boolean): void {
  addForgeLayers(map);
  paint(map, 'worldgen-forge-parcel-surface', 'fill-opacity', visible ? 0.16 : 0);
  paint(map, 'worldgen-forge-parcel-line', 'line-opacity', visible ? 0.95 : 0);
  paint(map, 'worldgen-forge-buildings', 'fill-extrusion-opacity', visible ? 0.72 : 0);
  paint(map, 'worldgen-forge-public-realm', 'line-opacity', visible ? 0.8 : 0);
  paint(map, 'worldgen-forge-vegetation', 'circle-opacity', visible ? 0.85 : 0);
  paint(map, 'worldgen-forge-harbor-glow', 'circle-opacity', visible ? 0.35 : 0);
}

export function setForgeSelection(map: MapLibreMap, selected: boolean): void {
  addForgeLayers(map);
  paint(map, 'worldgen-forge-parcel-line', 'line-width', selected ? 5 : 2.5);
}
