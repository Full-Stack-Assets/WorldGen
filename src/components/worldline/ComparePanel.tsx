import { compareSnapshots } from '../../worldline/state';
import type { WorldlineState } from '../../worldline/types';

export function ComparePanel({ state }: { state: WorldlineState }) {
  const branches = Object.values(state.branches);
  const left = branches[0]?.snapshots.at(-1);
  const right = branches.find((branch) => branch.id === state.activeBranchId)?.snapshots.at(-1) ?? left;
  const differences = left && right ? compareSnapshots(left, right) : [];

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
      <p className="wl-help">Comparison is computed from committed snapshots. Visual emphasis does not alter the underlying branch states.</p>
    </section>
  );
}
