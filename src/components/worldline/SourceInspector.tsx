import { useEffect, useMemo, useState } from 'react';
import { loadNewBedfordManifest, type WorldDataManifest } from '../../worldline/provenance';
import { getSourceTimelineForWorld } from '../../worldline/sourceTimeline';

export function SourceInspector({ worldId }: { worldId: string }) {
  const [manifest, setManifest] = useState<WorldDataManifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timeline = useMemo(() => getSourceTimelineForWorld(worldId), [worldId]);

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
      <h3>Source-Time History</h3>
      <div className="wl-source-list">
        {timeline.map((entry) => <article key={entry.id}><strong>{entry.year} · {entry.label}</strong><span>{entry.epistemicClass}</span><small>{entry.note}</small></article>)}
      </div>
      <p className="wl-help">No live municipal operations feed is attached in v0.3. These entries describe packaged evidence snapshots and reconstruction state, not continuous observation.</p>
    </section>
  );
}
