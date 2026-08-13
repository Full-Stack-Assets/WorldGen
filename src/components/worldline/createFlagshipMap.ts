import { configureFlagshipBaseLayers } from './flagshipBaseLayers';
import { addFlagshipConceptLayers } from './flagshipConceptLayers';
import { FLAGSHIP_STAGES } from './flagshipSequence';
import { addForgeLayers } from './forgeMapLayers';
import {
  chooseEarthProjection,
  ensureMapLibre,
  type MapLibreMap,
} from './maplibreRuntime';
import { addSceneMotionLayer, startSceneMotion } from './sceneMotionRuntime';

export interface CreateFlagshipMapInput {
  container: HTMLDivElement;
  center: [number, number];
  zoom: number;
  projectionMode: 'globe' | 'mercator';
  openingInSpace: boolean;
  compact: boolean;
}

export interface MountedFlagshipMap {
  map: MapLibreMap;
  dispose: () => void;
}

export async function createFlagshipMap({
  container,
  center,
  zoom,
  projectionMode,
  openingInSpace,
  compact,
}: CreateFlagshipMapInput): Promise<MountedFlagshipMap> {
  const maplibre = await ensureMapLibre();
  const opening = openingInSpace ? FLAGSHIP_STAGES[0] : null;
  const map = new maplibre.Map({
    container,
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: opening ? [...opening.center] : center,
    zoom: opening?.zoom ?? zoom,
    pitch: opening?.pitch ?? 62,
    bearing: opening?.bearing ?? -18,
    attributionControl: true,
    antialias: true,
    renderWorldCopies: false,
    fadeDuration: 850,
    maxTileCacheSize: compact ? 180 : 520,
    preserveDrawingBuffer: true,
  });

  const projection = chooseEarthProjection(
    typeof map.setProjection === 'function',
    projectionMode,
  );
  if (projection === 'globe') map.setProjection?.({ type: 'globe' });

  return new Promise((resolve, reject) => {
    let loaded = false;
    map.on('load', () => {
      loaded = true;
      try {
        configureFlagshipBaseLayers(
          map,
          `${import.meta.env.BASE_URL}data/new-bedford/geometry.geojson`,
        );
        addFlagshipConceptLayers(map);
        addSceneMotionLayer(map);
        addForgeLayers(map);
      } catch {
        // Optional visual layers must never break the base map.
      }
      const stopMotion = startSceneMotion(map, compact);
      resolve({
        map,
        dispose: () => {
          stopMotion();
          map.remove();
        },
      });
    });
    map.on('error', () => {
      if (!loaded) {
        map.remove();
        reject(
          new Error('Open Earth provider could not establish the initial map surface.'),
        );
      }
    });
  });
}
