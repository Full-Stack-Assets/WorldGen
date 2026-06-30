import { useState } from 'react';
import type { WorldConfig } from '../types/world';
import { buildShareUrl, copyToClipboard } from '../lib/share';
import { seedToString } from '../lib/worldgen';

interface SharePanelProps {
  config: WorldConfig;
}

export function SharePanel({ config }: SharePanelProps) {
  const [copied, setCopied] = useState(false);
  const url = buildShareUrl(config);

  const handleCopy = async () => {
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="share-panel">
      <h3>Share World</h3>
      <p className="hint">Anyone with this link will see the same world.</p>
      <div className="share-url-row">
        <input className="seed-input" type="text" readOnly value={url} />
        <button className="btn btn-primary btn-sm" type="button" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className="share-seed">Seed: <code>{seedToString(config.seed)}</code></p>
    </div>
  );
}
