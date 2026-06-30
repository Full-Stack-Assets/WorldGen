import type { RegionInfo } from '../types/world';
import { BIOME_LABELS } from '../lib/colors';
import { elevationToHex } from '../lib/colors';

interface RegionPanelProps {
  region: RegionInfo | null;
  onClose: () => void;
}

export function RegionPanel({ region, onClose }: RegionPanelProps) {
  if (!region) {
    return (
      <div className="region-panel region-panel-empty">
        <div className="empty-state">
          <div className="empty-icon">⬡</div>
          <h3>Explore the World</h3>
          <p>Click anywhere on the 3D terrain to discover regions, settlements, and hidden lore.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="region-panel">
      <div className="region-header">
        <button className="btn-close" onClick={onClose} type="button" aria-label="Close">
          ×
        </button>
        {region.loading ? (
          <div className="loading-pulse">
            <div className="shimmer" />
            <div className="shimmer short" />
          </div>
        ) : (
          <>
            <h2>{region.name}</h2>
            <span className="biome-badge">{BIOME_LABELS[region.biome]}</span>
          </>
        )}
      </div>

      <div className="region-stats">
        <StatBar label="Elevation" value={region.elevation} color={elevationToHex(region.elevation)} />
        <StatBar label="Moisture" value={region.moisture} color="#3b82f6" />
        <StatBar label="Temperature" value={region.temperature} color="#f59e0b" />
      </div>

      <div className="region-coords">
        <span>Coordinates</span>
        <code>({region.x}, {region.y})</code>
      </div>

      {!region.loading && region.description && (
        <div className="region-description">
          <p>{region.description}</p>
          {region.lore && (
            <blockquote className="region-lore">
              <span className="lore-label">Lore</span>
              {region.lore}
            </blockquote>
          )}
          {region.quest && (
            <blockquote className="region-quest">
              <span className="lore-label">Quest Hook</span>
              {region.quest}
            </blockquote>
          )}
        </div>
      )}
    </div>
  );
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="stat-bar">
      <div className="stat-bar-header">
        <span>{label}</span>
        <span>{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="stat-bar-track">
        <div className="stat-bar-fill" style={{ width: `${value * 100}%`, background: color }} />
      </div>
    </div>
  );
}
