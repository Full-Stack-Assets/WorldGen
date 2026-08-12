import { describe, expect, it } from 'vitest';
import { projectFutureLandscape } from '../futureLandscape';
import { createBranch, createInitialWorldlineState } from '../state';

describe('Future Landscape', () => {
  const buildBranches = () => {
    const base = createInitialWorldlineState();
    const first = createBranch(base, { label: 'Adaptive', atYear: 2030 });
    const second = createBranch({ ...first, activeBranchId: 'branch-root' }, { label: 'Constraint', atYear: 2030 });
    return Object.values(second.branches);
  };

  it('projects identical input deterministically', () => {
    const branches = buildBranches();
    expect(projectFutureLandscape(branches)).toEqual(projectFutureLandscape(branches));
  });

  it('is independent of input branch order', () => {
    const branches = buildBranches();
    expect(projectFutureLandscape([...branches].reverse())).toEqual(projectFutureLandscape(branches));
  });

  it('keeps root divergence at zero and diverged branches positive', () => {
    const points = projectFutureLandscape(buildBranches());
    expect(points.find((point) => point.branchId === 'branch-root')?.divergence).toBe(0);
    expect(points.filter((point) => point.branchId !== 'branch-root').some((point) => point.divergence > 0)).toBe(true);
  });

  it('keeps every coordinate inside the normalized landscape', () => {
    for (const point of projectFutureLandscape(buildBranches())) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(100);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(100);
      expect(point.divergence).toBeGreaterThanOrEqual(0);
      expect(point.divergence).toBeLessThanOrEqual(1);
      expect(point.familyId).toMatch(/^family-/);
    }
  });
});