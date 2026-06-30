import type { Biome, Settlement, SettlementType, WorldCell, WorldConfig, WorldData } from '../types/world';
import { createNoise, createRng, fbm } from './noise';

const SETTLEMENT_NAMES = {
  prefixes: ['North', 'South', 'East', 'West', 'New', 'Old', 'High', 'Deep', 'Iron', 'Gold', 'Silver', 'Storm', 'Sun', 'Moon', 'Star', 'Ash', 'Mist', 'Stone', 'River', 'Lake'],
  roots: ['haven', 'ford', 'burg', 'dale', 'wick', 'heim', 'port', 'hold', 'mere', 'vale', 'ridge', 'fall', 'crest', 'watch', 'rest', 'gate', 'hollow', 'reach'],
  suffixes: ['ton', 'ville', 'borough', 'stead', 'wick', 'by', 'thorpe'],
};

function determineBiome(
  elevation: number,
  moisture: number,
  temperature: number,
  seaLevel: number,
): Biome {
  if (elevation < seaLevel - 0.12) return 'deepOcean';
  if (elevation < seaLevel) return 'ocean';
  if (elevation < seaLevel + 0.03) return 'beach';

  if (elevation > 0.82) {
    if (temperature > 0.6) return 'volcanic';
    return 'snow';
  }
  if (elevation > 0.65) return 'mountain';

  if (temperature < 0.25) return 'tundra';
  if (temperature > 0.75 && moisture < 0.3) return 'desert';
  if (temperature > 0.65 && moisture < 0.45) return 'savanna';
  if (moisture > 0.7 && temperature > 0.55) return 'jungle';
  if (moisture > 0.55) return 'forest';
  if (moisture < 0.35 && temperature > 0.4) return 'savanna';
  if (moisture > 0.65 && elevation < seaLevel + 0.15) return 'swamp';

  return 'grassland';
}

function carveRivers(
  cells: WorldCell[][],
  width: number,
  height: number,
  seaLevel: number,
): { x: number; y: number }[] {
  const rivers: { x: number; y: number }[] = [];
  const rng = (x: number, y: number) => ((x * 374761393 + y * 668265263) >>> 0) % 1000 / 1000;

  const sources: { x: number; y: number }[] = [];
  for (let y = 2; y < height - 2; y += 8) {
    for (let x = 2; x < width - 2; x += 8) {
      const cell = cells[y][x];
      if (cell.elevation > seaLevel + 0.35 && cell.elevation < 0.75 && cell.moisture > 0.4) {
        if (rng(x, y) > 0.7) sources.push({ x, y });
      }
    }
  }

  const visited = new Set<string>();

  for (const source of sources.slice(0, 16)) {
    let { x, y } = source;
    let steps = 0;
    const path: { x: number; y: number }[] = [];

    while (steps < 200) {
      const key = `${x},${y}`;
      if (visited.has(key) || x < 1 || y < 1 || x >= width - 1 || y >= height - 1) break;

      const cell = cells[y][x];
      if (cell.elevation <= seaLevel) break;

      visited.add(key);
      path.push({ x, y });

      const neighbors = [
        { x: x - 1, y }, { x: x + 1, y }, { x, y: y - 1 }, { x, y: y + 1 },
        { x: x - 1, y: y - 1 }, { x: x + 1, y: y - 1 }, { x: x - 1, y: y + 1 }, { x: x + 1, y: y + 1 },
      ];

      let lowest = cell.elevation;
      let next = null as { x: number; y: number } | null;

      for (const n of neighbors) {
        if (n.x < 0 || n.y < 0 || n.x >= width || n.y >= height) continue;
        const ne = cells[n.y][n.x].elevation;
        if (ne < lowest) { lowest = ne; next = n; }
      }

      if (!next) break;
      x = next.x;
      y = next.y;
      steps++;
    }

    if (path.length > 8) {
      for (const p of path) {
        cells[p.y][p.x].isRiver = true;
        cells[p.y][p.x].biome = 'river';
        rivers.push(p);
      }
    }
  }

  return rivers;
}

function carveLakes(
  cells: WorldCell[][],
  width: number,
  height: number,
  seaLevel: number,
  seed: number,
): { x: number; y: number }[] {
  const lakes: { x: number; y: number }[] = [];
  const rng = createRng(seed + 5000);

  for (let attempt = 0; attempt < 20; attempt++) {
    const cx = Math.floor(rng() * (width - 20)) + 10;
    const cy = Math.floor(rng() * (height - 20)) + 10;
    const radius = 3 + Math.floor(rng() * 6);
    const cell = cells[cy][cx];

    if (cell.elevation < seaLevel + 0.05 || cell.elevation > seaLevel + 0.25) continue;
    if (cell.isRiver) continue;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy > radius * radius) continue;
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= width || y >= height) continue;
        const c = cells[y][x];
        if (c.elevation > seaLevel && c.elevation < seaLevel + 0.2 && !c.isRiver) {
          c.isLake = true;
          c.biome = 'lake';
          lakes.push({ x, y });
        }
      }
    }
  }

  return lakes;
}

