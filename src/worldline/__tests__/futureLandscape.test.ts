import { describe, expect, it } from 'vitest';
import { projectFutureLandscape } from '../futureLandscape';
import { createBranchThroughKernel } from '../causal/builtinMechanisms';
import { createInitialWorldlineState } from '../state';

describe('Future Landscape', () => {
  const buildBranches = async () => {
    const base = createInitialWorldlineState();
    const first = await createBranchThroughKernel(base, { label: 'Adaptive', atYear: 2030 });
    const second = await createBranchThroughKernel({ ...first.state, activeBranchId: 'branch-root' }, { label: 'Constraint', atYear: 2030 });
    return Object.values(second.state.branches);
  };

  it('projects identical input deterministically', async () => {
    const branches = await buildBranches();
    expect(projectFutureLandscape(branches)).toEqual(projectFutureLandscape(branches));
  });

  it('is independent of input branch order', async () => {
    const branches = await buildBranches();
    expect(projectFutureLandscape([...branches].reverse())).toEqual(projectFutureLandscape(branches));
  });

  it('keeps root divergence at zero and diverged branches positive', async () => {
    const points = projectFutureLandscape(await buildBranches());
    expect(points.find((point) => point.branchId === 'branch-root')?.divergence).toBe(0);
    expect(points.filter((point) => point.branchId !== 'branch-root').some((point) => point.divergence > 0)).toBe(true);
  });

  it('keeps every coordinate inside the normalized landscape', async () => {
    for (const point of projectFutureLandscape(await buildBranches())) {
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
