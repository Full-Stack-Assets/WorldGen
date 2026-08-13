import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RegionInfo, WorldConfig, WorldData, WorldLore } from '../types/world';
import { DEFAULT_CONFIG } from '../types/world';
import { generateRegionLore, generateWorldLore } from '../lib/gemini';
import { parseSeed, randomSeed } from '../lib/worldgen';
import { generateWorldAsync } from '../lib/worldGenService';
import { historyEntryToConfig, recordWorld, type HistoryEntry } from '../lib/history';
import { debounce } from '../lib/debounce';
import { parseShareParams } from '../lib/share';

const REGEN_DEBOUNCE_MS = 220;

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
  // Monotonic token: only the most recent generation result is applied, so
  // rapid config changes can't race a slow (worker) result onto a newer world.
  const requestRef = useRef(0);

  const runGenerate = useCallback((cfg: WorldConfig) => {
    const token = ++requestRef.current;
    generateWorldAsync(cfg).then((data) => {
      if (token !== requestRef.current) return; // superseded by a newer request
      setWorld(data);
      setSelectedRegion(null);
      setWorldLore(null);
      setGenerating(false);
      recordWorld(data.config);
    });
  }, []);

  // Slider drags fire continuously; debounce the (expensive) generation so only
  // the settled value regenerates, while config state updates immediately for a
  // responsive UI.
  const debouncedGenerate = useMemo(() => debounce(runGenerate, REGEN_DEBOUNCE_MS), [runGenerate]);

  const regenerate = useCallback((overrides?: Partial<WorldConfig>) => {
    const newConfig = { ...configRef.current, ...overrides };
    setConfig(newConfig);
    setGenerating(true);
    debouncedGenerate.cancel(); // an explicit regenerate pre-empts any pending debounce
    runGenerate(newConfig);
  }, [runGenerate, debouncedGenerate]);

  const newSeed = useCallback(() => {
    regenerate({ seed: randomSeed() });
  }, [regenerate]);

  const setSeed = useCallback((seedStr: string) => {
    regenerate({ seed: parseSeed(seedStr) });
  }, [regenerate]);

  const loadHistoryEntry = useCallback((entry: HistoryEntry) => {
    regenerate(historyEntryToConfig(entry));
  }, [regenerate]);

  // Immediate regeneration for discrete changes (presets, detail, seed).
  const updateConfig = useCallback((updates: Partial<WorldConfig>) => {
    regenerate(updates);
  }, [regenerate]);

  // Debounced regeneration for continuous changes (slider drags).
  const updateConfigLive = useCallback((updates: Partial<WorldConfig>) => {
    const newConfig = { ...configRef.current, ...updates };
    setConfig(newConfig);
    setGenerating(true);
    debouncedGenerate(newConfig);
  }, [debouncedGenerate]);

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

  const applyWorldEdit = useCallback((next: WorldData) => {
    setWorld(next);
  }, []);

  useEffect(() => {
    regenerate();
    return () => debouncedGenerate.cancel();
  }, [regenerate, debouncedGenerate]);

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
    loadHistoryEntry,
    updateConfig,
    updateConfigLive,
    selectRegion,
    generateLore,
    clearSelection: () => setSelectedRegion(null),
    applyWorldEdit,
    setWorldLore,
  };
}
