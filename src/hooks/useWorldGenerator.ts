import { useCallback, useEffect, useRef, useState } from 'react';
import type { RegionInfo, WorldConfig, WorldData, WorldLore } from '../types/world';
import { DEFAULT_CONFIG } from '../types/world';
import { generateRegionLore, generateWorldLore } from '../lib/gemini';
import { generateWorld, parseSeed, randomSeed } from '../lib/worldgen';
import { parseShareParams } from '../lib/share';

function getInitialSeed(): number {
  const params = new URLSearchParams(window.location.search);
  const seedParam = params.get('seed');
  if (seedParam) return parseSeed(seedParam);
  return randomSeed();
}

function getInitialConfig(): WorldConfig {
  const seed = getInitialSeed();
  const shared = parseShareParams();
  const isMobile = window.matchMedia('(max-width: 1100px)').matches;
  const size = isMobile ? 128 : 192;
  return { ...DEFAULT_CONFIG, seed, width: size, height: size, ...shared };
}

export function useWorldGenerator() {
  const [config, setConfig] = useState<WorldConfig>(() => getInitialConfig());
  const [world, setWorld] = useState<WorldData | null>(null);
  const [generating, setGenerating] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<RegionInfo | null>(null);
  const [worldLore, setWorldLore] = useState<WorldLore | null>(null);
  const [loreLoading, setLoreLoading] = useState(false);
  const configRef = useRef(config);
  configRef.current = config;

  const regenerate = useCallback((overrides?: Partial<WorldConfig>) => {
    const newConfig = { ...configRef.current, ...overrides };
    setConfig(newConfig);
    setGenerating(true);

    requestAnimationFrame(() => {
      try {
        const data = generateWorld(newConfig);
        setWorld(data);
        setSelectedRegion(null);
        setWorldLore(null);
      } finally {
        setGenerating(false);
      }
    });
  }, []);

  const newSeed = useCallback(() => {
    regenerate({ seed: randomSeed() });
  }, [regenerate]);

  const setSeed = useCallback((seedStr: string) => {
    regenerate({ seed: parseSeed(seedStr) });
  }, [regenerate]);

  const updateConfig = useCallback((updates: Partial<WorldConfig>) => {
    regenerate(updates);
  }, [regenerate]);

  const selectRegion = useCallback(async (x: number, y: number) => {
    const currentWorld = world;
    if (!currentWorld) return;
    const cell = currentWorld.cells[y]?.[x];
    if (!cell) return;

    const region: RegionInfo = {
      x,
      y,
      biome: cell.biome,
      elevation: cell.elevation,
      moisture: cell.moisture,
      temperature: cell.temperature,
      loading: true,
    };

    setSelectedRegion(region);

    const lore = await generateRegionLore(region, currentWorld);
    setSelectedRegion({ ...region, ...lore, loading: false });
  }, [world]);

  const generateLore = useCallback(async () => {
    if (!world) return;
    setLoreLoading(true);
    const lore = await generateWorldLore(world);
    setWorldLore(lore);
    setLoreLoading(false);
  }, [world]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  return {
    config,
    world,
    generating,
    selectedRegion,
    worldLore,
    loreLoading,
    regenerate,
    newSeed,
    setSeed,
    updateConfig,
    selectRegion,
    generateLore,
    clearSelection: () => setSelectedRegion(null),
  };
}
