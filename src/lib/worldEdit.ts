import type { Biome, Settlement, SettlementType, WorldCell, WorldData } from '../types/world';

function cloneWorld(world: WorldData): WorldData {
  return {
    ...world,
    cells: world.cells.map((row) => row.map((cell) => ({ ...cell }))),
    rivers: world.rivers.map((point) => ({ ...point })),
    lakes: world.lakes.map((point) => ({ ...point })),
    settlements: world.settlements.map((settlement) => ({ ...settlement })),
    config: { ...world.config },
  };
}

function inBounds(world: WorldData, x: number, y: number): boolean {
  return y >= 0 && y < world.cells.length && x >= 0 && x < (world.cells[0]?.length ?? 0);
}

export function paintBiome(
  world: WorldData,
  x: number,
  y: number,
  biome: Biome,
  radius = 1,
): WorldData {
  const next = cloneWorld(world);
  const r = Math.max(0, Math.floor(radius));
  for (let dy = -r; dy <= r; dy += 1) {
    for (let dx = -r; dx <= r; dx += 1) {
      if (dx * dx + dy * dy > r * r) continue;
      const cell = next.cells[y + dy]?.[x + dx] as WorldCell | undefined;
      if (!cell) continue;
      cell.biome = biome;
      cell.isRiver = biome === 'river';
      cell.isLake = biome === 'lake';
    }
  }
  next.rivers = [];
  next.lakes = [];
  for (const row of next.cells) {
    for (const cell of row) {
      if (cell.isRiver) next.rivers.push({ x: cell.x, y: cell.y });
      if (cell.isLake) next.lakes.push({ x: cell.x, y: cell.y });
    }
  }
  return next;
}

export function placeNamedSettlement(
  world: WorldData,
  x: number,
  y: number,
  name: string,
  type: SettlementType = 'village',
): WorldData {
  if (!inBounds(world, x, y)) return world;
  const cell = world.cells[y][x];
  const next = cloneWorld(world);
  const settlement: Settlement = {
    x,
    y,
    name: name.trim() || 'Unnamed Hold',
    type,
    population: type === 'capital' ? 12000 : type === 'city' ? 6000 : type === 'town' ? 1800 : type === 'outpost' ? 80 : 400,
    biome: cell.biome,
  };
  next.settlements = [
    ...next.settlements.filter((item) => !(item.x === x && item.y === y)),
    settlement,
  ];
  return next;
}

export type GeneratedWorldTool = 'inspect' | 'paint' | 'settle';
