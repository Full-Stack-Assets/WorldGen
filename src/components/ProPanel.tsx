import { useState } from 'react';
import { clearLicense, getProConfig, verifyLicense, type VerifyResult } from '../lib/pro';
import { useProStatus } from '../hooks/useProStatus';

const config = getProConfig();

export function ProPanel() {
  const isPro = useProStatus();
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  if (isPro) {
    return (
      <div className="panel-section pro-panel pro-active">
        <h3>WorldGen Pro ✦</h3>
        <p className="hint">Pro is active — ads are off and every premium feature is unlocked. Thank you!</p>
        <button className="btn btn-sm" type="button" onClick={clearLicense}>
          Deactivate on this device
        </button>
      </div>
    );
  }

  // Nothing to sell if neither a buy link nor licensing is configured.
  if (!config.buyUrl && !config.licensingAvailable) return null;

  const handleVerify = async () => {
    setBusy(true);
    setResult(await verifyLicense(key));
    setBusy(false);
  };

  return (
    <div className="panel-section pro-panel">
      <h3>WorldGen Pro ✦</h3>
      <ul className="pro-features">
        <li>Ad-free experience</li>
        <li>Ultra-detail worlds</li>
        <li>Heightmap &amp; biome-map exports</li>
      </ul>
      {config.buyUrl && (
        <a className="btn btn-accent btn-full pro-buy-btn" href={config.buyUrl} target="_blank" rel="noopener noreferrer">
          ✦ Get WorldGen Pro
        </a>
      )}
      {config.licensingAvailable && (
        <>
          <div className="pro-key-row">
            <input
              className="seed-input"
              type="text"
              placeholder="License key"
              aria-label="Pro license key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !busy && handleVerify()}
            />
            <button className="btn btn-primary btn-sm" type="button" onClick={handleVerify} disabled={busy}>
              {busy ? '…' : 'Unlock'}
            </button>
          </div>
          {result && <p className={`pro-msg ${result.ok ? 'ok' : 'err'}`}>{result.message}</p>}
          <p className="hint">Already bought Pro? Paste the license key from your receipt.</p>
        </>
      )}
    </div>
  );
}
