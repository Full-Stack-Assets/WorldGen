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
import { OpenEarthView } from './components/worldline/OpenEarthView';
import { WorldlineShell } from './components/worldline/WorldlineShell';
import { useWorldGenerator } from './hooks/useWorldGenerator';
import { useDayNightCycle } from './hooks/useDayNightCycle';
import { useProStatus } from './hooks/useProStatus';
import { computeWorldStats } from './lib/stats';
import { deriveWeather } from './lib/weather';
import { createProviderRegistry, requestedProviderForWorld, resolveSurfaceProvider } from './worldline/providers';
import { createInitialWorldlineState } from './worldline/state';
import type { WorldlineState } from './worldline/types';
import './styles/index.css';

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
  const [worldline, setWorldline] = useState<WorldlineState>(() => createInitialWorldlineState());
  const [openEarthFailed, setOpenEarthFailed] = useState(false);
  const stats = useMemo(() => (world ? computeWorldStats(world) : null), [world]);
  const weather = useMemo(() => (stats ? deriveWeather(stats) : 'clear' as const), [stats]);
  const handleOpenEarthFailure = useCallback(() => setOpenEarthFailed(true), []);

  const requestedProvider = requestedProviderForWorld(worldline.activeWorld.id);
  const networkAvailable = typeof navigator === 'undefined' ? true : navigator.onLine;
  const providerRegistry = useMemo(() => createProviderRegistry({
    networkAvailable: networkAvailable && !openEarthFailed,
    localNewBedfordAvailable: true,
    requested: requestedProvider,
  }), [networkAvailable, openEarthFailed, requestedProvider]);
  const providerStatus = resolveSurfaceProvider(providerRegistry, requestedProvider);
  const fallbackActive = requestedProvider !== providerStatus.id;

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

  const generatedWorldTools = (
    <div className="wl-legacy-tools">
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
    ? <div className="wl-real-world-tools"><p>New Bedford World #001 uses the free Open Earth renderer when reachable and a versioned local provenance package for source metadata. The procedural renderer remains the automatic fallback.</p><button className="wl-secondary" type="button" onClick={() => setOpenEarthFailed(false)}>Retry Open Earth provider</button></div>
    : generatedWorldTools;

  return (
    <>
      <WorldlineShell
        state={worldline}
        onStateChange={setWorldline}
        scene={scene}
        worldTools={worldTools}
        providerStatus={providerStatus}
        fallbackActive={fallbackActive}
      />
      <PWAUpdatePrompt />
    </>
  );
}
