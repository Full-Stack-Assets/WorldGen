import type { WorldData, WorldStats } from '../types/world';
import { BIOME_COLORS, BIOME_LABELS } from '../lib/colors';

interface WorldDashboardProps {
  stats: WorldStats;
  world: WorldData;
}

export function WorldDashboard({ stats, world }: WorldDashboardProps) {
  const topBiomes = (Object.entries(stats.biomeCounts) as [keyof typeof stats.biomeCounts, number][])
    .filter(([b]) => b !== 'ocean' && b !== 'deepOcean')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const maxCount = topBiomes[0]?.[1] ?? 1;

  return (
    <div className="world-dashboard">
      <h3>World Atlas</h3>

      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-value">{stats.landPercent.toFixed(0)}%</span>
          <span className="stat-label">Land</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.oceanPercent.toFixed(0)}%</span>
          <span className="stat-label">Ocean</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{(stats.peakElevation * 100).toFixed(0)}%</span>
          <span className="stat-label">Peak</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.settlementCount}</span>
          <span className="stat-label">Settlements</span>
        </div>
      </div>

      <div className="biome-bars">
        <h4>Biome Distribution</h4>
        {topBiomes.map(([biome, count]) => {
          const [r, g, b] = BIOME_COLORS[biome];
          const pct = (count / maxCount) * 100;
          return (
            <div key={biome} className="biome-bar-row">
              <span className="biome-bar-label">{BIOME_LABELS[biome]}</span>
              <div className="biome-bar-track">
                <div
                  className="biome-bar-fill"
                  style={{ width: `${pct}%`, background: `rgb(${r},${g},${b})` }}
                />
              </div>
              <span className="biome-bar-pct">{((count / (world.config.width * world.config.height)) * 100).toFixed(1)}%</span>
            </div>
          );
        })}
      </div>

      {world.settlements.length > 0 && (
        <div className="settlement-list">
          <h4>Notable Settlements</h4>
          {world.settlements.slice(0, 6).map((s) => (
            <div key={`${s.x}-${s.y}`} className="settlement-row">
              <span className={`settlement-type ${s.type}`}>{s.type}</span>
              <span className="settlement-name">{s.name}</span>
              <span className="settlement-pop">{s.population.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
