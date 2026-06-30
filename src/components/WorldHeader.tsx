import type { WorldLore } from '../types/world';

interface WorldHeaderProps {
  worldLore: WorldLore | null;
  seed: number;
}

export function WorldHeader({ worldLore, seed }: WorldHeaderProps) {
  return (
    <header className="world-header">
      <div className="logo">
        <span className="logo-icon">🌍</span>
        <div>
          <h1>{worldLore?.worldName ?? 'WorldGen'}</h1>
          <p className="tagline">
            {worldLore?.tagline ?? 'Procedural worlds, infinite stories'}
          </p>
        </div>
      </div>
      <div className="header-meta">
        <span className="seed-badge">Seed: {seed.toString(36).toUpperCase()}</span>
      </div>
      {worldLore?.history && (
        <div className="world-history">
          <p>{worldLore.history}</p>
        </div>
      )}
    </header>
  );
}
