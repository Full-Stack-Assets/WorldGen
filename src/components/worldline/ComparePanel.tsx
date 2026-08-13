import type { ExperimentSession } from '../../worldline/experiments';
import { buildFutureFamilies } from '../../worldline/futureFamilies';
import { compareSnapshots } from '../../worldline/state';
import type { SnapshotDifference, WorldlineState } from '../../worldline/types';

function compareMetricRecords(left: Record<string, number>, right: Record<string, number>): SnapshotDifference[] {
  const keys = Array.from(new Set([...Object.keys(left), ...Object.keys(right)])).sort();
  return keys.map((metric) => {
    const leftValue = left[metric] ?? 0;
    const rightValue = right[metric] ?? 0;
    return { metric, left: leftValue, right: rightValue, delta: rightValue - leftValue };
  });
}

export function ComparePanel({
  state,
  experiments = [],
  selectedExperimentId = null,
  onSelectExperiment,
}: {
  state: WorldlineState;
  experiments?: ExperimentSession[];
  selectedExperimentId?: string | null;
  onSelectExperiment?: (experimentId: string | null) => void;
}) {
  const branches = Object.values(state.branches);
  const left = branches[0]?.snapshots.at(-1);
  const right = branches.find((branch) => branch.id === state.activeBranchId)?.snapshots.at(-1) ?? left;
  const differences = left && right ? compareSnapshots(left, right) : [];
  const relevantExperiments = experiments
    .filter((item) => item.worldId === state.activeWorld.id && item.branchId === state.activeBranchId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
  const selectedExperiment = relevantExperiments.find((item) => item.id === selectedExperimentId) ?? relevantExperiments[0] ?? null;
  const experimentDifferences = selectedExperiment
    ? compareMetricRecords(selectedExperiment.baselineMetrics, selectedExperiment.resultMetrics)
    : [];
  const families = buildFutureFamilies(relevantExperiments.map((item) => ({ id: item.id, resultMetrics: item.resultMetrics })));
  const selectedFamily = selectedExperiment
    ? families.find((family) => family.memberIds.includes(selectedExperiment.id)) ?? null
    : null;

  return (
    <section className="wl-panel glass-panel">
      <div className="wl-panel-kicker">COMPARE</div>
      <h2>Difference Lens</h2>
      <div className="wl-compare-grid">
        {differences.map((difference) => (
          <div className="wl-metric" key={difference.metric}>
            <span>{difference.metric}</span>
            <strong>{difference.delta > 0 ? '+' : ''}{difference.delta.toLocaleString()}</strong>
            <small>{difference.left.toLocaleString()} → {difference.right.toLocaleString()}</small>
          </div>
        ))}
      </div>
      <p className="wl-help">Branch comparison is computed from committed snapshots. Visual emphasis does not alter underlying branch states.</p>

      <section className="wl-studio-compare" aria-label="Studio Experiment comparison">
        <div className="wl-panel-header">
          <div>
            <div className="wl-panel-kicker">STUDIO EXPERIMENT</div>
            <h3>Baseline → Scenario Result</h3>
          </div>
          {selectedFamily && <span className="wl-badge wl-studio-family">{selectedFamily.label} · {selectedFamily.divergenceBand}</span>}
        </div>
        {relevantExperiments.length > 0 && (
          <label className="wl-studio-experiment-picker">
            <span>Experiment</span>
            <select
              aria-label="Select Studio experiment"
              value={selectedExperiment?.id ?? ''}
              onChange={(event) => onSelectExperiment?.(event.target.value || null)}
            >
              {relevantExperiments.map((experiment) => (
                <option key={experiment.id} value={experiment.id}>{experiment.year} · {experiment.inputFingerprint}</option>
              ))}
            </select>
          </label>
        )}
        {selectedExperiment ? (
          <>
            <code className="wl-studio-fingerprint">{selectedExperiment.inputFingerprint}</code>
            <div className="wl-studio-compare-grid">
              {experimentDifferences.map((difference) => (
                <div className="wl-metric" key={difference.metric}>
                  <span>{difference.metric}</span>
                  <strong>{difference.delta > 0 ? '+' : ''}{difference.delta.toLocaleString()}</strong>
                  <small>{difference.left.toLocaleString()} → {difference.right.toLocaleString()}</small>
                </div>
              ))}
            </div>
            <p className="wl-help">Studio Experiment deltas come from deterministic scenario inputs applied to the committed baseline. Treat them as scenario geometry, not calibrated likelihoods or forecasts.</p>
          </>
        ) : (
          <p className="wl-help">Run a Studio experiment on an attached simulation world to compare a baseline with its scenario result.</p>
        )}
      </section>
    </section>
  );
}
