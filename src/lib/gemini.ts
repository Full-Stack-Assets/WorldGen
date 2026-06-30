import { GoogleGenAI } from '@google/genai';
import type { Biome, RegionInfo, WorldData, WorldLore } from '../types/world';
import { BIOME_LABELS } from './colors';
import { getGeminiApiKey } from './apiKey';

export { isAiAvailable } from './apiKey';

function buildRegionPrompt(region: RegionInfo, world: WorldData): string {
  return `You are a fantasy world-building assistant. Generate a short, evocative name and 2-sentence description for this region in a procedurally generated world.

Region details:
- Biome: ${BIOME_LABELS[region.biome]}
- Elevation: ${(region.elevation * 100).toFixed(0)}% (0=sea level, 100=peak)
- Moisture: ${(region.moisture * 100).toFixed(0)}%
- Temperature: ${(region.temperature * 100).toFixed(0)}%
- World seed: ${world.seed}
- Coordinates: (${region.x}, ${region.y})

Respond in JSON only, no markdown:
{"name": "Region Name", "description": "Two evocative sentences about this place.", "lore": "One sentence of hidden history or mystery."}`;
}

function buildWorldLorePrompt(world: WorldData, sampleRegions: { biome: Biome; x: number; y: number }[]): string {
  const regionSummary = sampleRegions
    .map((r) => `- ${BIOME_LABELS[r.biome]} at (${r.x}, ${r.y})`)
    .join('\n');

  return `You are a fantasy world-building assistant. A procedurally generated world has been created with seed ${world.seed}.

Sample regions:
${regionSummary}

Generate a world name, tagline, brief history (3 sentences), and names for 3 notable regions.

Respond in JSON only, no markdown:
{
  "worldName": "Name",
  "tagline": "Short evocative tagline",
  "history": "Three sentences of world history.",
  "regions": [
    {"x": 0, "y": 0, "name": "Name", "description": "One sentence"}
  ]
}`;
}

export async function generateRegionLore(region: RegionInfo, world: WorldData): Promise<Pick<RegionInfo, 'name' | 'description' | 'lore'>> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return generateFallbackRegionLore(region);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: buildRegionPrompt(region, world),
    });

    const text = response.text?.trim() ?? '';
    const json = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
    return {
      name: json.name ?? 'Unknown Region',
      description: json.description ?? '',
      lore: json.lore ?? '',
    };
  } catch {
    return generateFallbackRegionLore(region);
  }
}

export async function generateWorldLore(world: WorldData): Promise<WorldLore> {
  const apiKey = getGeminiApiKey();
  const sampleRegions = sampleNotableRegions(world);

  if (!apiKey) {
    return generateFallbackWorldLore(world, sampleRegions);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: buildWorldLorePrompt(world, sampleRegions),
    });

    const text = response.text?.trim() ?? '';
    const json = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
    return {
      worldName: json.worldName ?? `World ${world.seed}`,
      tagline: json.tagline ?? 'A land of endless possibility',
      history: json.history ?? '',
      regions: json.regions ?? [],
    };
  } catch {
    return generateFallbackWorldLore(world, sampleRegions);
  }
}

function sampleNotableRegions(world: WorldData): { biome: Biome; x: number; y: number }[] {
  const { cells, config } = world;
  const samples: { biome: Biome; x: number; y: number }[] = [];
  const seen = new Set<Biome>();

  for (let y = 0; y < config.height; y += 20) {
    for (let x = 0; x < config.width; x += 20) {
      const biome = cells[y][x].biome;
      if (!seen.has(biome) && biome !== 'ocean' && biome !== 'deepOcean') {
        seen.add(biome);
        samples.push({ biome, x, y });
      }
    }
  }

  return samples.slice(0, 8);
}

const FALLBACK_NAMES: Partial<Record<Biome, string[]>> = {
  forest: ['Whisperwood', 'Elder Grove', 'Shadowmere'],
  mountain: ['Ironpeak', 'Cloudspire', 'Stoneheart Ridge'],
  desert: ['Sunscar Dunes', 'Mirage Basin', 'Ashwind Expanse'],
  grassland: ['Greenvale', 'Windward Plains', 'Goldmeadow'],
  snow: ['Frosthold', 'Glacierveil', 'Wintermere'],
  jungle: ['Verdant Deep', 'Serpent Canopy', 'Emerald Mire'],
  swamp: ['Mistfen', 'Bogheart', 'Willowmarsh'],
  volcanic: ['Emberfall', 'Cinderreach', 'Magma Scar'],
  savanna: ['Sungrass Steppe', 'Lion Plains', 'Drywind'],
  tundra: ['Permafrost Reach', 'Bleak Tundra', 'Northwind'],
  beach: ['Sandsreach', 'Tidewash Shore', 'Driftwood Bay'],
  river: ['Silverflow', 'Rapids Crossing', 'Riverbend'],
};

function generateFallbackRegionLore(region: RegionInfo): Pick<RegionInfo, 'name' | 'description' | 'lore'> {
  const names = FALLBACK_NAMES[region.biome] ?? ['Unnamed Lands'];
  const name = names[Math.abs(region.x * 31 + region.y * 17) % names.length];
  const biome = BIOME_LABELS[region.biome];

  return {
    name,
    description: `A ${biome.toLowerCase()} region where the land rises to ${(region.elevation * 100).toFixed(0)}% elevation. Ancient winds have shaped this terrain over countless ages.`,
    lore: 'Local legends speak of travelers who ventured here and never returned the same.',
  };
}

function generateFallbackWorldLore(
  world: WorldData,
  samples: { biome: Biome; x: number; y: number }[],
): WorldLore {
  const prefixes = ['Aether', 'Eld', 'Myth', 'Storm', 'Crystal', 'Shadow', 'Dawn'];
  const suffixes = ['mere', 'hold', 'reach', 'vale', 'spire', 'haven', 'wilds'];
  const p = prefixes[world.seed % prefixes.length];
  const s = suffixes[(world.seed >> 4) % suffixes.length];

  return {
    worldName: `${p}${s}`,
    tagline: 'Forged by chaos, waiting to be explored',
    history: `Born from seed ${world.seed}, this world emerged from the void as tectonic dreams crystallized into land and sea. Diverse biomes spread across its surface like brushstrokes on a cosmic canvas. Few have mapped its full extent, and fewer still understand its deepest mysteries.`,
    regions: samples.slice(0, 3).map((r, i) => ({
      x: r.x,
      y: r.y,
      name: (FALLBACK_NAMES[r.biome] ?? ['Unknown'])[i % 3],
      description: `A notable ${BIOME_LABELS[r.biome].toLowerCase()} landmark in this world.`,
    })),
  };
}
