import { useState } from 'react';
import type { Biome, SettlementType, WorldData } from '../types/world';
import { BIOME_LABELS } from '../lib/colors';
import { paintBiome, placeNamedSettlement, type GeneratedWorldTool } from '../lib/worldEdit';

const PAINTABLE: Biome[] = [
  'grassland', 'forest', 'jungle', 'desert', 'savanna', 'tundra', 'snow',
  'mountain', 'volcanic', 'swamp', 'beach', 'ocean', 'lake', 'river',
];

const TYPES: SettlementType[] = ['outpost', 'village', 'town', 'city', 'capital'];

export function GeneratedWorldEditor({
  world,
  selectedX,
  selectedY,
  onChange,
  onSelect,
}: {
  world: WorldData;
  selectedX?: number;
  selectedY?: number;
  onChange: (next: WorldData) => void;
  onSelect: (x: number, y: number) => void;
}) {
  const [tool, setTool] = useState<GeneratedWorldTool>('inspect');
  const [biome, setBiome] = useState<Biome>('forest');
  const [radius, setRadius] = useState(1);
  const [name, setName] = useState('Hearthmere');
  const [type, setType] = useState<SettlementType>('village');

  const apply = () => {
    if (selectedX == null || selectedY == null) return;
    if (tool === 'paint') onChange(paintBiome(world, selectedX, selectedY, biome, radius));
    if (tool === 'settle') onChange(placeNamedSettlement(world, selectedX, selectedY, name, type));
  };

  return (
    <section className="panel-section generated-world-editor">
      <h3>Generated World Editor</h3>
      <p className="wl-help">Edits stay GENERATED. Painting never upgrades a cell to observed geography.</p>
      <div className="wl-segmented">
        {(['inspect', 'paint', 'settle'] as const).map((value) => (
          <button key={value} type="button" className={tool === value ? 'active' : ''} onClick={() => setTool(value)}>
            {value}
          </button>
        ))}
      </div>
      {tool === 'paint' && (
        <>
          <label>
            Biome
            <select value={biome} onChange={(event) => setBiome(event.target.value as Biome)}>
              {PAINTABLE.map((item) => <option key={item} value={item}>{BIOME_LABELS[item]}</option>)}
            </select>
          </label>
          <label>
            Brush {radius}
            <input type="range" min={0} max={4} value={radius} onChange={(event) => setRadius(Number(event.target.value))} />
          </label>
        </>
      )}
      {tool === 'settle' && (
        <>
          <label>
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            Type
            <select value={type} onChange={(event) => setType(event.target.value as SettlementType)}>
              {TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </>
      )}
      <p>
        Target {selectedX == null || selectedY == null ? 'click the terrain' : `${selectedX}, ${selectedY}`}
      </p>
      <div className="wl-forge-actions">
        <button type="button" className="wl-primary" disabled={selectedX == null || tool === 'inspect'} onClick={apply}>
          Apply edit
        </button>
        {world.settlements[0] && (
          <button type="button" className="wl-secondary" onClick={() => onSelect(world.settlements[0].x, world.settlements[0].y)}>
            Jump to {world.settlements[0].name}
          </button>
        )}
      </div>
    </section>
  );
}
