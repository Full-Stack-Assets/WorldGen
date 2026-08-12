import { useEffect, useState } from 'react';
import { loadNewBedfordManifest, type WorldDataManifest } from '../../worldline/provenance';

export function SourceInspector({ worldId }: { worldId: string }) {
  const [manifest, setManifest] = useState<WorldDataManifest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (worldId !== 'new-bedford-001') {
      setManifest(null);
      setError(null);
      return () => { active = false; };
    }
    loadNewBedfordManifest()
      .then((value) => { if (active) { setManifest(value); setError(null); } })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Source package unavailable'); });
    return () => { active = false; };
  }, [worldId]);

  if (worldId !== 'new-bedford-001') return null;
  return (
    <section className="wl-source-inspector">
      <h3>Source & Provenance</h3>
      {error && <p className="wl-help">{error}. No substitute real-city data has been fabricated.</p>}
      {manifest && <>
        <div className="wl-source-summary"><strong>{manifest.packageVersion}</strong><span>{manifest.sources.length} source records · {manifest.snapshots.length} source-time snapshots</span></div>
        <div className="wl-source-list">
          {manifest.sources.map((source) => <article key={source.sourceId}><strong>{source.datasetName}</strong><small>{source.publisher}</small><span>{source.epistemicClass} · {source.resolution}</span><code>{source.sourceId}</code></article>)}
        </div>
      </>}
    </section>
  );
}
