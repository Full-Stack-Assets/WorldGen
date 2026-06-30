import type { WorldConfig } from '../types/world';
import { seedToString } from '../lib/worldgen';

interface ControlPanelProps {
  config: WorldConfig;
  generating: boolean;
  onNewSeed: () => void;
  onSetSeed: (seed: string) => void;
  onUpdateConfig: (updates: Partial<WorldConfig>) => void;
  onGenerateLore: () => void;
  loreLoading: boolean;
}

export function ControlPanel({
  config,
  generating,
  onNewSeed,
  onSetSeed,
  onUpdateConfig,
  onGenerateLore,
  loreLoading,
}: ControlPanelProps) {
  return (
    <aside className="control-panel">
      <div className="panel-section">
        <h3>World Seed</h3>
        <div className="seed-row">
          <input
            className="seed-input"
            type="text"
            value={seedToString(config.seed)}
            onChange={(e) => onSetSeed(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSetSeed((e.target as HTMLInputElement).value)}
          />
          <button className="btn btn-primary" onClick={onNewSeed} disabled={generating} type="button">
            New
          </button>
        </div>
        <p className="hint">Share this seed to recreate the same world</p>
      </div>

      <div className="panel-section">
        <h3>Terrain</h3>
        <Slider
          label="Scale"
          value={config.scale}
          min={30}
          max={150}
          step={5}
          onChange={(v) => onUpdateConfig({ scale: v })}
        />
        <Slider
          label="Octaves"
          value={config.octaves}
          min={1}
          max={8}
          step={1}
          onChange={(v) => onUpdateConfig({ octaves: v })}
        />
        <Slider
          label="Sea Level"
          value={config.seaLevel}
          min={0.2}
          max={0.55}
          step={0.01}
          format={(v) => `${(v * 100).toFixed(0)}%`}
          onChange={(v) => onUpdateConfig({ seaLevel: v })}
        />
        <Slider
          label="Persistence"
          value={config.persistence}
          min={0.2}
          max={0.8}
          step={0.05}
          onChange={(v) => onUpdateConfig({ persistence: v })}
        />
      </div>

      <div className="panel-section">
        <h3>Climate</h3>
        <Slider
          label="Moisture"
          value={config.moistureScale}
          min={30}
          max={100}
          step={5}
          onChange={(v) => onUpdateConfig({ moistureScale: v })}
        />
        <Slider
          label="Temperature"
          value={config.temperatureScale}
          min={30}
          max={100}
          step={5}
          onChange={(v) => onUpdateConfig({ temperatureScale: v })}
        />
      </div>

      <div className="panel-section">
        <h3>AI Lore</h3>
        <button
          className="btn btn-accent btn-full"
          onClick={onGenerateLore}
          disabled={loreLoading || generating}
          type="button"
        >
          {loreLoading ? 'Generating...' : 'Generate World Lore'}
        </button>
        <p className="hint">
          Set <code>VITE_GEMINI_API_KEY</code> for AI-powered names and stories
        </p>
      </div>
    </aside>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="slider-control">
      <div className="slider-header">
        <span>{label}</span>
        <span className="slider-value">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </label>
  );
}
