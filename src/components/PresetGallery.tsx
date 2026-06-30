import type { WorldConfig } from '../types/world';
import { WORLD_PRESETS } from '../lib/presets';

interface PresetGalleryProps {
  onSelect: (config: Partial<WorldConfig>) => void;
  disabled?: boolean;
}

export function PresetGallery({ onSelect, disabled }: PresetGalleryProps) {
  return (
    <div className="preset-gallery">
      <h3>World Presets</h3>
      <div className="preset-grid">
        {WORLD_PRESETS.map((preset) => (
          <button
            key={preset.id}
            className="preset-card"
            type="button"
            disabled={disabled}
            onClick={() => onSelect(preset.config)}
          >
            <span className="preset-icon">{preset.icon}</span>
            <span className="preset-name">{preset.name}</span>
            <span className="preset-desc">{preset.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
