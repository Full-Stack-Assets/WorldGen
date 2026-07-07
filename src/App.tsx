import { useState, useMemo } from 'react';
import { WorldScene3D } from './components/three/WorldScene3D';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ControlPanel } from './components/ControlPanel';
import { RegionPanel } from './components/RegionPanel';
import { WorldHeader } from './components/WorldHeader';
import { WorldDashboard } from './components/WorldDashboard';
import { WorldChronicle } from './components/WorldChronicle';
import { PresetGallery } from './components/PresetGallery';
import { SharePanel } from './components/SharePanel';
import { ExportPanel } from './components/ExportPanel';
import { ProPanel } from './components/ProPanel';
import { SupportPanel } from './components/SupportPanel';
import { AffiliatePanel } from './components/AffiliatePanel';
import { AdBanner } from './components/AdBanner';
import { BiomeCodex } from './components/BiomeCodex';
import { TimeControl } from './components/TimeControl';
import { useWorldGenerator } from './hooks/useWorldGenerator';
import { useDayNightCycle } from './hooks/useDayNightCycle';
import { useProStatus } from './hooks/useProStatus';
import { computeWorldStats } from './lib/stats';
import { deriveWeather } from './lib/weather';
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
    selectRegion,
    generateLore,
    clearSelection,
  } = useWorldGenerator();

  const { timeOfDay, autoPlay, setManualTime, toggleAutoPlay } = useDayNightCycle();
  const isPro = useProStatus();

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [showCodex, setShowCodex] = useState(false);
  const [activeTab, setActiveTab] = useState<'controls' | 'atlas' | 'chronicle'>('controls');

  const stats = useMemo(() => (world ? computeWorldStats(world) : null), [world]);
  const weather = useMemo(() => (stats ? deriveWeather(stats) : 'clear' as const), [stats]);

  return (
    <div className="app-3d">
      <ErrorBoundary fallbackTitle="3D rendering failed">
        <WorldScene3D
          world={world}
          selectedX={selectedRegion?.x}
          selectedY={selectedRegion?.y}
          timeOfDay={timeOfDay}
          weather={weather}
          onSelectRegion={selectRegion}
        />
      </ErrorBoundary>

      <div className="hud-overlay">
        <WorldHeader worldLore={worldLore} seed={config.seed} generating={generating} />

        <div className="hud-toolbar">
          <button
            className="hud-btn"
            type="button"
            aria-label={leftOpen ? 'Hide world panel' : 'Show world panel'}
            aria-pressed={leftOpen}
            onClick={() => setLeftOpen((o) => !o)}
          >
            {leftOpen ? '◧' : '◨'} World
          </button>
          <button
            className="hud-btn"
            type="button"
            aria-label={rightOpen ? 'Hide region panel' : 'Show region panel'}
            aria-pressed={rightOpen}
            onClick={() => setRightOpen((o) => !o)}
          >
            {rightOpen ? '◨' : '◧'} Region
          </button>
          <button className="hud-btn" type="button" aria-label="Open biome codex" onClick={() => setShowCodex(true)}>
            Codex
          </button>
          <TimeControl
            timeOfDay={timeOfDay}
            autoPlay={autoPlay}
            onScrub={setManualTime}
            onToggleAutoPlay={toggleAutoPlay}
          />
        </div>

        {leftOpen && (
          <aside className="hud-panel hud-left glass-panel">
            <div className="panel-tabs">
              {(['controls', 'atlas', 'chronicle'] as const).map((tab) => (
                <button
                  key={tab}
                  className={`panel-tab ${activeTab === tab ? 'active' : ''}`}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'controls' ? 'Generate' : tab === 'atlas' ? 'Atlas' : 'Chronicle'}
                </button>
              ))}
            </div>

            <div className="panel-scroll">
              {activeTab === 'controls' && (
                <>
                  <PresetGallery
                    disabled={generating}
                    onSelect={(preset) => updateConfig(preset)}
                  />
                  <ControlPanel
                    config={config}
                    generating={generating}
                    isPro={isPro}
                    onNewSeed={newSeed}
                    onSetSeed={setSeed}
                    onUpdateConfig={updateConfig}
                    onGenerateLore={generateLore}
                    loreLoading={loreLoading}
                  />
                  <SharePanel config={config} />
                  <ExportPanel world={world} />
                  <ProPanel />
                  <SupportPanel />
                  <AffiliatePanel />
                  <AdBanner />
                </>
              )}
              {activeTab === 'atlas' && stats && world && (
                <WorldDashboard stats={stats} world={world} />
              )}
              {activeTab === 'chronicle' && (
                <WorldChronicle lore={worldLore} loading={loreLoading} onGenerate={generateLore} />
              )}
            </div>
          </aside>
        )}

        {rightOpen && (
          <aside className="hud-panel hud-right glass-panel">
            <RegionPanel region={selectedRegion} onClose={clearSelection} />
          </aside>
        )}
      </div>

      {showCodex && (
        <BiomeCodex onClose={() => setShowCodex(false)} highlightBiome={selectedRegion?.biome} />
      )}
    </div>
  );
}
