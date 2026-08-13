import { stageDuration, type FlagshipStage } from './flagshipSequence';

export type GeoJSONSourceLike = {
  setData: (data: unknown) => unknown;
};

export type MapStyle = {
  layers?: Array<{ id: string; type?: string }>;
};

export type MapLibreMap = {
  on: (event: string, callback: (event?: unknown) => void) => void;
  once: (event: string, callback: (event?: unknown) => void) => void;
  remove: () => void;
  stop: () => void;
  flyTo: (options: Record<string, unknown>) => void;
  easeTo: (options: Record<string, unknown>) => void;
  getCanvas: () => HTMLCanvasElement;
  getSource: (id: string) => unknown;
  addSource: (id: string, source: unknown) => void;
  getLayer: (id: string) => unknown;
  addLayer: (layer: unknown, beforeId?: string) => void;
  getStyle?: () => MapStyle;
  getCenter?: () => { lng: number; lat: number };
  getZoom?: () => number;
  getPitch?: () => number;
  getBearing?: () => number;
  queryRenderedFeatures?: (point: unknown, options?: unknown) => unknown[];
  setProjection?: (projection: { type: string } | string) => void;
  setFog?: (fog: Record<string, unknown>) => void;
  setPaintProperty?: (layerId: string, property: string, value: unknown) => void;
  getCenter?: () => { lng: number; lat: number };
  getZoom?: () => number;
  getPitch?: () => number;
  getBearing?: () => number;
  queryRenderedFeatures?: (point: unknown, options?: unknown) => unknown[];
};

export type MapLibreNamespace = {
  Map: new (options: Record<string, unknown>) => MapLibreMap;
};

declare global {
  interface Window {
    maplibregl?: MapLibreNamespace;
  }
}

const SCRIPT_ID = 'worldline-maplibre-script';
const STYLE_ID = 'worldline-maplibre-style';
const MAPLIBRE_VERSION = '5.24.0';

export function chooseEarthProjection(
  globeSupported: boolean,
  requested: 'globe' | 'mercator' = 'globe',
): 'globe' | 'mercator' {
  return requested === 'globe' && globeSupported ? 'globe' : 'mercator';
}

export function ensureMapLibre(): Promise<MapLibreNamespace> {
  if (window.maplibregl) return Promise.resolve(window.maplibregl);

  return new Promise((resolve, reject) => {
    if (!document.getElementById(STYLE_ID)) {
      const link = document.createElement('link');
      link.id = STYLE_ID;
      link.rel = 'stylesheet';
      link.href = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.css`;
      document.head.appendChild(link);
    }

    const finish = () => {
      if (window.maplibregl) resolve(window.maplibregl);
      else reject(new Error('MapLibre global missing after load'));
    };
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.maplibregl) finish();
      else {
        existing.addEventListener('load', finish, { once: true });
        existing.addEventListener(
          'error',
          () => reject(new Error('MapLibre failed to load')),
          { once: true },
        );
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

export function moveToStage(
  map: MapLibreMap,
  stage: FlagshipStage,
  reducedMotion: boolean,
): Promise<void> {
  const duration = stageDuration(stage, reducedMotion);
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    map.once('moveend', finish);
    const camera = {
      center: [...stage.center],
      zoom: stage.zoom,
      pitch: stage.pitch,
      bearing: stage.bearing,
      duration,
      curve: stage.curve,
      speed: stage.speed,
      essential: !reducedMotion,
    };

    if (stage.transition === 'ease') map.easeTo(camera);
    else map.flyTo(camera);
    window.setTimeout(finish, duration + 1400);
  });
}
