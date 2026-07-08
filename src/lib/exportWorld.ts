import type { WorldData } from '../types/world';
import { seedToString } from './worldgen';

export function triggerDownload(href: string, filename: string): void {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Exports the full generated world (config + cells + features) so it can be
// consumed by external tools (game engines, map renderers, VTTs).
export function downloadWorldJson(world: WorldData): void {
  const payload = {
    format: 'worldgen/v1',
    seed: world.seed,
    seedString: seedToString(world.seed),
    config: world.config,
    settlements: world.settlements,
    rivers: world.rivers,
    lakes: world.lakes,
    cells: world.cells.map((row) =>
      row.map((c) => ({
        e: Number(c.elevation.toFixed(4)),
        m: Number(c.moisture.toFixed(4)),
        t: Number(c.temperature.toFixed(4)),
        b: c.biome,
      })),
    ),
  };
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, `worldgen-${seedToString(world.seed)}.json`);
  URL.revokeObjectURL(url);
}

// Snapshots the WebGL canvas. Requires the renderer to keep its drawing
// buffer (preserveDrawingBuffer) or the capture races the compositor.
export function downloadScenePng(seed: number): boolean {
  const canvas = document.querySelector<HTMLCanvasElement>('.world-scene-3d canvas');
  if (!canvas) return false;
  try {
    triggerDownload(canvas.toDataURL('image/png'), `worldgen-${seedToString(seed)}.png`);
    return true;
  } catch {
    return false;
  }
}
