import { useState } from 'react';
import type { WorldData } from '../types/world';
import { downloadScenePng, downloadWorldJson } from '../lib/exportWorld';
import { downloadBiomeMapPng, downloadHeightmapPng } from '../lib/mapExport';
import { getProConfig } from '../lib/pro';
import { useProStatus } from '../hooks/useProStatus';

interface ExportPanelProps {
  world: WorldData | null;
}

const proConfig = getProConfig();
const proAvailable = Boolean(proConfig.buyUrl || proConfig.licensingAvailable);

export function ExportPanel({ world }: ExportPanelProps) {
  const isPro = useProStatus();
  const [pngFailed, setPngFailed] = useState(false);

  if (!world) return null;

  // Premium exports are only "locked" when Pro is actually purchasable on this
  // deployment; otherwise (self-host with no Pro configured) they're just free.
  const premiumLocked = proAvailable && !isPro;

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

      <div className="export-row export-premium">
        <button
          className="btn btn-primary btn-sm"
          type="button"
          disabled={premiumLocked}
          onClick={() => downloadHeightmapPng(world)}
        >
          Heightmap {premiumLocked && <span className="pro-tag">Pro</span>}
        </button>
        <button
          className="btn btn-primary btn-sm"
          type="button"
          disabled={premiumLocked}
          onClick={() => downloadBiomeMapPng(world)}
        >
          Biome Map {premiumLocked && <span className="pro-tag">Pro</span>}
        </button>
      </div>

      <p className="hint">
        {pngFailed
          ? 'Screenshot failed — try again after the scene finishes rendering.'
          : premiumLocked
            ? 'PNG captures the current view; JSON holds the full world data. Heightmap & biome maps are a Pro feature.'
            : 'Scene PNG and JSON export the current view and full data. Heightmap & biome maps are full-resolution top-down images.'}
      </p>
    </div>
  );
}
