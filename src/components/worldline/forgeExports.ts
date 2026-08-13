import { serializeForgeScenePackage, type ForgeCameraState, type ForgeState } from './forgeModel';

export const FORGE_STILL_FILENAME = 'worldgen-forge-new-bedford.png';
export const FORGE_SCENE_FILENAME = 'worldgen-forge-new-bedford.scene.json';

function clickDownload(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadForgeScenePackage(state: ForgeState, camera: ForgeCameraState): void {
  const json = serializeForgeScenePackage(state, camera);
  clickDownload(FORGE_SCENE_FILENAME, new Blob([json], { type: 'application/json' }));
}

export async function downloadForgeStill(canvas: HTMLCanvasElement | null): Promise<void> {
  if (!canvas || typeof canvas.toBlob !== 'function') {
    throw new Error('FORGE still export needs a drawable map canvas.');
  }
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((value) => resolve(value), 'image/png'));
  if (!blob) throw new Error('FORGE still export could not read the map canvas.');
  clickDownload(FORGE_STILL_FILENAME, blob);
}

export function readForgeCamera(map: {
  getCenter?: () => { lng: number; lat: number };
  getZoom?: () => number;
  getPitch?: () => number;
  getBearing?: () => number;
} | null): ForgeCameraState {
  return {
    center: [map?.getCenter?.().lng ?? -70.9217, map?.getCenter?.().lat ?? 41.6349],
    zoom: map?.getZoom?.() ?? 17.4,
    pitch: map?.getPitch?.() ?? 72,
    bearing: map?.getBearing?.() ?? -40,
  };
}
