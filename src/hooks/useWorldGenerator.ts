import { useCallback, useEffect, useRef, useState } from 'react';
import type { RegionInfo, WorldConfig, WorldData, WorldLore } from '../types/world';
import { DEFAULT_CONFIG } from '../types/world';
import { generateRegionLore, generateWorldLore } from '../lib/gemini';
import { generateWorld, parseSeed, randomSeed } from '../lib/worldgen';

export function useWorldGenerator() {
  const [config, setConfig] = useState<WorldConfig>({ ...DEFAULT_CONFIG, seed: randomSeed() });
  const [world, setWorld] = useState<WorldData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<RegionInfo | null>(null);
  const [worldLore, setWorldLore] = useState<WorldLore | null>(null);
  const [loreLoading, setLoreLoading] = useState(false);
  const workerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const regenerate = useCallback((overrides?: Partial<WorldConfig>) => {
    setGenerating(true);
    const newConfig = { ...config, ...overrides };
    setConfig(newConfig);

    if (workerRef.current) clearTimeout(workerRef.current);
    workerRef.current = setTimeout(() => {
      const data = generateWorld(newConfig);
      setWorld(data);
      setSelectedRegion(null);
      setWorldLore(null);
      setGenerating(false);
    }, 16);
  }, [config]);

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
    if (!world) return;
    const cell = world.cells[y]?.[x];
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

    const lore = await generateRegionLore(region, world);
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
    const params = new URLSearchParams(window.location.search);
    const seedParam = params.get('seed');
    if (seedParam) {
      regenerate({ seed: parseSeed(seedParam) });
      return;
    }
    regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
