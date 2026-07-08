import type { Biome, RegionInfo, WorldData, WorldLore } from '../types/world';
import { BIOME_LABELS } from './colors';
import { getGeminiApiKey } from './apiKey';

export { isAiAvailable } from './apiKey';

function parseJson(text: string): Record<string, unknown> {
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
}

function buildRegionPrompt(region: RegionInfo, world: WorldData): string {
  const settlement = world.settlements.find(
    (s) => Math.abs(s.x - region.x) < 3 && Math.abs(s.y - region.y) < 3,
  );

  return `You are a master fantasy world-builder. Generate rich content for this region.

Region: ${BIOME_LABELS[region.biome]} | Elevation ${(region.elevation * 100).toFixed(0)}% | Moisture ${(region.moisture * 100).toFixed(0)}% | Temp ${(region.temperature * 100).toFixed(0)}%
Coordinates: (${region.x}, ${region.y}) | World seed: ${world.seed}
${settlement ? `Nearby settlement: ${settlement.name} (${settlement.type}, pop. ${settlement.population})` : 'Wilderness — no nearby settlements'}

Respond JSON only:
{"name":"Evocative Region Name","description":"Three vivid sentences painting this place.","lore":"A hidden secret or ancient mystery.","quest":"A one-sentence adventure hook for travelers."}`;
}

function buildWorldLorePrompt(world: WorldData, sampleRegions: { biome: Biome; x: number; y: number }[]): string {
  const regionSummary = sampleRegions.map((r) => `- ${BIOME_LABELS[r.biome]} at (${r.x}, ${r.y})`).join('\n');
  const settlementSummary = world.settlements.slice(0, 5).map((s) => `- ${s.name} (${s.type})`).join('\n');

  return `You are a master fantasy world-builder creating an epic world bible.

World seed: ${world.seed}
Settlements: ${settlementSummary || 'None yet discovered'}
Biomes: ${regionSummary}

Create a rich world bible. Respond JSON only:
{
  "worldName": "Epic Name",
  "tagline": "Evocative one-liner",
  "history": "Four sentences of sweeping world history.",
  "mythology": "Two sentences of creation myth or cosmic origin.",
  "factions": [
    {"name":"Faction","motto":"Their words","description":"Two sentences","territory":"Where they rule"}
  ],
  "eras": [
    {"name":"Era Name","years":"Year range","summary":"What happened"}
  ],
  "regions": [{"x":0,"y":0,"name":"Landmark","description":"One sentence"}]
}`;
}

export async function generateRegionLore(
  region: RegionInfo,
  world: WorldData,
): Promise<Pick<RegionInfo, 'name' | 'description' | 'lore' | 'quest'>> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return generateFallbackRegionLore(region, world);

  try {
    // Lazy import keeps the Gemini SDK out of the initial bundle — it only
    // loads for users who actually generate AI lore.
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: buildRegionPrompt(region, world),
    });
    const json = parseJson(response.text ?? '');
    return {
      name: (json.name as string) ?? 'Unknown Region',
      description: (json.description as string) ?? '',
      lore: (json.lore as string) ?? '',
      quest: (json.quest as string) ?? '',
    };
  } catch {
    return generateFallbackRegionLore(region, world);
  }
}

export async function generateWorldLore(world: WorldData): Promise<WorldLore> {
  const apiKey = getGeminiApiKey();
  const sampleRegions = sampleNotableRegions(world);
  if (!apiKey) return generateFallbackWorldLore(world, sampleRegions);

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: buildWorldLorePrompt(world, sampleRegions),
    });
    const json = parseJson(response.text ?? '');
    return {
      worldName: (json.worldName as string) ?? `World ${world.seed}`,
      tagline: (json.tagline as string) ?? 'A land of endless possibility',
      history: (json.history as string) ?? '',
      mythology: (json.mythology as string) ?? '',
      factions: (json.factions as WorldLore['factions']) ?? [],
      eras: (json.eras as WorldLore['eras']) ?? [],
      regions: (json.regions as WorldLore['regions']) ?? [],
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
  lake: ['Mirrordeep', 'Stillwater', 'Crystal Basin'],
};

