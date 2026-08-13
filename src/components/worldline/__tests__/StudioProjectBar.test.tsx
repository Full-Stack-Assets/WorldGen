import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createInitialWorldlineState } from '../../../worldline/state';
import { createWorldProject } from '../../../worldline/studioProjects';

const components = import.meta.glob('../*.tsx', { eager: true }) as Record<string, Record<string, any>>;

describe('Worldline Studio controls', () => {
  it('renders accessible project actions and the active project identity', () => {
    const module = components['../StudioProjectBar.tsx'];
    expect(module).toBeDefined();
    if (!module) return;

    const project = createWorldProject(createInitialWorldlineState(), {
      title: 'New Bedford Studio',
      now: '2026-08-12T20:00:00.000Z',
      sequence: 1,
    });
    const html = renderToStaticMarkup(createElement(module.StudioProjectBar, {
      project,
      saved: true,
      onNew: () => undefined,
      onSave: () => undefined,
      onExport: () => undefined,
    }));

    expect(html).toContain('New Bedford Studio');
    expect(html).toContain('WORLDLINE STUDIO');
    expect(html).toContain('aria-label="Create new Studio project"');
    expect(html).toContain('aria-label="Save Studio project"');
    expect(html).toContain('aria-label="Export Studio project"');
  });

  it('renders intervention and experiment controls with scenario language', () => {
    const composer = components['../InterventionComposer.tsx'];
    const history = components['../ExperimentHistory.tsx'];
    expect(composer).toBeDefined();
    expect(history).toBeDefined();
    if (!composer || !history) return;

    const composerHtml = renderToStaticMarkup(createElement(composer.InterventionComposer, {
      worldId: 'worldgen-prime',
      branchId: 'root',
      selectedYear: 2030,
      onAdd: () => undefined,
      onRun: () => undefined,
    }));
    expect(composerHtml).toContain('Intervention Composer');
    expect(composerHtml).toContain('Run experiment');
    expect(composerHtml.toLowerCase()).toContain('scenario input');

    const historyHtml = renderToStaticMarkup(createElement(history.ExperimentHistory, { experiments: [] }));
    expect(historyHtml).toContain('Experiment History');
    expect(historyHtml).toContain('No Studio experiments yet');
  });
});
