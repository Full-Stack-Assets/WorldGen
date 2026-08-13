import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FutureNavigator } from '../FutureNavigator';
import { createInitialWorldlineState } from '../../../worldline/state';

describe('FutureNavigator Studio workflow', () => {
  it('renders intervention composer and experiment history for an attached simulation world', () => {
    const state = createInitialWorldlineState();
    const html = renderToStaticMarkup(createElement(FutureNavigator as any, {
      state,
      interventions: [],
      experiments: [],
      onCreateBranch: () => undefined,
      onSelectBranch: () => undefined,
      onAddIntervention: () => undefined,
      onRunExperiment: () => undefined,
    }));

    expect(html).toContain('Intervention Composer');
    expect(html).toContain('Run experiment');
    expect(html).toContain('Experiment History');
    expect(html).toContain('scenario input');
  });

  it('does not expose experiment controls when the selected world has no attached simulation model', () => {
    const initial = createInitialWorldlineState();
    const earth = initial.worlds.find((world) => world.id === 'new-bedford-001');
    expect(earth).toBeDefined();
    if (!earth) return;
    const state = { ...initial, activeWorld: earth };
    const html = renderToStaticMarkup(createElement(FutureNavigator as any, {
      state,
      interventions: [],
      experiments: [],
      onCreateBranch: () => undefined,
      onSelectBranch: () => undefined,
      onAddIntervention: () => undefined,
      onRunExperiment: () => undefined,
    }));

    expect(html).toContain('Simulation model not attached');
    expect(html).not.toContain('Run experiment');
  });
});
