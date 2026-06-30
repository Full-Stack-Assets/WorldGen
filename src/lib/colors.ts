import type { Biome } from '../types/world';

export const BIOME_COLORS: Record<Biome, [number, number, number]> = {
  deepOcean: [10, 30, 80],
  ocean: [20, 60, 120],
  beach: [210, 195, 140],
  grassland: [90, 150, 60],
  forest: [34, 100, 45],
  jungle: [20, 80, 30],
  desert: [210, 180, 120],
  savanna: [160, 145, 70],
  tundra: [160, 175, 150],
  snow: [230, 235, 245],
  mountain: [120, 115, 105],
  volcanic: [60, 45, 40],
  swamp: [50, 80, 55],
  river: [40, 100, 160],
};

export const BIOME_LABELS: Record<Biome, string> = {
  deepOcean: 'Deep Ocean',
  ocean: 'Ocean',
  beach: 'Beach',
  grassland: 'Grassland',
  forest: 'Forest',
  jungle: 'Jungle',
  desert: 'Desert',
  savanna: 'Savanna',
  tundra: 'Tundra',
  snow: 'Snow',
  mountain: 'Mountain',
  volcanic: 'Volcanic',
  swamp: 'Swamp',
  river: 'River',
};

export function biomeColor(biome: Biome, elevation: number): [number, number, number] {
  const base = BIOME_COLORS[biome];
  const shade = Math.min(1, elevation * 0.3 + 0.85);
  return base.map((c) => Math.round(c * shade)) as [number, number, number];
}

export function elevationToHex(elevation: number): string {
  const t = Math.max(0, Math.min(1, elevation));
  const r = Math.round(30 + t * 180);
  const g = Math.round(60 + t * 140);
  const b = Math.round(120 - t * 80);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