const FALLBACK_QUESTS = [
  'A merchant offers gold to retrieve a relic from the depths nearby.',
  'Locals whisper of lights seen at night — someone should investigate.',
  'A wounded traveler begs for escort through the dangerous terrain ahead.',
  'Ancient markings on stone suggest a hidden cache lies beneath.',
  'A beast has been terrorizing the roads; a bounty has been posted.',
];

function generateFallbackRegionLore(
  region: RegionInfo,
  world: WorldData,
): Pick<RegionInfo, 'name' | 'description' | 'lore' | 'quest'> {
  const names = FALLBACK_NAMES[region.biome] ?? ['Unnamed Lands'];
  const name = names[Math.abs(region.x * 31 + region.y * 17) % names.length];
  const biome = BIOME_LABELS[region.biome];
  const settlement = world.settlements.find(
    (s) => Math.abs(s.x - region.x) < 3 && Math.abs(s.y - region.y) < 3,
  );

  return {
    name: settlement?.name ?? name,
    description: `A ${biome.toLowerCase()} region rising to ${(region.elevation * 100).toFixed(0)}% elevation. ${
      settlement
        ? `${settlement.name} stands as a ${settlement.type} of ${settlement.population.toLocaleString()} souls.`
        : 'Untamed wilderness stretches in every direction.'
    } Ancient forces have shaped this land since before memory.`,
    lore: 'Carvings found here predate any known civilization by millennia.',
    quest: FALLBACK_QUESTS[Math.abs(region.x + region.y) % FALLBACK_QUESTS.length],
  };
}

function generateFallbackWorldLore(
  world: WorldData,
  samples: { biome: Biome; x: number; y: number }[],
): WorldLore {
  const prefixes = ['Aether', 'Eld', 'Myth', 'Storm', 'Crystal', 'Shadow', 'Dawn', 'Ember'];
  const suffixes = ['mere', 'hold', 'reach', 'vale', 'spire', 'haven', 'wilds', 'gate'];
  const p = prefixes[world.seed % prefixes.length];
  const s = suffixes[(world.seed >> 4) % suffixes.length];
  const capital = world.settlements.find((s) => s.type === 'capital');

  return {
    worldName: `${p}${s}`,
    tagline: 'Where legends are born from chaos',
    history: `Forged from seed ${world.seed}, this world crystallized from primordial noise into continents and seas. ${world.settlements.length} settlements now dot the landscape, from the capital of ${capital?.name ?? 'unknown lands'} to remote outposts. Wars, alliances, and mysteries unfold across ${samples.length} distinct biomes.`,
    mythology: 'The ancients say the world was sung into existence by a dying star. Its final notes became mountains, its breath became wind.',
    factions: [
      { name: 'The Concordat', motto: 'Unity through strength', description: 'A coalition of city-states seeking to unify the known world under one banner.', territory: 'Central grasslands and river valleys' },
      { name: 'Wildbound Pact', motto: 'The land remembers', description: 'Druidic circles and tribal nations who reject civilization encroaching on sacred wilds.', territory: 'Forests, jungles, and swamps' },
      { name: 'Iron Covenant', motto: 'Forged in fire', description: 'Mountain dwarves and volcanic clans who control the richest ore deposits.', territory: 'Mountains and volcanic regions' },
    ],
    eras: [
      { name: 'The Shaping', years: 'Before 0', summary: 'The world formed from cosmic chaos, biomes spreading like living paint.' },
      { name: 'Age of Settlement', years: '0 – 500', summary: 'First cities rose along rivers. Trade routes connected distant shores.' },
      { name: 'Current Era', years: '500 – present', summary: 'Factions vie for dominance. Unexplored regions still hold ancient secrets.' },
    ],
    regions: samples.slice(0, 4).map((r, i) => ({
      x: r.x, y: r.y,
      name: (FALLBACK_NAMES[r.biome] ?? ['Unknown'])[i % 3],
      description: `A landmark ${BIOME_LABELS[r.biome].toLowerCase()} region of great significance.`,
    })),
  };
}
