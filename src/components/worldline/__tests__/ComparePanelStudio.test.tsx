import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ComparePanel } from '../ComparePanel';
import { runExperiment } from '../../../worldline/experiments';
import { createInitialWorldlineState } from '../../../worldline/state';

describe('ComparePanel Studio experiments', () => {
  it('shows baseline-to-experiment deltas without probability language', () => {
    const state = createInitialWorldlineState();
    const branch = state.branches[state.activeBranchId];
    const baseline = branch.snapshots[0];
    const experiment = runExperiment({
      projectId: 'project-test',
      worldId: state.activeWorld.id,
      branchId: state.activeBranchId,
      year: baseline.year,
      seed: branch.seed,
      baselineMetrics: baseline.metrics,
      interventions: [],
      now: '2026-08-13T02:00:00.000Z',
    });
    const html = renderToStaticMarkup(createElement(ComparePanel as any, {
      state,
      experiments: [experiment],
      selectedExperimentId: experiment.id,
      onSelectExperiment: () => undefined,
    }));

    expect(html).toContain('Studio Experiment');
    expect(html).toContain(experiment.inputFingerprint);
    expect(html.toLowerCase()).not.toContain('probability score');
  });
});
