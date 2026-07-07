import { useState } from 'react';
import type { WorldData } from '../types/world';
import { downloadScenePng, downloadWorldJson } from '../lib/exportWorld';

interface ExportPanelProps {
  world: WorldData | null;
}

export function ExportPanel({ world }: ExportPanelProps) {
  const [pngFailed, setPngFailed] = useState(false);

  if (!world) return null;

  return (
    <div className="panel-section">
      <h3>Export</h3>
      <div className="export-row">
        <button
          className="btn btn-primary btn-sm"
          type="button"
          onClick={() => setPngFailed(!downloadScenePng(world.seed))}
        >
          Scene PNG
        </button>
        <button className="btn btn-primary btn-sm" type="button" onClick={() => downloadWorldJson(world)}>
          World JSON
        </button>
      </div>
      <p className="hint">
        {pngFailed
          ? 'Screenshot failed — try again after the scene finishes rendering.'
          : 'PNG captures the current view. JSON contains the full world data for use in other tools.'}
      </p>
    </div>
  );
}
