import { useCallback, useMemo, useState } from 'react';
import { WorldScene3D } from './components/three/WorldScene3D';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ControlPanel } from './components/ControlPanel';
import { RegionPanel } from './components/RegionPanel';
import { WorldDashboard } from './components/WorldDashboard';
import { WorldChronicle } from './components/WorldChronicle';
import { PresetGallery } from './components/PresetGallery';
import { SharePanel } from './components/SharePanel';
import { ExportPanel } from './components/ExportPanel';
import { Minimap } from './components/Minimap';
import { HistoryPanel } from './components/HistoryPanel';
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';
import { FirstContact } from './components/worldline/FirstContact';
import { OpenEarthView } from './components/worldline/OpenEarthView';
import { WorldlineShell } from './components/worldline/WorldlineShell';
import { useWorldGenerator } from './hooks/useWorldGenerator';
import { useDayNightCycle } from './hooks/useDayNightCycle';
import { useProStatus } from './hooks/useProStatus';
import { computeWorldStats } from './lib/stats';
import { deriveWeather } from './lib/weather';
import { createEarthRuntimeStatus } from './worldline/earthRuntime';
import { FIRST_CONTACT_STORAGE_KEY, shouldShowFirstContact } from './worldline/firstContact';
import { createProviderRegistry, requestedProviderForWorld, resolveSurfaceProvider } from './worldline/providers';
import { createFlagshipWorldlineState } from './worldline/state';
import type { WorldlineState } from './worldline/types';
import './styles/index.css';

function reducedMotionPreferred(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

function initialFirstContactVisibility(): boolean {
  if (typeof window === 'undefined') return false;
  const seen = window.localStorage.getItem(FIRST_CONTACT_STORAGE_KEY) === 'seen';
  return shouldShowFirstContact({ reducedMotion: reducedMotionPreferred(), seen });
}

export default function App() {
  const {
    config,
    world,
    generating,
    selectedRegion,
    worldLore,
    loreLoading,
    newSeed,
    setSeed,
    updateConfig,
    updateConfigLive,
    selectRegion,
    generateLore,
    clearSelection,
  } = useWorldGenerator();
  const { timeOfDay } = useDayNightCycle();
  const isPro = useProStatus();
  const [worldline, setWorldline] = useState<WorldlineState>(() => createFlagshipWorldlineState());
  const [openEarthFailure, setOpenEarthFailure] = useState<string | null>(null);
  const [firstContactVisible, setFirstContactVisible] = useState(initialFirstContactVisibility);
  const stats = useMemo(() => (world ? computeWorldStats(world) : null), [world]);
  const weather = useMemo(() => (stats ? deriveWeather(stats) : 'clear' as const), [stats]);
  const handleOpenEarthFailure = useCallback((reason: string) => setOpenEarthFailure(reason), []);
  const completeFirstContact = useCallback(() => {
    setFirstContactVisible(false);
    if (typeof window !== 'undefined') window.localStorage.setItem(FIRST_CONTACT_STORAGE_KEY, 'seen');
  }, []);
  const replayFirstContact = useCallback(() => {
    if (!reducedMotionPreferred()) setFirstContactVisible(true);
  }, []);

  const requestedProvider = requestedProviderForWorld(worldline.activeWorld.id);
  const networkAvailable = typeof navigator === 'undefined' ? true : navigator.onLine;
  const activeEarthFailure = requestedProvider === 'open-earth-maplibre' ? openEarthFailure : null;
  const providerRegistry = useMemo(() => createProviderRegistry({
    networkAvailable: networkAvailable && !(requestedProvider === 'open-earth-maplibre' && Boolean(openEarthFailure)),
    localNewBedfordAvailable: true,
    requested: requestedProvider,
  }), [networkAvailable, openEarthFailure, requestedProvider]);
  const providerStatus = resolveSurfaceProvider(providerRegistry, requestedProvider);
  const earthRuntime = createEarthRuntimeStatus(requestedProvider, providerStatus, activeEarthFailure);

  const temporalSnapshots = worldline.timeMode === 'PARALLAX'
    ? [
        { year: Math.max(2026, worldline.selectedYear - 5), offset: -1 },
        { year: worldline.selectedYear, offset: 0 },
        { year: Math.min(2046, worldline.selectedYear + 5), offset: 1 },
      ]
    : [];

  const proceduralScene = (
    <ErrorBoundary fallbackTitle="3D rendering failed">
      <WorldScene3D
        world={world}
        selectedX={selectedRegion?.x}
        selectedY={selectedRegion?.y}
        timeOfDay={timeOfDay}
        weather={weather}
        onSelectRegion={selectRegion}
        temporalSnapshots={temporalSnapshots}
        activeTimeMode={worldline.timeMode}
        showWorldlineTrail
      />
    </ErrorBoundary>
  );

  const scene = worldline.activeWorld.id === 'new-bedford-001' && providerStatus.id === 'open-earth-maplibre'
    ? <ErrorBoundary fallbackTitle="Open Earth rendering failed"><OpenEarthView selectedYear={worldline.selectedYear} timeMode={worldline.timeMode} onFailure={handleOpenEarthFailure} /></ErrorBoundary>
    : proceduralScene;

  const replayControl = <button className="wl-secondary wl-replay-intro" type="button" onClick={replayFirstContact}>Replay First Contact</button>;

  const generatedWorldTools = (
    <div className="wl-legacy-tools">
      {replayControl}
      <PresetGallery disabled={generating} onSelect={(preset) => updateConfig(preset)} />
      <ControlPanel
        config={config}
        generating={generating}
        isPro={isPro}
        onNewSeed={newSeed}
        onSetSeed={setSeed}
        onUpdateConfig={updateConfig}
        onUpdateConfigLive={updateConfigLive}
        onGenerateLore={generateLore}
        loreLoading={loreLoading}
      />
      <HistoryPanel activeSeed={config.seed} onLoad={setSeed} />
      {world && stats && <><Minimap world={world} selectedX={selectedRegion?.x} selectedY={selectedRegion?.y} onSelect={selectRegion} /><WorldDashboard stats={stats} world={world} /></>}
      <RegionPanel region={selectedRegion} onClose={clearSelection} />
      <WorldChronicle lore={worldLore} loading={loreLoading} onGenerate={generateLore} />
      <SharePanel config={config} />
      <ExportPanel world={world} />
    </div>
  );

  const worldTools = worldline.activeWorld.id === 'new-bedford-001'
    ? <div className="wl-real-world-tools">{replayControl}<p>New Bedford World #001 uses the free Open Earth renderer when reachable and a versioned local provenance package for source metadata. Provider failures move to the procedural fallback without changing canonical branch state.</p><button className="wl-secondary" type="button" onClick={() => setOpenEarthFailure(null)}>Retry Open Earth provider</button></div>
    : generatedWorldTools;

  return (
    <>
      <WorldlineShell
        state={worldline}
        onStateChange={setWorldline}
        scene={scene}
        worldTools={worldTools}
        providerStatus={providerStatus}
        earthRuntime={earthRuntime}
      />
      {firstContactVisible && <FirstContact onComplete={completeFirstContact} />}
      <PWAUpdatePrompt />
    </>
  );
}
