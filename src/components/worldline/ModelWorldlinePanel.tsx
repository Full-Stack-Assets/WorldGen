import { deriveModelWorldline } from '../../worldline/modelWorldline';
import type { ResearchLedger } from '../../worldline/researchLedger';

export function ModelWorldlinePanel({ ledger }: { ledger: ResearchLedger }) {
  const graph = deriveModelWorldline(ledger);
  if (graph.nodes.length === 0) return <p className="wl-help">No research lineage has been recorded yet.</p>;
  return (
    <section className="wl-model-worldline" aria-label="Model Worldline">
      <div className="wl-panel-kicker">MODEL WORLDLINE</div>
      <div className="wl-model-nodes">
        {graph.nodes.map((node) => (
          <article key={node.id} className={`wl-model-node wl-model-${node.kind.toLowerCase()}`}>
            <div><strong>{node.kind}</strong><span>{node.status}</span></div>
            <p>{node.label}</p>
            {node.parentIds.length > 0 && <small>from {node.parentIds.join(', ')}</small>}
          </article>
        ))}
      </div>
      <small className="wl-model-edge-count">{graph.edges.length} verified lineage links</small>
    </section>
  );
}
