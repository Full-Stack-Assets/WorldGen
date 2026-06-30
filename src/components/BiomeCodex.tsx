import { useState } from 'react';
import { BIOME_CODEX } from '../lib/biomeCodex';
import type { Biome } from '../types/world';
import { BIOME_COLORS, BIOME_LABELS } from '../lib/colors';

interface BiomeCodexProps {
  onClose: () => void;
  highlightBiome?: Biome;
}

export function BiomeCodex({ onClose, highlightBiome }: BiomeCodexProps) {
  const [selected, setSelected] = useState(highlightBiome ?? BIOME_CODEX[0].biome);
  const entry = BIOME_CODEX.find((e) => e.biome === selected) ?? BIOME_CODEX[0];
  const [r, g, b] = BIOME_COLORS[entry.biome];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal biome-codex-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Biome Codex</h2>
          <button className="btn-close" type="button" onClick={onClose}>×</button>
        </div>

        <div className="codex-layout">
          <div className="codex-list">
            {BIOME_CODEX.map((e) => {
              const [cr, cg, cb] = BIOME_COLORS[e.biome];
              return (
                <button
                  key={e.biome}
                  className={`codex-item ${selected === e.biome ? 'active' : ''}`}
                  type="button"
                  onClick={() => setSelected(e.biome)}
                >
                  <span className="codex-swatch" style={{ background: `rgb(${cr},${cg},${cb})` }} />
                  {BIOME_LABELS[e.biome]}
                </button>
              );
            })}
          </div>

          <div className="codex-detail">
            <div className="codex-banner" style={{ background: `linear-gradient(135deg, rgb(${r},${g},${b}), rgba(${r},${g},${b},0.3))` }}>
              <h3>{entry.label}</h3>
            </div>
            <p className="codex-desc">{entry.description}</p>
            <div className="codex-attrs">
              <div><strong>Climate</strong><p>{entry.climate}</p></div>
              <div><strong>Inhabitants</strong><p>{entry.inhabitants}</p></div>
              <div><strong>Resources</strong><p>{entry.resources}</p></div>
              <div><strong>Danger Level</strong><p>{entry.danger}</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
