import type { ExperimentSession } from '../../worldline/experiments';

export function ExperimentHistory({ experiments }: { experiments: ExperimentSession[] }) {
  const ordered = [...experiments].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
  return (
    <section className="wl-studio-history" aria-label="Experiment History">
      <div className="wl-panel-header">
        <div>
          <div className="wl-panel-kicker">RUNS</div>
          <h3>Experiment History</h3>
        </div>
        <span className="wl-badge">{ordered.length}</span>
      </div>
      {ordered.length === 0 ? (
        <p className="wl-help">No Studio experiments yet. Add a scenario input or run the baseline to create a deterministic receipt.</p>
      ) : (
        <div className="wl-experiment-list">
          {ordered.map((experiment) => (
            <article key={experiment.id} className="wl-experiment-card">
              <div><strong>{experiment.year}</strong><span>{experiment.branchId}</span></div>
              <small>{experiment.inputFingerprint}</small>
              <div className="wl-experiment-metrics">
                {Object.entries(experiment.resultMetrics).sort(([a], [b]) => a.localeCompare(b)).slice(0, 4).map(([metric, value]) => (
                  <span key={metric}>{metric} <strong>{value.toLocaleString()}</strong></span>
                ))}
              </div>
              <small>{experiment.interventionIds.length} intervention{experiment.interventionIds.length === 1 ? '' : 's'} · seed {experiment.seed}</small>
            </article>
          ))}
        </div>
      )}
      <p className="wl-help">Run receipts describe deterministic scenario experiments, not likelihood or calibrated probability.</p>
    </section>
  );
}
