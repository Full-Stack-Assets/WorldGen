import { createProceduralLifeFrame } from './flagshipSequence';
import type { GeoJSONSourceLike, MapLibreMap } from './maplibreRuntime';

const sourceId = 'worldgen-procedural-life';

export function addSceneMotionLayer(map: MapLibreMap): void {
  if (map.getSource(sourceId)) return;
  map.addSource(sourceId, { type: 'geojson', data: createProceduralLifeFrame(0, false) });
  map.addLayer({
    id: 'worldgen-procedural-life-glow',
    type: 'circle',
    source: sourceId,
    minzoom: 11,
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 1.4, 16, 4.2, 19, 7],
      'circle-color': ['match', ['get', 'kind'], 'harbor', '#9ce9ff', 'pedestrian', '#ffd89b', '#fff4cf'],
      'circle-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.24, 15, 0.82],
      'circle-blur': 0.56,
    },
  });
}

export function startSceneMotion(map: MapLibreMap, compact: boolean): () => void {
  let frame = 0;
  let last = 0;
  const tick = (now: number) => {
    if (now - last >= 83) {
      last = now;
      const source = map.getSource(sourceId) as GeoJSONSourceLike | undefined;
      source?.setData(createProceduralLifeFrame((now % 120000) / 120000, compact));
    }
    frame = window.requestAnimationFrame(tick);
  };
  frame = window.requestAnimationFrame(tick);
  return () => window.cancelAnimationFrame(frame);
}
