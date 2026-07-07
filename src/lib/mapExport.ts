import type { WorldCell, WorldData } from '../types/world';
import { BIOME_COLORS } from './colors';
import { triggerDownload } from './exportWorld';
import { seedToString } from './worldgen';

type ColorFn = (cell: WorldCell) => [number, number, number];

function renderMap(world: WorldData, color: ColorFn): HTMLCanvasElement | null {
  const { config, cells } = world;
  const canvas = document.createElement('canvas');
  canvas.width = config.width;
  canvas.height = config.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const image = ctx.createImageData(config.width, config.height);
  for (let y = 0; y < config.height; y++) {
    for (let x = 0; x < config.width; x++) {
      const [r, g, b] = color(cells[y][x]);
      const i = (y * config.width + x) * 4;
      image.data[i] = r;
      image.data[i + 1] = g;
      image.data[i + 2] = b;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

function save(canvas: HTMLCanvasElement | null, seed: number, suffix: string): boolean {
  if (!canvas) return false;
  triggerDownload(canvas.toDataURL('image/png'), `worldgen-${seedToString(seed)}-${suffix}.png`);
  return true;
}

// Grayscale elevation map — a drop-in heightmap for game engines / terrain tools.
export function downloadHeightmapPng(world: WorldData): boolean {
  const canvas = renderMap(world, (cell) => {
    const v = Math.max(0, Math.min(255, Math.round(cell.elevation * 255)));
    return [v, v, v];
  });
  return save(canvas, world.seed, 'heightmap');
}

// Top-down colored biome map at full grid resolution.
export function downloadBiomeMapPng(world: WorldData): boolean {
  const canvas = renderMap(world, (cell) => BIOME_COLORS[cell.biome]);
  return save(canvas, world.seed, 'biomemap');
}
