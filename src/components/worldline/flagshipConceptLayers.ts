import { FLAGSHIP_STAGES, createFlagshipConceptGeoJSON } from './flagshipSequence';
import type { MapLibreMap } from './maplibreRuntime';

const FINAL_STAGE_INDEX = FLAGSHIP_STAGES.length - 1;

const layerIds = {
  parcel: 'worldgen-flagship-parcel',
  buildings: 'worldgen-flagship-future-buildings',
  publicRealm: 'worldgen-flagship-public-realm',
  trees: 'worldgen-flagship-future-trees',
} as const;

function setPaint(
  map: MapLibreMap,
  layerId: string,
  property: string,
  value: unknown,
): void {
  if (!map.getLayer(layerId)) return;
  try {
    map.setPaintProperty?.(layerId, property, value);
  } catch {
    // Optional visual transitions must not interrupt camera travel.
  }
}

export function setFlagshipStageVisuals(
  map: MapLibreMap,
  stageIndex: number,
): void {
  const parcelVisible = stageIndex >= 7;
  const futureVisible = stageIndex >= FINAL_STAGE_INDEX;

  setPaint(map, layerIds.parcel, 'line-opacity', parcelVisible ? 0.92 : 0);
  setPaint(map, layerIds.parcel, 'line-width', parcelVisible ? 4 : 1);
  setPaint(
    map,
    layerIds.buildings,
    'fill-extrusion-opacity',
    futureVisible ? 0.86 : 0,
  );
  setPaint(map, layerIds.publicRealm, 'line-opacity', futureVisible ? 0.94 : 0);
  setPaint(map, layerIds.trees, 'circle-opacity', futureVisible ? 0.9 : 0);
  setPaint(
    map,
    layerIds.trees,
    'circle-stroke-opacity',
    futureVisible ? 0.72 : 0,
  );
}

export function addFlagshipConceptLayers(map: MapLibreMap): void {
  if (!map.getSource('worldgen-flagship-concept')) {
    map.addSource('worldgen-flagship-concept', {
      type: 'geojson',
      data: createFlagshipConceptGeoJSON(),
    });
  }

  if (!map.getLayer(layerIds.parcel)) {
    map.addLayer({
      id: layerIds.parcel,
      type: 'line',
      source: 'worldgen-flagship-concept',
      filter: ['==', ['get', 'kind'], 'parcel'],
      paint: {
        'line-color': '#b8f2ff',
        'line-width': 1,
        'line-opacity': 0,
        'line-blur': 1.2,
      },
    });
  }

  if (!map.getLayer(layerIds.buildings)) {
    map.addLayer({
      id: layerIds.buildings,
      type: 'fill-extrusion',
      source: 'worldgen-flagship-concept',
      filter: ['==', ['get', 'kind'], 'future-building'],
      minzoom: 13,
      paint: {
        'fill-extrusion-color': [
          'interpolate',
          ['linear'],
          ['get', 'height'],
          18,
          '#77c9c1',
          24,
          '#8adbe8',
          32,
          '#d9f7ff',
        ],
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['coalesce', ['get', 'base'], 0],
        'fill-extrusion-opacity': 0,
        'fill-extrusion-vertical-gradient': true,
      },
    });
  }

  if (!map.getLayer(layerIds.publicRealm)) {
    map.addLayer({
      id: layerIds.publicRealm,
      type: 'line',
      source: 'worldgen-flagship-concept',
      filter: ['==', ['get', 'kind'], 'public-realm'],
      paint: {
        'line-color': '#c9f9ff',
        'line-width': 7,
        'line-blur': 4,
        'line-opacity': 0,
      },
    });
  }

  if (!map.getLayer(layerIds.trees)) {
    map.addLayer({
      id: layerIds.trees,
      type: 'circle',
      source: 'worldgen-flagship-concept',
      filter: ['==', ['get', 'kind'], 'future-tree'],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 2, 18, 8],
        'circle-color': '#5ed69a',
        'circle-stroke-color': '#d8fff0',
        'circle-stroke-width': 1.5,
        'circle-opacity': 0,
        'circle-stroke-opacity': 0,
        'circle-blur': 0.18,
      },
    });
  }

  setFlagshipStageVisuals(map, 0);
}
