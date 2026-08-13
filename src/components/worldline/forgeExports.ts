import {
  serializeForgeScenePackage,
  type ForgeCameraState,
  type ForgeState,
} from './forgeModel';

export const FORGE_STILL_FILENAME = 'worldgen-forge-new-bedford.png';
export const FORGE_SCENE_FILENAME = 'worldgen-forge-new-bedford.scene.json';

export interface ForgeSceneDownload {
  filename: typeof FORGE_SCENE_FILENAME;
  contents: string;
}

export function createForgeSceneDownload(
  state: ForgeState,
  camera: ForgeCameraState,
): ForgeSceneDownload {
  return {
    filename: FORGE_SCENE_FILENAME,
    contents: serializeForgeScenePackage(state, camera),
  };
}

function triggerDownload(blob: Blob, filename: string): void {
  if (
    typeof document === 'undefined' ||
    typeof URL === 'undefined' ||
    typeof URL.createObjectURL !== 'function'
  ) {
    throw new Error('File download is unavailable in this browser.');
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadForgeStill(canvas: HTMLCanvasElement): Promise<void> {
  if (typeof canvas.toBlob !== 'function') {
    throw new Error('PNG export is unavailable in this browser.');
  }
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error('PNG export could not capture the current scene.'));
    }, 'image/png');
  });
  triggerDownload(blob, FORGE_STILL_FILENAME);
}

export function downloadForgeScenePackage(
  state: ForgeState,
  camera: ForgeCameraState,
): void {
  const download = createForgeSceneDownload(state, camera);
  triggerDownload(
    new Blob([download.contents], { type: 'application/json;charset=utf-8' }),
    download.filename,
  );
}
