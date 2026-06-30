import type { Biome } from '../types/world';
import { BIOME_LABELS } from './colors';

export interface BiomeEntry {
  biome: Biome;
  label: string;
  description: string;
  climate: string;
  inhabitants: string;
  resources: string;
  danger: string;
}

export const BIOME_CODEX: BiomeEntry[] = [
  {
    biome: 'grassland',
    label: BIOME_LABELS.grassland,
    description: 'Rolling plains of tall grass stretching to the horizon, dotted with wildflowers and grazing herds.',
    climate: 'Temperate, moderate rainfall',
    inhabitants: 'Nomadic herders, frontier farmers, wind mages',
    resources: 'Grain, livestock, herbs',
    danger: 'Low — occasional predators and bandits',
  },
  {
    biome: 'forest',
    label: BIOME_LABELS.forest,
    description: 'Ancient woodlands where canopy filters sunlight into emerald shafts. Moss carpets the forest floor.',
    climate: 'Cool and humid',
    inhabitants: 'Wood elves, rangers, druids, fey creatures',
    resources: 'Timber, mushrooms, game, rare flora',
    danger: 'Moderate — wolves, territorial spirits',
  },
  {
    biome: 'jungle',
    label: BIOME_LABELS.jungle,
    description: 'Dense tropical growth where every shadow hides life. Vines choke ruins of forgotten civilizations.',
    climate: 'Hot, extremely humid',
    inhabitants: 'Tribal warriors, beast tamers, poison crafters',
    resources: 'Exotic fruits, spices, medicinal plants',
    danger: 'High — predators, disease, hostile tribes',
  },
  {
    biome: 'desert',
    label: BIOME_LABELS.desert,
    description: 'Endless dunes and cracked salt flats beneath a merciless sun. Oasis cities are jewels of survival.',
    climate: 'Arid, extreme heat by day',
    inhabitants: 'Desert nomads, sand merchants, sun priests',
    resources: 'Salt, glass, buried artifacts',
    danger: 'High — dehydration, sandstorms, raiders',
  },
  {
    biome: 'mountain',
    label: BIOME_LABELS.mountain,
    description: 'Towering peaks pierce the clouds. Stone fortresses cling to cliffs above treacherous passes.',
    climate: 'Cold, thin air at altitude',
    inhabitants: 'Dwarves, mountain clans, eagle riders',
    resources: 'Ore, gems, crystal formations',
    danger: 'High — avalanches, altitude, territorial beasts',
  },
  {
    biome: 'snow',
    label: BIOME_LABELS.snow,
    description: 'A frozen realm of glaciers and howling winds. Only the hardiest life endures the eternal winter.',
    climate: 'Sub-zero, blizzards common',
    inhabitants: 'Ice shamans, frost giants, survivalists',
    resources: 'Ice crystals, preserved creatures, aurora energy',
    danger: 'Extreme — cold, whiteouts, ancient frozen horrors',
  },
  {
    biome: 'volcanic',
    label: BIOME_LABELS.volcanic,
    description: 'Lands scarred by lava flows and ash. The earth breathes fire here, reshaping itself constantly.',
    climate: 'Scorching, toxic gases near vents',
    inhabitants: 'Fire cultists, salamander kin, obsidian smiths',
    resources: 'Obsidian, sulfur, geothermal energy',
    danger: 'Extreme — eruptions, lava, unstable ground',
  },
  {
    biome: 'swamp',
    label: BIOME_LABELS.swamp,
    description: 'Mist-shrouded wetlands where dead trees rise from black water. Lanterns flicker in the fog.',
    climate: 'Warm, perpetually damp',
    inhabitants: 'Witch covens, bog witches, amphibian folk',
    resources: 'Peat, rare fungi, alchemical reagents',
    danger: 'High — quicksand, disease, lurking predators',
  },
  {
    biome: 'savanna',
    label: BIOME_LABELS.savanna,
    description: 'Golden grasslands punctuated by acacia trees. Great migrations cross these open plains.',
    climate: 'Warm, seasonal rains',
    inhabitants: 'Tribal hunters, beast lords, storytellers',
    resources: 'Ivory, hides, sun-blessed herbs',
    danger: 'Moderate — megafauna, territorial predators',
  },
  {
    biome: 'tundra',
    label: BIOME_LABELS.tundra,
    description: 'Treeless permafrost where lichen and hardy shrubs survive brief summers before winter returns.',
    climate: 'Frigid, short growing season',
    inhabitants: 'Reindeer herders, ice fishermen, shamans',
    resources: 'Furs, blubber, permafrost minerals',
    danger: 'Moderate — cold, isolation, predators',
  },
  {
    biome: 'river',
    label: BIOME_LABELS.river,
    description: 'Life-giving waterways that carve through the land, connecting settlements and ecosystems.',
    climate: 'Varies by surrounding biome',
    inhabitants: 'River traders, ferrymen, water spirits',
    resources: 'Fish, freshwater, transport routes',
    danger: 'Low — floods, waterborne creatures',
  },
  {
    biome: 'lake',
    label: BIOME_LABELS.lake,
    description: 'Still bodies of freshwater reflecting the sky. Deep lakes hide secrets in their dark depths.',
    climate: 'Calm microclimate',
    inhabitants: 'Lake dwellers, fishermen, nymphs',
    resources: 'Fish, pearls, lake clay',
    danger: 'Low — deep water hazards',
  },
];

export function getBiomeEntry(biome: Biome): BiomeEntry | undefined {
  return BIOME_CODEX.find((e) => e.biome === biome);
}