function generateSettlementName(rng: () => number): string {
  const usePrefix = rng() > 0.4;
  const useSuffix = rng() > 0.5;
  const prefix = SETTLEMENT_NAMES.prefixes[Math.floor(rng() * SETTLEMENT_NAMES.prefixes.length)];
  const root = SETTLEMENT_NAMES.roots[Math.floor(rng() * SETTLEMENT_NAMES.roots.length)];
  const suffix = SETTLEMENT_NAMES.suffixes[Math.floor(rng() * SETTLEMENT_NAMES.suffixes.length)];

  if (usePrefix && useSuffix) return `${prefix}${root}${suffix}`;
  if (usePrefix) return `${prefix}${root}`;
  if (useSuffix) return `${root}${suffix}`;
  return root.charAt(0).toUpperCase() + root.slice(1);
}

function placeSettlements(
  cells: WorldCell[][],
  width: number,
  height: number,
  seaLevel: number,
  seed: number,
): Settlement[] {
  const settlements: Settlement[] = [];
  const rng = createRng(seed + 9000);
  const suitable: { x: number; y: number; score: number }[] = [];

  for (let y = 4; y < height - 4; y += 3) {
    for (let x = 4; x < width - 4; x += 3) {
      const cell = cells[y][x];
      if (cell.biome === 'ocean' || cell.biome === 'deepOcean' || cell.biome === 'mountain' || cell.biome === 'snow') continue;
      if (cell.isRiver || cell.isLake) continue;
      if (cell.elevation < seaLevel + 0.04 || cell.elevation > 0.7) continue;

      let score = 0;
      if (['grassland', 'forest', 'beach'].includes(cell.biome)) score += 2;
      if (cell.moisture > 0.4 && cell.moisture < 0.8) score += 1;
      if (cell.temperature > 0.3 && cell.temperature < 0.75) score += 1;

      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const n = cells[y + dy]?.[x + dx];
          if (n?.isRiver) score += 2;
        }
      }

      if (score >= 3) suitable.push({ x, y, score });
    }
  }

  suitable.sort((a, b) => b.score - a.score);
  const types: SettlementType[] = ['capital', 'city', 'city', 'town', 'town', 'town', 'village', 'village', 'village', 'village', 'outpost'];
  const minDistance = 12;

  for (let i = 0; i < Math.min(25, suitable.length); i++) {
    const candidate = suitable[i];
    const tooClose = settlements.some(
      (s) => Math.abs(s.x - candidate.x) + Math.abs(s.y - candidate.y) < minDistance,
    );
    if (tooClose) continue;

    const type = types[settlements.length] ?? (rng() > 0.7 ? 'town' : 'village');
    const popBase = { capital: 50000, city: 15000, town: 3000, village: 400, outpost: 80 };
    const population = Math.floor(popBase[type] * (0.5 + rng()));

    settlements.push({
      x: candidate.x,
      y: candidate.y,
      name: generateSettlementName(rng),
      type,
      population,
      biome: cells[candidate.y][candidate.x].biome,
    });
  }

  return settlements;
}

export function generateWorld(config: WorldConfig): WorldData {
  const { seed, width, height, scale, octaves, persistence, lacunarity, seaLevel, moistureScale, temperatureScale } = config;

  const elevationNoise = createNoise(seed);
  const moistureNoise = createNoise(seed + 1000);
  const temperatureNoise = createNoise(seed + 2000);

  const cells: WorldCell[][] = [];

  for (let y = 0; y < height; y++) {
    const row: WorldCell[] = [];
    for (let x = 0; x < width; x++) {
      const nx = x / scale;
      const ny = y / scale;

      const rawElevation = fbm(elevationNoise, nx, ny, octaves, persistence, lacunarity);
      const elevation = (rawElevation + 1) / 2;

      const moisture = (fbm(moistureNoise, nx * (120 / moistureScale) + 5, ny * (120 / moistureScale) + 5, 4, 0.5, 2.0) + 1) / 2;
      const temperature = (fbm(temperatureNoise, nx * (120 / temperatureScale) + 10, ny * (120 / temperatureScale), 4, 0.5, 2.0) + 1) / 2;

      const latFactor = 1 - Math.abs(y / height - 0.5) * 1.6;
      const adjustedTemp = temperature * 0.6 + latFactor * 0.4;

      const biome = determineBiome(elevation, moisture, adjustedTemp, seaLevel);

      row.push({
        x, y, elevation, moisture,
        temperature: adjustedTemp,
        biome,
        isRiver: false,
        isLake: false,
      });
    }
    cells.push(row);
  }

  const rivers = carveRivers(cells, width, height, seaLevel);
  const lakes = carveLakes(cells, width, height, seaLevel, seed);
  const settlements = placeSettlements(cells, width, height, seaLevel, seed);

  return { config, cells, rivers, lakes, settlements, seed };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}

export function seedToString(seed: number): string {
  return seed.toString(36).toUpperCase();
}

export function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function parseSeed(seedStr: string): number {
  const trimmed = seedStr.trim();
  if (!trimmed) return randomSeed();

  const upper = trimmed.toUpperCase();
  const fromBase36 = parseInt(upper, 36);
  if (!isNaN(fromBase36) && fromBase36 >= 0 && seedToString(fromBase36) === upper) {
    return fromBase36;
  }

  const fromDecimal = parseInt(trimmed, 10);
  if (!isNaN(fromDecimal) && fromDecimal.toString() === trimmed) {
    return fromDecimal;
  }

  return stringToSeed(trimmed);
}
