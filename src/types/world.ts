export type Biome =
  | 'deepOcean'
  | 'ocean'
  | 'beach'
  | 'grassland'
  | 'forest'
  | 'jungle'
  | 'desert'
  | 'savanna'
  | 'tundra'
  | 'snow'
  | 'mountain'
  | 'volcanic'
  | 'swamp'
  | 'river';

export interface WorldConfig {
  seed: number;
  width: number;
  height: number;
  scale: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
  seaLevel: number;
  moistureScale: number;
  temperatureScale: number;
}

export interface WorldCell {
  x: number;
  y: number;
  elevation: number;
  moisture: number;
  temperature: number;
  biome: Biome;
  isRiver: boolean;
}

export interface WorldData {
  config: WorldConfig;
  cells: WorldCell[][];
  rivers: { x: number; y: number }[];
  seed: number;
}

export interface RegionInfo {
  x: number;
  y: number;
  biome: Biome;
  elevation: number;
  moisture: number;
  temperature: number;
  name?: string;
  description?: string;
  lore?: string;
  loading?: boolean;
}

export interface WorldLore {
  worldName: string;
  tagline: string;
  history: string;
  regions: { x: number; y: number; name: string; description: string }[];
}

export const DEFAULT_CONFIG: WorldConfig = {
  seed: Date.now(),
  width: 256,
  height: 256,
  scale: 80,
  octaves: 6,
  persistence: 0.5,
  lacunarity: 2.0,
  seaLevel: 0.38,
  moistureScale: 60,
  temperatureScale: 70,
};
