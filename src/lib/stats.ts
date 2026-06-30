import type { Biome, WorldData, WorldStats } from '../types/world';

export function computeWorldStats(world: WorldData): WorldStats {
  const { cells, rivers, lakes, settlements } = world;
  const biomeCounts = {} as Record<Biome, number>;
  let land = 0;
  let ocean = 0;
  let peakElevation = 0;
  let totalTemp = 0;
  let totalMoisture = 0;
  let total = 0;

  for (const row of cells) {
    for (const cell of row) {
      total++;
      biomeCounts[cell.biome] = (biomeCounts[cell.biome] ?? 0) + 1;
      totalTemp += cell.temperature;
      totalMoisture += cell.moisture;
      if (cell.elevation > peakElevation) peakElevation = cell.elevation;

      if (cell.biome === 'ocean' || cell.biome === 'deepOcean') ocean++;
      else land++;
    }
  }

  const dominantBiome = (Object.entries(biomeCounts) as [Biome, number][])
    .filter(([b]) => b !== 'ocean' && b !== 'deepOcean')
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'grassland';

  return {
    landPercent: (land / total) * 100,
    oceanPercent: (ocean / total) * 100,
    biomeCounts,
    dominantBiome,
    peakElevation,
    avgTemperature: totalTemp / total,
    avgMoisture: totalMoisture / total,
    riverTiles: rivers.length,
    lakeTiles: lakes.length,
    settlementCount: settlements.length,
  };
}
