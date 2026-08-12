import { useState } from 'react';
import { runDataUpdateCycle, type ResearchCycle } from '../../worldline/researchLoop';

export function RecursiveLoopPanel() {
  const [result, setResult] = useState<ResearchCycle | null>(null);
  return (
    <section className="wl-recursive">
      <div className="wl-panel-header"><div><div className="wl-panel-kicker">RECURSIVE RESEARCH</div><h3>B+ Constitutional Autonomy</h3></div><span className="wl-badge">SANDBOXED</span></div>
      <div className="wl-loop-track">OBSERVE → DETECT → EXPLAIN → CHALLENGE → EXPERIMENT → BUILD → EXECUTE → COMPARE → VERIFY → PROMOTE / REJECT → MONITOR → REALITY WAKE → REOPEN</div>
      <button className="wl-primary" type="button" onClick={() => setResult(runDataUpdateCycle({ previousValue: 10, incomingValue: 14, forceArchitecturalCandidate: true }))}>Run source-conflict research cycle</button>
      {result && <div className="wl-candidate-list">
        <div className="wl-contract"><span>Frozen deciding evaluator</span><code>{result.evaluationContract.id}</code></div>
        <div className="wl-contract"><span>Independent verifier</span><code>{result.verifier.verifierId}</code></div>
        {result.candidates.map((candidate) => <article key={candidate.id} className="wl-candidate"><div><strong>{candidate.hypothesis}</strong><small>{candidate.kind}</small></div><span className={`wl-status ${candidate.status.toLowerCase()}`}>{candidate.status}</span><small>loss {candidate.loss.toFixed(2)} · rollback {candidate.rollbackRef}</small></article>)}
        <p className="wl-reality-wake">{result.realityWakeMessage}</p>
        <p className="wl-help">A candidate cannot replace the evaluator used to decide its own promotion. Architectural and policy candidates remain gated even when they fit the incoming observation.</p>
      </div>}
    </section>
  );
}
