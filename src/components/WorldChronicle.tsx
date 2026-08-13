import type { WorldLore } from '../types/world';
import { downloadWorldBible } from '../lib/loreBible';

interface WorldChronicleProps {
  lore: WorldLore | null;
  loading: boolean;
  onGenerate: () => void;
}

export function WorldChronicle({ lore, loading, onGenerate }: WorldChronicleProps) {
  if (!lore) {
    return (
      <div className="world-chronicle empty">
        <h3>World Chronicle</h3>
        <p>Generate a rich world bible with history, factions, eras, and mythology.</p>
        <button className="btn btn-accent btn-full" type="button" onClick={onGenerate} disabled={loading}>
          {loading ? 'Weaving the chronicle...' : 'Generate Chronicle'}
        </button>
      </div>
    );
  }

  return (
    <div className="world-chronicle">
      <h3>World Chronicle</h3>

      {lore.mythology && (
        <div className="chronicle-block mythology">
          <h4>Mythology</h4>
          <p>{lore.mythology}</p>
        </div>
      )}

      {lore.eras.length > 0 && (
        <div className="chronicle-block">
          <h4>Ages of History</h4>
          <div className="era-timeline">
            {lore.eras.map((era) => (
              <div key={era.name} className="era-item">
                <div className="era-header">
                  <strong>{era.name}</strong>
                  <span className="era-years">{era.years}</span>
                </div>
                <p>{era.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {lore.factions.length > 0 && (
        <div className="chronicle-block">
          <h4>Factions & Powers</h4>
          {lore.factions.map((f) => (
            <div key={f.name} className="faction-card">
              <div className="faction-header">
                <strong>{f.name}</strong>
                <em>"{f.motto}"</em>
              </div>
              <p>{f.description}</p>
              <span className="faction-territory">Territory: {f.territory}</span>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-ghost btn-sm" type="button" onClick={onGenerate} disabled={loading}>
        {loading ? 'Regenerating...' : 'Regenerate Chronicle'}
      </button>
      <button className="btn btn-ghost btn-sm" type="button" onClick={() => downloadWorldBible(lore)}>
        Export world bible
      </button>
    </div>
  );
}
