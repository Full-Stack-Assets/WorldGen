import type { WorldConfig } from '../types/world';
import { seedToString } from '../lib/worldgen';
import { ApiKeyInput } from './ApiKeyInput';

interface ControlPanelProps {
  config: WorldConfig;
  generating: boolean;
  isPro: boolean;
  onNewSeed: () => void;
  onSetSeed: (seed: string) => void;
  onUpdateConfig: (updates: Partial<WorldConfig>) => void;
  onUpdateConfigLive: (updates: Partial<WorldConfig>) => void;
  onGenerateLore: () => void;
  loreLoading: boolean;
}

const DETAIL_OPTIONS: { label: string; size: number; pro: boolean }[] = [
  { label: 'Standard', size: 192, pro: false },
  { label: 'High', size: 256, pro: true },
  { label: 'Ultra', size: 320, pro: true },
];

export function ControlPanel({
  config,
  generating,
  isPro,
  onNewSeed,
  onSetSeed,
  onUpdateConfig,
  onUpdateConfigLive,
  onGenerateLore,
  loreLoading,
}: ControlPanelProps) {
  return (
    <div className="control-panel">
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
          onChange={(v) => onUpdateConfigLive({ scale: v })}
        />
        <Slider
          label="Octaves"
          value={config.octaves}
          min={1}
          max={8}
          step={1}
          onChange={(v) => onUpdateConfigLive({ octaves: v })}
        />
        <Slider
          label="Sea Level"
          value={config.seaLevel}
          min={0.2}
          max={0.55}
          step={0.01}
          format={(v) => `${(v * 100).toFixed(0)}%`}
          onChange={(v) => onUpdateConfigLive({ seaLevel: v })}
        />
        <Slider
          label="Persistence"
          value={config.persistence}
          min={0.2}
          max={0.8}
          step={0.05}
          onChange={(v) => onUpdateConfigLive({ persistence: v })}
        />
      </div>

      <div className="panel-section">
        <h3>Detail</h3>
        <div className="detail-row">
          {DETAIL_OPTIONS.map((opt) => {
            const locked = opt.pro && !isPro;
            const active = config.width === opt.size;
            return (
              <button
                key={opt.size}
                type="button"
                className={`detail-btn ${active ? 'active' : ''}`}
                disabled={generating || locked || active}
                onClick={() => onUpdateConfig({ width: opt.size, height: opt.size })}
              >
                {opt.label}
                {locked && <span className="pro-tag">Pro</span>}
              </button>
            );
          })}
        </div>
        <p className="hint">Higher detail generates richer worlds but takes longer.</p>
      </div>

      <div className="panel-section">
        <h3>Climate</h3>
        <Slider
          label="Moisture"
          value={config.moistureScale}
          min={30}
          max={100}
          step={5}
          onChange={(v) => onUpdateConfigLive({ moistureScale: v })}
        />
        <Slider
          label="Temperature"
          value={config.temperatureScale}
          min={30}
          max={100}
          step={5}
          onChange={(v) => onUpdateConfigLive({ temperatureScale: v })}
        />
      </div>

      <div className="panel-section">
        <h3>AI Lore</h3>
        <ApiKeyInput />
        <button
          className="btn btn-accent btn-full"
          onClick={onGenerateLore}
          disabled={loreLoading || generating}
          type="button"
        >
          {loreLoading ? 'Generating...' : 'Generate World Lore'}
        </button>
      </div>
    </div>
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
