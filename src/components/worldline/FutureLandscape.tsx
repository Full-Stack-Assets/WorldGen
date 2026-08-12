import { projectFutureLandscape } from '../../worldline/futureLandscape';
import type { BranchRecord } from '../../worldline/types';

export function FutureLandscape({
  branches,
  activeBranchId,
  onSelectBranch,
}: {
  branches: BranchRecord[];
  activeBranchId: string;
  onSelectBranch: (branchId: string) => void;
}) {
  const points = projectFutureLandscape(branches);
  const pointByBranch = new Map(points.map((point) => [point.branchId, point]));
  const branchById = new Map(branches.map((branch) => [branch.id, branch]));

  return (
    <section className="wl-future-landscape" aria-label="Future Landscape scenario geometry">
      <div className="wl-landscape-header"><strong>Future Landscape</strong><span>Scenario geometry · not probability</span></div>
      <svg viewBox="0 0 100 100" role="img" aria-label="Deterministic branch divergence landscape">
        <defs>
          <radialGradient id="future-glow"><stop offset="0" stopColor="currentColor" stopOpacity=".42"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></radialGradient>
        </defs>
        <rect x="1" y="1" width="98" height="98" rx="6" className="wl-landscape-field" />
        {branches.map((branch) => {
          if (!branch.parentId) return null;
          const child = pointByBranch.get(branch.id);
          const parent = pointByBranch.get(branch.parentId);
          if (!child || !parent) return null;
          return <line key={`${branch.parentId}-${branch.id}`} x1={parent.x} y1={parent.y} x2={child.x} y2={child.y} className="wl-landscape-ancestry" />;
        })}
        {points.map((point) => {
          const branch = branchById.get(point.branchId);
          const active = point.branchId === activeBranchId;
          return (
            <g
              key={point.branchId}
              className={`wl-landscape-point ${active ? 'active' : ''}`}
              role="button"
              tabIndex={0}
              aria-label={`${branch?.label ?? point.branchId}, divergence ${Math.round(point.divergence * 100)} percent`}
              onClick={() => onSelectBranch(point.branchId)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelectBranch(point.branchId);
                }
              }}
            >
              <circle cx={point.x} cy={point.y} r={8 + point.divergence * 5} className="wl-landscape-halo" />
              <circle cx={point.x} cy={point.y} r={active ? 3.2 : 2.3 + point.divergence * 1.8} className="wl-landscape-dot" />
              <text x={point.x + 3.8} y={point.y - 3}>{branch?.label ?? point.branchId}</text>
              <text x={point.x + 3.8} y={point.y}>{point.familyId} · Δ {Math.round(point.divergence * 100)}%</text>
            </g>
          );
        })}
      </svg>
      <p className="wl-help">Position is a deterministic projection of committed branch metrics. Lines preserve exact ancestry. Divergence measures normalized distance from the baseline branch; it is not a forecast probability.</p>
    </section>
  );
}
