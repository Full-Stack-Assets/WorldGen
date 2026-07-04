import type { Biome, WorldData } from '../types/world';
import { createRng } from './noise';

export type PropType = 'conifer' | 'deciduous' | 'palm' | 'cactus' | 'rock' | 'deadTree';

export interface PlacedProp {
  x: number;
  y: number;
  type: PropType;
  scale: number;
  rotation: number;
}

const BIOME_PROPS: Partial<Record<Biome, { type: PropType; weight: number }[]>> = {
  forest: [{ type: 'conifer', weight: 2 }, { type: 'deciduous', weight: 2 }, { type: 'rock', weight: 1 }],
  jungle: [{ type: 'deciduous', weight: 3 }, { type: 'palm', weight: 1 }],
  grassland: [{ type: 'deciduous', weight: 1 }, { type: 'rock', weight: 1 }],
  savanna: [{ type: 'deciduous', weight: 1 }, { type: 'rock', weight: 1 }],
  desert: [{ type: 'cactus', weight: 2 }, { type: 'rock', weight: 1 }],
  tundra: [{ type: 'rock', weight: 2 }, { type: 'deadTree', weight: 1 }],
  swamp: [{ type: 'deadTree', weight: 2 }, { type: 'rock', weight: 1 }],
  mountain: [{ type: 'rock', weight: 3 }],
  snow: [{ type: 'rock', weight: 1 }],
  beach: [{ type: 'palm', weight: 1 }],
};

const BIOME_DENSITY: Partial<Record<Biome, number>> = {
  forest: 0.5,
  jungle: 0.55,
  grassland: 0.12,
  savanna: 0.15,
  desert: 0.08,
  tundra: 0.1,
  swamp: 0.25,
  mountain: 0.2,
  snow: 0.05,
  beach: 0.05,
};

const SETTLEMENT_CLEARANCE = 3;

// Deterministic: same world.seed always yields the same prop layout, per the seeds-are-the-contract convention.
export function placeProps(world: WorldData, maxProps = 5000): PlacedProp[] {
  const { cells, config, settlements } = world;
  const rng = createRng(world.seed + 13000);

  const clearance = new Set<string>();
  for (const s of settlements) {
    for (let dy = -SETTLEMENT_CLEARANCE; dy <= SETTLEMENT_CLEARANCE; dy++) {
      for (let dx = -SETTLEMENT_CLEARANCE; dx <= SETTLEMENT_CLEARANCE; dx++) {
        clearance.add(`${s.x + dx},${s.y + dy}`);
      }
    }
  }

  const candidates: PlacedProp[] = [];

  for (let y = 0; y < config.height; y++) {
    for (let x = 0; x < config.width; x++) {
      const cell = cells[y][x];
      const options = BIOME_PROPS[cell.biome];
      const density = BIOME_DENSITY[cell.biome];
      if (!options || !density) continue;
      if (cell.isRiver || cell.isLake) continue;
      if (clearance.has(`${x},${y}`)) continue;
      if (rng() > density) continue;

      const totalWeight = options.reduce((sum, o) => sum + o.weight, 0);
      let roll = rng() * totalWeight;
      let type = options[0].type;
      for (const option of options) {
        if (roll < option.weight) { type = option.type; break; }
        roll -= option.weight;
      }

      candidates.push({ x, y, type, scale: 0.7 + rng() * 0.6, rotation: rng() * Math.PI * 2 });
    }
  }

  if (candidates.length <= maxProps) return candidates;

  const stride = candidates.length / maxProps;
  const sampled: PlacedProp[] = [];
  for (let i = 0; i < maxProps; i++) sampled.push(candidates[Math.floor(i * stride)]);
  return sampled;
}
