import type { Biome, WorldCell, WorldConfig, WorldData } from '../types/world';
import { createNoise, fbm } from './noise';

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

  for (const source of sources.slice(0, 12)) {
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
        { x: x - 1, y },
        { x: x + 1, y },
        { x, y: y - 1 },
        { x, y: y + 1 },
        { x: x - 1, y: y - 1 },
        { x: x + 1, y: y - 1 },
        { x: x - 1, y: y + 1 },
        { x: x + 1, y: y + 1 },
      ];

      let lowest = cell.elevation;
      let next = null as { x: number; y: number } | null;

      for (const n of neighbors) {
        if (n.x < 0 || n.y < 0 || n.x >= width || n.y >= height) continue;
        const ne = cells[n.y][n.x].elevation;
        if (ne < lowest) {
          lowest = ne;
          next = n;
        }
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
        x,
        y,
        elevation,
        moisture,
        temperature: adjustedTemp,
        biome,
        isRiver: false,
      });
    }
    cells.push(row);
  }

  const rivers = carveRivers(cells, width, height, seaLevel);

  return { config, cells, rivers, seed };
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
