import { ControlPanel } from './components/ControlPanel';
import { RegionPanel } from './components/RegionPanel';
import { WorldCanvas } from './components/WorldCanvas';
import { WorldHeader } from './components/WorldHeader';
import { BiomeLegend } from './components/BiomeLegend';
import { useWorldGenerator } from './hooks/useWorldGenerator';
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

  return (
    <div className="app">
      <WorldHeader worldLore={worldLore} seed={config.seed} />

      <main className="main-layout">
        <ControlPanel
          config={config}
          generating={generating}
          onNewSeed={newSeed}
          onSetSeed={setSeed}
          onUpdateConfig={updateConfig}
          onGenerateLore={generateLore}
          loreLoading={loreLoading}
        />

        <section className="map-section">
          <div className="map-container">
            {generating && !world && <div className="generating-overlay">Generating world...</div>}
            <WorldCanvas
              world={world}
              onSelectRegion={selectRegion}
              selectedX={selectedRegion?.x}
              selectedY={selectedRegion?.y}
            />
          </div>
          <BiomeLegend />
        </section>

        <RegionPanel region={selectedRegion} onClose={clearSelection} />
      </main>
    </div>
  );
}
