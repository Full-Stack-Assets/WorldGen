import type { MapLibreMap } from './maplibreRuntime';

function firstSymbolLayer(map: MapLibreMap): string | undefined {
  return map.getStyle?.().layers?.find((layer) => layer.type === 'symbol')?.id;
}

function addSatelliteImagery(map: MapLibreMap): void {
  if (map.getSource('worldgen-satellite')) return;

  map.addSource('worldgen-satellite', {
    type: 'raster',
    tiles: [
      'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg',
    ],
    tileSize: 256,
    maxzoom: 13,
    attribution: 'Sentinel-2 cloudless imagery by EOX; contains modified Copernicus Sentinel data',
  });
  map.addLayer(
    {
      id: 'worldgen-satellite-imagery',
      type: 'raster',
      source: 'worldgen-satellite',
      paint: {
        'raster-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0,
          1,
          10,
          0.94,
          13,
          0.56,
          15,
          0,
        ],
        'raster-saturation': 0.12,
        'raster-contrast': 0.08,
        'raster-fade-duration': 900,
      },
    },
    firstSymbolLayer(map),
  );
}

function addCityBuildings(map: MapLibreMap): void {
  if (!map.getSource('openmaptiles') || map.getLayer('worldline-buildings')) return;

  map.addLayer(
    {
      id: 'worldline-buildings',
      type: 'fill-extrusion',
      source: 'openmaptiles',
      'source-layer': 'building',
      minzoom: 13,
      paint: {
        'fill-extrusion-color': [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'render_height'], ['get', 'height'], 10],
          0,
          '#708092',
          24,
          '#9caabb',
          80,
          '#e2e8f0',
        ],
        'fill-extrusion-height': [
          'coalesce',
          ['get', 'render_height'],
          ['get', 'height'],
          ['*', ['coalesce', ['get', 'building:levels'], 3], 3],
          10,
        ],
        'fill-extrusion-base': [
          'coalesce',
          ['get', 'render_min_height'],
          ['get', 'min_height'],
          0,
        ],
        'fill-extrusion-opacity': 0.9,
        'fill-extrusion-vertical-gradient': true,
      },
    },
    firstSymbolLayer(map),
  );
}

function addCoverage(map: MapLibreMap, coverageUrl: string): void {
  if (!map.getSource('new-bedford-coverage')) {
    map.addSource('new-bedford-coverage', {
      type: 'geojson',
      data: coverageUrl,
    });
  }
  if (!map.getLayer('new-bedford-coverage-line')) {
    map.addLayer({
      id: 'new-bedford-coverage-line',
      type: 'line',
      source: 'new-bedford-coverage',
      paint: {
        'line-color': '#9fe8ff',
        'line-width': 2,
        'line-opacity': 0.46,
        'line-blur': 0.6,
      },
    });
  }
}

export function configureFlagshipBaseLayers(
  map: MapLibreMap,
  coverageUrl: string,
): void {
  map.setFog?.({
    range: [0.45, 12],
    color: '#8db6d2',
    'high-color': '#234f75',
    'space-color': '#01030a',
    'horizon-blend': 0.16,
    'star-intensity': 0.32,
  });
  addSatelliteImagery(map);
  addCityBuildings(map);
  addCoverage(map, coverageUrl);
}
