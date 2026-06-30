import type { WorldLore } from '../types/world';

interface WorldHeaderProps {
  worldLore: WorldLore | null;
  seed: number;
  generating?: boolean;
}

export function WorldHeader({ worldLore, seed, generating }: WorldHeaderProps) {
  return (
    <header className="world-header hud-top glass-panel">
      <div className="logo">
        <span className="logo-mark">WG</span>
        <div>
          <h1>{worldLore?.worldName ?? 'WorldGen'}</h1>
          <p className="tagline">
            {worldLore?.tagline ?? 'Procedural 3D worlds · Infinite stories'}
          </p>
        </div>
      </div>
      <div className="header-meta">
        {generating && <span className="status-pill generating">Generating</span>}
        <span className="seed-badge">Seed {seed.toString(36).toUpperCase()}</span>
      </div>
      {worldLore?.history && (
        <div className="world-history">
          <p>{worldLore.history}</p>
        </div>
      )}
    </header>
  );
}
