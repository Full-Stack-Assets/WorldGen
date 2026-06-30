import type { WorldPreset } from '../types/world';

export const WORLD_PRESETS: WorldPreset[] = [
  {
    id: 'classic',
    name: 'Classic World',
    description: 'Balanced continents, varied biomes, and natural rivers.',
    icon: '🌍',
    config: { scale: 80, seaLevel: 0.38, octaves: 6, moistureScale: 60, temperatureScale: 70 },
  },
  {
    id: 'archipelago',
    name: 'Archipelago',
    description: 'Scattered islands rising from endless turquoise seas.',
    icon: '🏝️',
    config: { scale: 55, seaLevel: 0.52, octaves: 5, moistureScale: 75, temperatureScale: 80 },
  },
  {
    id: 'pangaea',
    name: 'Pangaea',
    description: 'One massive supercontinent wrapped around a world ocean.',
    icon: '🗿',
    config: { scale: 120, seaLevel: 0.28, octaves: 4, moistureScale: 55, temperatureScale: 65 },
  },
  {
    id: 'desert',
    name: 'Scorched Expanse',
    description: 'Sun-baked dunes, savannas, and precious oases.',
    icon: '☀️',
    config: { scale: 70, seaLevel: 0.32, moistureScale: 35, temperatureScale: 95, persistence: 0.55 },
  },
  {
    id: 'frozen',
    name: 'Frozen Age',
    description: 'Glaciers, tundra, and snow-capped peaks dominate the land.',
    icon: '❄️',
    config: { scale: 90, seaLevel: 0.35, temperatureScale: 35, moistureScale: 50, octaves: 7 },
  },
  {
    id: 'volcanic',
    name: 'Volcanic Rim',
    description: 'Fiery peaks, ash plains, and unstable tectonic chaos.',
    icon: '🌋',
    config: { scale: 65, seaLevel: 0.4, octaves: 8, persistence: 0.65, lacunarity: 2.2, temperatureScale: 85 },
  },
  {
    id: 'lush',
    name: 'Verdant Eden',
    description: 'Dense jungles, ancient forests, and misty swamplands.',
    icon: '🌿',
    config: { scale: 75, seaLevel: 0.36, moistureScale: 90, temperatureScale: 75, octaves: 6 },
  },
  {
    id: 'alien',
    name: 'Alien World',
    description: 'Chaotic terrain with extreme elevation and wild climate.',
    icon: '👽',
    config: { scale: 45, seaLevel: 0.42, octaves: 8, persistence: 0.7, lacunarity: 2.5, moistureScale: 80, temperatureScale: 80 },
  },
];
