import { useState } from 'react';
import { runRecursiveCycle, type RecursiveCycleResult } from '../../worldline/recursive';

export function RecursiveLoopPanel() {
  const [result, setResult] = useState<RecursiveCycleResult | null>(null);
  return (
    <section className="wl-recursive">
      <div className="wl-panel-header"><div><div className="wl-panel-kicker">RECURSIVE ENGINE</div><h3>B+ Constitutional Autonomy</h3></div><span className="wl-badge">SANDBOXED</span></div>
      <div className="wl-loop-track">OBSERVE → DETECT → EXPLAIN → CHALLENGE → EXPERIMENT → BUILD → EXECUTE → COMPARE → VERIFY → PROMOTE / REJECT → MONITOR → REALITY WAKE → REOPEN</div>
      <button className="wl-primary" type="button" onClick={() => setResult(runRecursiveCycle({ baselineScore: 1, observedScore: 0.74, forceArchitecturalCandidate: true }))}>Run verified recursive cycle</button>
      {result && <div className="wl-candidate-list">
        <div className="wl-contract"><span>Frozen deciding contract</span><code>{result.evaluationContract.id}</code></div>
        {result.candidates.map((candidate) => <article key={candidate.id} className="wl-candidate"><div><strong>{candidate.label}</strong><small>{candidate.kind}</small></div><span className={`wl-status ${candidate.status.toLowerCase()}`}>{candidate.status}</span><small>quality {candidate.proposedScore.toFixed(2)} · lineage {candidate.parentObservationId}</small></article>)}
        <p className="wl-help">The candidate generator cannot replace the test used to decide its own promotion. Architectural candidates remain approval-gated.</p>
      </div>}
    </section>
  );
}
