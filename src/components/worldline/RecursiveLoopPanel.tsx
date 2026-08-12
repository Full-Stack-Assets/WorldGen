import { useState } from 'react';
import { appendReopenRecord, appendResearchCycle, createResearchLedger, type ResearchLedger } from '../../worldline/researchLedger';
import { reopenResearchDecision, runDataUpdateCycle, type ResearchCycle } from '../../worldline/researchLoop';
import { loadResearchLedger, resetResearchLedger, saveResearchLedger } from '../../worldline/researchStorage';
import { ResearchPanel } from './ResearchPanel';

function initialResearchState(): { ledger: ResearchLedger; warning: string | null } {
  if (typeof window === 'undefined') return { ledger: createResearchLedger(), warning: null };
  return loadResearchLedger(window.localStorage);
}

export function RecursiveLoopPanel() {
  const initial = initialResearchState();
  const [result, setResult] = useState<ResearchCycle | null>(null);
  const [ledger, setLedger] = useState<ResearchLedger>(initial.ledger);
  const [warning, setWarning] = useState<string | null>(initial.warning);

  const persist = (next: ResearchLedger) => {
    setLedger(next);
    if (typeof window !== 'undefined') saveResearchLedger(window.localStorage, next);
  };

  const runCycle = () => {
    const cycle = runDataUpdateCycle({ previousValue: 10, incomingValue: 14, forceArchitecturalCandidate: true });
    setResult(cycle);
    persist(appendResearchCycle(ledger, cycle));
  };

  const reopen = () => {
    if (!result) return;
    const reopened = reopenResearchDecision(result, 'Later evidence contradicted the promoted reconciliation.', 'source-update-14-9');
    persist(appendReopenRecord(ledger, result.observationId, reopened.reopen));
    setWarning('A prior research decision was reopened. Earlier receipts remain preserved.');
  };

  const importLedger = (next: ResearchLedger) => {
    persist(next);
    setWarning(null);
  };

  const reset = () => {
    if (typeof window !== 'undefined') resetResearchLedger(window.localStorage);
    setLedger(createResearchLedger());
    setResult(null);
    setWarning('Local research history was explicitly reset.');
  };

  return (
    <section className="wl-recursive">
      <div className="wl-panel-header"><div><div className="wl-panel-kicker">RECURSIVE RESEARCH</div><h3>B+ Constitutional Autonomy</h3></div><span className="wl-badge">SANDBOXED</span></div>
      <div className="wl-loop-track">OBSERVE → DETECT → EXPLAIN → CHALLENGE → EXPERIMENT → BUILD → EXECUTE → COMPARE → VERIFY → PROMOTE / REJECT → MONITOR → REALITY WAKE → REOPEN</div>
      <button className="wl-primary" type="button" onClick={runCycle}>Run source-conflict research cycle</button>
      {result && <div className="wl-candidate-list">
        <div className="wl-contract"><span>Frozen deciding evaluator</span><code>{result.evaluationContract.id}</code></div>
        <div className="wl-contract"><span>Independent verifier</span><code>{result.verifier.verifierId}</code></div>
        {result.candidates.map((candidate) => <article key={candidate.id} className="wl-candidate"><div><strong>{candidate.hypothesis}</strong><small>{candidate.kind}</small></div><span className={`wl-status ${candidate.status.toLowerCase()}`}>{candidate.status}</span><small>loss {candidate.loss.toFixed(2)} · rollback {candidate.rollbackRef}</small></article>)}
        <p className="wl-reality-wake">{result.realityWake.message}</p>
        <button type="button" className="wl-secondary" onClick={reopen}>Reopen with contradicting evidence</button>
        <p className="wl-help">The candidate generator cannot replace the evaluator used to decide its own promotion. Architectural and policy candidates remain gated even when they fit the incoming observation.</p>
      </div>}
      <ResearchPanel ledger={ledger} warning={warning} onImport={importLedger} onReset={reset} />
    </section>
  );
}
