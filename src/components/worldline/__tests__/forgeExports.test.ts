import { describe, expect, it } from 'vitest';
import {
  FORGE_SCENE_FILENAME,
  FORGE_STILL_FILENAME,
  createForgeSceneDownload,
  downloadForgeStill,
} from '../forgeExports';
import { createInitialForgeState } from '../forgeModel';

const camera = {
  center: [-70.9217, 41.6349] as const,
  zoom: 17.4,
  pitch: 72,
  bearing: -40,
};

describe('FORGE exports', () => {
  it('uses stable v5 filenames', () => {
    expect(FORGE_STILL_FILENAME).toBe('worldgen-forge-new-bedford.png');
    expect(FORGE_SCENE_FILENAME).toBe('worldgen-forge-new-bedford.scene.json');
  });

  it('builds an explicitly conceptual scene download', () => {
    const download = createForgeSceneDownload(
      { ...createInitialForgeState(), mode: 'editing' },
      camera,
    );
    const scene = JSON.parse(download.contents);
    expect(download.filename).toBe(FORGE_SCENE_FILENAME);
    expect(scene.product).toBe('WorldGen FORGE');
    expect(scene.version).toBe('5.0.0');
    expect(scene.classification).toBe('VISUAL_CONCEPT');
    expect(scene.forge.variantId).toBe('lumen-quay');
  });

  it('rejects still export when canvas capture is unavailable', async () => {
    const canvas = {} as HTMLCanvasElement;
    await expect(downloadForgeStill(canvas)).rejects.toThrow(
      'PNG export is unavailable in this browser.',
    );
  });
});
