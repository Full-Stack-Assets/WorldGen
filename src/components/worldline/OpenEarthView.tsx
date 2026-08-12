import { useEffect, useRef } from 'react';
import type { TimeMode } from '../../worldline/types';

type MapLibreMap = {
  on: (event: string, callback: (event?: unknown) => void) => void;
  remove: () => void;
  getSource: (id: string) => unknown;
  addSource: (id: string, source: unknown) => void;
  getLayer: (id: string) => unknown;
  addLayer: (layer: unknown) => void;
};

type MapLibreNamespace = {
  Map: new (options: Record<string, unknown>) => MapLibreMap;
};

declare global {
  interface Window { maplibregl?: MapLibreNamespace; }
}

const SCRIPT_ID = 'worldline-maplibre-script';
const STYLE_ID = 'worldline-maplibre-style';
const MAPLIBRE_VERSION = '5.7.1';

function ensureMapLibre(): Promise<MapLibreNamespace> {
  if (window.maplibregl) return Promise.resolve(window.maplibregl);
  return new Promise((resolve, reject) => {
    if (!document.getElementById(STYLE_ID)) {
      const link = document.createElement('link');
      link.id = STYLE_ID;
      link.rel = 'stylesheet';
      link.href = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.css`;
      document.head.appendChild(link);
    }
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const finish = () => window.maplibregl ? resolve(window.maplibregl) : reject(new Error('MapLibre global missing after load'));
    if (existing) {
      if (window.maplibregl) finish();
      else {
        existing.addEventListener('load', finish, { once: true });
        existing.addEventListener('error', () => reject(new Error('MapLibre failed to load')), { once: true });
      }
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.js`;
    script.async = true;
    script.onload = finish;
    script.onerror = () => reject(new Error('MapLibre failed to load'));
    document.head.appendChild(script);
  });
}

export function OpenEarthView({
  center = [-70.9342, 41.6362],
  zoom = 12.4,
  selectedYear = 2026,
  timeMode = 'SLICE',
  onReady,
  onFailure,
}: {
  center?: [number, number];
  zoom?: number;
  selectedYear?: number;
  timeMode?: TimeMode;
  onReady?: () => void;
  onFailure?: (reason: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let disposed = false;
    let loaded = false;
    let map: MapLibreMap | null = null;
    ensureMapLibre().then((maplibre) => {
      if (disposed || !containerRef.current) return;
      map = new maplibre.Map({
        container: containerRef.current,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center,
        zoom,
        pitch: 62,
        bearing: -18,
        attributionControl: true,
        antialias: true,
      });
      map.on('load', () => {
        if (!map || disposed) return;
        loaded = true;
        try {
          if (map.getSource('openmaptiles') && !map.getLayer('worldline-buildings')) {
            map.addLayer({
              id: 'worldline-buildings',
              type: 'fill-extrusion',
              source: 'openmaptiles',
              'source-layer': 'building',
              minzoom: 13,
              paint: {
                'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], ['get', 'height'], 10], 0, '#8b97a6', 80, '#d6dce6'],
                'fill-extrusion-height': ['coalesce', ['get', 'render_height'], ['get', 'height'], ['*', ['coalesce', ['get', 'building:levels'], 3], 3], 10],
                'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0],
                'fill-extrusion-opacity': 0.86,
              },
            });
          }
          const coverageUrl = `${import.meta.env.BASE_URL}data/new-bedford/geometry.geojson`;
          map.addSource('new-bedford-coverage', { type: 'geojson', data: coverageUrl });
          map.addLayer({
            id: 'new-bedford-coverage-line',
            type: 'line',
            source: 'new-bedford-coverage',
            paint: { 'line-color': '#9fe8ff', 'line-width': 2, 'line-opacity': 0.65 },
          });
        } catch {
          // Optional overlays must never break the base Earth view.
        }
        onReady?.();
      });
      map.on('error', () => {
        if (!disposed && !loaded) onFailure?.('Open Earth provider could not establish the initial map surface.');
      });
    }).catch((error: unknown) => {
      if (!disposed) onFailure?.(error instanceof Error ? error.message : 'Open Earth provider failed to load.');
    });
    return () => {
      disposed = true;
      map?.remove();
    };
  }, [center[0], center[1], zoom, onFailure, onReady]);

  const temporalLayers = timeMode === 'PARALLAX'
    ? [Math.max(2023, selectedYear - 3), selectedYear, Math.min(2046, selectedYear + 5)]
    : [];

  return (
    <div className="wl-open-earth" aria-label="Open Earth geographic view">
      <div ref={containerRef} className="wl-open-earth-map" />
      {temporalLayers.length > 0 && <div className="wl-earth-parallax" aria-label="New Bedford Temporal Parallax layers">
        {temporalLayers.map((year, index) => <div key={`${year}-${index}`} className={`wl-earth-time-plane plane-${index}`}><span>{year}</span><small>{year <= 2023 ? 'OBSERVATION' : year <= 2025 ? 'NEAREST OBSERVATION' : year === 2026 ? 'RECONSTRUCTION' : 'SIMULATION'}</small></div>)}
      </div>}
      <div className="wl-open-earth-caption">Open Earth · OpenFreeMap / OpenStreetMap · reconstructed geography</div>
    </div>
  );
}
