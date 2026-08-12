import { useRef, type ChangeEvent } from 'react';
import { parseResearchLedger, serializeResearchLedger, type ResearchLedger } from '../../worldline/researchLedger';
import { ModelWorldlinePanel } from './ModelWorldlinePanel';

export function ResearchPanel({
  ledger,
  warning,
  onImport,
  onReset,
}: {
  ledger: ResearchLedger;
  warning: string | null;
  onImport: (ledger: ResearchLedger) => void;
  onReset: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cycles = ledger.entries.filter((entry) => entry.kind === 'OBSERVATION').length;
  const promotions = ledger.entries.filter((entry) => entry.kind === 'PROMOTION');
  const latestPromotion = promotions[promotions.length - 1];

  const exportLedger = () => {
    const blob = new Blob([serializeResearchLedger(ledger)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'worldline-research-ledger-v0.5.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importLedger = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    onImport(parseResearchLedger(text));
    event.target.value = '';
  };

  return (
    <section className="wl-research-panel" aria-label="Discovery Engine research ledger">
      <div className="wl-panel-header">
        <div><div className="wl-panel-kicker">DISCOVERY ENGINE</div><h3>Durable Research Ledger</h3></div>
        <span className="wl-badge">{cycles} cycles</span>
      </div>
      {warning && <p className="wl-research-warning">{warning}</p>}
      <div className="wl-research-summary">
        <span><b>ENTRIES</b>{ledger.entries.length}</span>
        <span><b>LAST DECISION</b>{latestPromotion?.kind === 'PROMOTION' ? latestPromotion.status : 'NONE'}</span>
      </div>
      <div className="wl-research-actions">
        <button type="button" className="wl-secondary" onClick={exportLedger} disabled={ledger.entries.length === 0}>Export ledger</button>
        <button type="button" className="wl-secondary" onClick={() => inputRef.current?.click()}>Import ledger</button>
        <button type="button" className="wl-secondary wl-danger" onClick={onReset}>Reset local history</button>
        <input ref={inputRef} hidden type="file" accept="application/json,.json" onChange={importLedger} aria-label="Import research ledger" />
      </div>
      <ModelWorldlinePanel ledger={ledger} />
    </section>
  );
}
