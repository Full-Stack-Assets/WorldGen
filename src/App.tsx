import { useMemo, useState } from 'react';
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
import { WorldlineShell } from './components/worldline/WorldlineShell';
import { useWorldGenerator } from './hooks/useWorldGenerator';
import { useDayNightCycle } from './hooks/useDayNightCycle';
import { useProStatus } from './hooks/useProStatus';
import { computeWorldStats } from './lib/stats';
import { deriveWeather } from './lib/weather';
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
  const stats = useMemo(() => (world ? computeWorldStats(world) : null), [world]);
  const weather = useMemo(() => (stats ? deriveWeather(stats) : 'clear' as const), [stats]);

  const temporalSnapshots = worldline.timeMode === 'PARALLAX'
    ? [
        { year: Math.max(2026, worldline.selectedYear - 5), offset: -1 },
        { year: worldline.selectedYear, offset: 0 },
        { year: Math.min(2046, worldline.selectedYear + 5), offset: 1 },
      ]
    : [];

  const scene = (
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

  const worldTools = (
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

  return (
    <>
      <WorldlineShell state={worldline} onStateChange={setWorldline} scene={scene} worldTools={worldTools} />
      <PWAUpdatePrompt />
    </>
  );
}
