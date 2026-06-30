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
  | 'river'
  | 'lake';

export type SettlementType = 'capital' | 'city' | 'town' | 'village' | 'outpost';

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
  isLake: boolean;
}

export interface Settlement {
  x: number;
  y: number;
  name: string;
  type: SettlementType;
  population: number;
  biome: Biome;
}

export interface WorldData {
  config: WorldConfig;
  cells: WorldCell[][];
  rivers: { x: number; y: number }[];
  lakes: { x: number; y: number }[];
  settlements: Settlement[];
  seed: number;
}

export interface WorldStats {
  landPercent: number;
  oceanPercent: number;
  biomeCounts: Record<Biome, number>;
  dominantBiome: Biome;
  peakElevation: number;
  avgTemperature: number;
  avgMoisture: number;
  riverTiles: number;
  lakeTiles: number;
  settlementCount: number;
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
  quest?: string;
  loading?: boolean;
}

export interface Faction {
  name: string;
  motto: string;
  description: string;
  territory: string;
}

export interface WorldEra {
  name: string;
  years: string;
  summary: string;
}

export interface WorldLore {
  worldName: string;
  tagline: string;
  history: string;
  mythology: string;
  factions: Faction[];
  eras: WorldEra[];
  regions: { x: number; y: number; name: string; description: string }[];
}

export interface WorldPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  config: Partial<WorldConfig>;
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
