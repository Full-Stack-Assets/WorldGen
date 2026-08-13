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

  it('serializes a conceptual scene package for download', () => {
    const createObjectURL = vi.fn(() => 'blob:forge');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
    downloadForgeScenePackage(createInitialForgeState(), {
      center: [-70.9217, 41.6349],
      zoom: 17.4,
      pitch: 72,
      bearing: -40,
    });
    expect(createObjectURL).toHaveBeenCalled();
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toContain('json');
    vi.unstubAllGlobals();
  });

  it('rejects still export when the canvas cannot produce a blob', async () => {
    await expect(downloadForgeStill(null)).rejects.toThrow(/drawable map canvas/i);
  });

  it('reads camera state from a MapLibre-like map', () => {
    expect(readForgeCamera({
      getCenter: () => ({ lng: -70.9, lat: 41.6 }),
      getZoom: () => 12,
      getPitch: () => 40,
      getBearing: () => 10,
    })).toEqual({ center: [-70.9, 41.6], zoom: 12, pitch: 40, bearing: 10 });
  });
});
