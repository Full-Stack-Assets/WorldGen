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

export interface ApplyForgeSceneInput {
  variantId: ForgeVariantId;
  transformation: number;
  ghostOpacity: number;
  ghostVisible: boolean;
  visible: boolean;
  selected: boolean;
}

function setPaint(
  map: MapLibreMap,
  layerId: string,
  property: string,
  value: unknown,
): void {
  if (!map.getLayer(layerId)) return;
  map.setPaintProperty?.(layerId, property, value);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

export function addForgeLayers(map: MapLibreMap): void {
  if (!map.getSource(FORGE_SOURCE_ID)) {
    map.addSource(FORGE_SOURCE_ID, {
      type: 'geojson',
      data: createForgeGeometry('lumen-quay', 0),
    });
  }

  const layers: unknown[] = [
    {
      id: FORGE_LAYER_IDS[0],
      type: 'fill',
      source: FORGE_SOURCE_ID,
      filter: ['==', ['get', 'kind'], 'forge-surface'],
      paint: {
        'fill-color': ['coalesce', ['get', 'surfaceColor'], '#111D36'],
        'fill-opacity': 0,
      },
    },
    {
      id: FORGE_LAYER_IDS[1],
      type: 'line',
      source: FORGE_SOURCE_ID,
      filter: ['==', ['get', 'kind'], 'forge-parcel'],
      paint: {
        'line-color': ['coalesce', ['get', 'accentColor'], '#9B7CFF'],
        'line-width': 2,
        'line-opacity': 0,
        'line-blur': 0.8,
      },
    },
    {
      id: FORGE_LAYER_IDS[2],
      type: 'fill-extrusion',
      source: FORGE_SOURCE_ID,
      filter: ['==', ['get', 'kind'], 'forge-building'],
      minzoom: 13,
      paint: {
        'fill-extrusion-color': ['coalesce', ['get', 'structureColor'], '#9BB6D8'],
        'fill-extrusion-height': ['coalesce', ['get', 'height'], 0],
        'fill-extrusion-base': ['coalesce', ['get', 'base'], 0],
        'fill-extrusion-opacity': 0,
        'fill-extrusion-vertical-gradient': true,
      },
    },
    {
      id: FORGE_LAYER_IDS[3],
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
        'circle-radius': ['coalesce', ['get', 'radius'], 4],
        'circle-color': ['coalesce', ['get', 'vegetationColor'], '#5FE3B1'],
        'circle-stroke-color': '#E9FFF8',
        'circle-stroke-width': 1.1,
        'circle-opacity': 0,
        'circle-stroke-opacity': 0,
        'circle-blur': 0.15,
      },
    },
    {
      id: FORGE_LAYER_IDS[5],
      type: 'circle',
      source: FORGE_SOURCE_ID,
      filter: ['==', ['get', 'kind'], 'forge-harbor-glow'],
      paint: {
        'circle-radius': ['coalesce', ['get', 'radius'], 10],
        'circle-color': ['coalesce', ['get', 'glowColor'], '#63DFFF'],
        'circle-opacity': 0,
        'circle-blur': 0.72,
      },
    },
  ];

  for (const layer of layers) {
    const id = (layer as { id: string }).id;
    if (!map.getLayer(id)) map.addLayer(layer);
  }
}

export function setForgeVisibility(map: MapLibreMap, visible: boolean): void {
  setPaint(map, FORGE_LAYER_IDS[0], 'fill-opacity', visible ? 0.16 : 0);
  setPaint(map, FORGE_LAYER_IDS[1], 'line-opacity', visible ? 0.86 : 0);
  setPaint(map, FORGE_LAYER_IDS[2], 'fill-extrusion-opacity', visible ? 0.72 : 0);
  setPaint(map, FORGE_LAYER_IDS[3], 'line-opacity', visible ? 0.78 : 0);
  setPaint(map, FORGE_LAYER_IDS[4], 'circle-opacity', visible ? 0.84 : 0);
  setPaint(map, FORGE_LAYER_IDS[4], 'circle-stroke-opacity', visible ? 0.64 : 0);
  setPaint(map, FORGE_LAYER_IDS[5], 'circle-opacity', visible ? 0.78 : 0);
}

export function setForgeSelection(map: MapLibreMap, selected: boolean): void {
  setPaint(map, FORGE_LAYER_IDS[1], 'line-width', selected ? 5 : 2);
  setPaint(map, FORGE_LAYER_IDS[1], 'line-blur', selected ? 1.8 : 0.8);
}

export function applyForgeScene(
  map: MapLibreMap,
  input: ApplyForgeSceneInput,
): void {
  addForgeLayers(map);
  const transformation = clamp01(input.transformation);
  const ghost = input.ghostVisible ? clamp01(input.ghostOpacity) : 1;
  const variant = forgeVariant(input.variantId);
  const source = map.getSource(FORGE_SOURCE_ID) as GeoJSONSourceLike | undefined;
  source?.setData(createForgeGeometry(input.variantId, transformation));

  setPaint(map, FORGE_LAYER_IDS[0], 'fill-color', variant.palette.surface);
  setPaint(map, FORGE_LAYER_IDS[1], 'line-color', variant.palette.accent);
  setPaint(map, FORGE_LAYER_IDS[2], 'fill-extrusion-color', variant.palette.structure);
  setPaint(map, FORGE_LAYER_IDS[3], 'line-color', variant.palette.accent);
  setPaint(map, FORGE_LAYER_IDS[4], 'circle-color', variant.palette.vegetation);
  setPaint(map, FORGE_LAYER_IDS[5], 'circle-color', variant.palette.glow);

  const visible = input.visible;
  setForgeSelection(map, input.selected);
  setPaint(
    map,
    FORGE_LAYER_IDS[0],
    'fill-opacity',
    visible ? (input.selected ? 0.22 : 0.12) * ghost : 0,
  );
  setPaint(
    map,
    FORGE_LAYER_IDS[1],
    'line-opacity',
    visible ? (input.selected ? 1 : 0.76) : 0,
  );
  setPaint(
    map,
    FORGE_LAYER_IDS[2],
    'fill-extrusion-opacity',
    visible && transformation > 0 ? (0.48 + transformation * 0.42) * ghost : 0,
  );
  setPaint(
    map,
    FORGE_LAYER_IDS[3],
    'line-opacity',
    visible && transformation > 0 ? (0.45 + transformation * 0.45) * ghost : 0,
  );
  setPaint(
    map,
    FORGE_LAYER_IDS[4],
    'circle-opacity',
    visible && transformation > 0 ? (0.4 + transformation * 0.48) * ghost : 0,
  );
  setPaint(
    map,
    FORGE_LAYER_IDS[4],
    'circle-stroke-opacity',
    visible && transformation > 0 ? 0.62 * ghost : 0,
  );
  setPaint(
    map,
    FORGE_LAYER_IDS[5],
    'circle-opacity',
    visible && transformation > 0 ? variant.glow * transformation * ghost : 0,
  );
}
