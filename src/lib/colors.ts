import type { Biome } from '../types/world';

export const BIOME_COLORS: Record<Biome, [number, number, number]> = {
  deepOcean: [8, 25, 70],
  ocean: [18, 55, 115],
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
  lake: [30, 85, 140],
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
  lake: 'Lake',
};

export function biomeColor(biome: Biome, elevation: number): [number, number, number] {
  const base = BIOME_COLORS[biome];
  const shade = Math.min(1, elevation * 0.25 + 0.88);
  return base.map((c) => Math.round(c * shade)) as [number, number, number];
}

export function applyHillshade(
  r: number, g: number, b: number,
  elevation: number,
  neighborElevations: number[],
): [number, number, number] {
  if (neighborElevations.length < 4) return [r, g, b];

  const dx = (neighborElevations[0] ?? elevation) - (neighborElevations[1] ?? elevation);
  const dy = (neighborElevations[2] ?? elevation) - (neighborElevations[3] ?? elevation);
  const slope = Math.sqrt(dx * dx + dy * dy);
  const shade = 0.75 + Math.min(slope * 3, 0.35);

  return [
    Math.min(255, Math.round(r * shade)),
    Math.min(255, Math.round(g * shade)),
    Math.min(255, Math.round(b * shade)),
  ];
}

export function elevationToHex(elevation: number): string {
  const t = Math.max(0, Math.min(1, elevation));
  const r = Math.round(30 + t * 180);
  const g = Math.round(60 + t * 140);
  const b = Math.round(120 - t * 80);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export const SETTLEMENT_COLORS: Record<string, string> = {
  capital: '#fbbf24',
  city: '#f97316',
  town: '#a78bfa',
  village: '#94a3b8',
  outpost: '#64748b',
};
