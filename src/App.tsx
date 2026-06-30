import { useState, useMemo } from 'react';
import { WorldScene3D } from './components/three/WorldScene3D';
import { ControlPanel } from './components/ControlPanel';
import { RegionPanel } from './components/RegionPanel';
import { WorldHeader } from './components/WorldHeader';
import { WorldDashboard } from './components/WorldDashboard';
import { WorldChronicle } from './components/WorldChronicle';
import { PresetGallery } from './components/PresetGallery';
import { SharePanel } from './components/SharePanel';
import { BiomeCodex } from './components/BiomeCodex';
import { useWorldGenerator } from './hooks/useWorldGenerator';
import { computeWorldStats } from './lib/stats';
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

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [showCodex, setShowCodex] = useState(false);
  const [activeTab, setActiveTab] = useState<'controls' | 'atlas' | 'chronicle'>('controls');

  const stats = useMemo(() => (world ? computeWorldStats(world) : null), [world]);

  return (
    <div className="app-3d">
      <WorldScene3D
        world={world}
        selectedX={selectedRegion?.x}
        selectedY={selectedRegion?.y}
        onSelectRegion={selectRegion}
      />

      <div className="hud-overlay">
        <WorldHeader worldLore={worldLore} seed={config.seed} generating={generating} />

        <div className="hud-toolbar">
          <button className="hud-btn" type="button" onClick={() => setLeftOpen((o) => !o)}>
            {leftOpen ? '◧' : '◨'} World
          </button>
          <button className="hud-btn" type="button" onClick={() => setRightOpen((o) => !o)}>
            {rightOpen ? '◨' : '◧'} Region
          </button>
          <button className="hud-btn" type="button" onClick={() => setShowCodex(true)}>
            Codex
          </button>
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
                    onNewSeed={newSeed}
                    onSetSeed={setSeed}
                    onUpdateConfig={updateConfig}
                    onGenerateLore={generateLore}
                    loreLoading={loreLoading}
                  />
                  <SharePanel config={config} />
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
