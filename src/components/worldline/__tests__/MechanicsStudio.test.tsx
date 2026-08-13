import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MechanicsPanel } from '../MechanicsPanel';
import { createInitialWorldlineState } from '../../../worldline/state';
import { createWorldProject } from '../../../worldline/studioProjects';

describe('MechanicsPanel Worldline Studio evidence surface', () => {
  it('shows project identity and v2 schema boundaries', () => {
    const state = createInitialWorldlineState();
    const project = createWorldProject(state, {
      title: 'Studio Test',
      now: '2026-08-13T02:00:00.000Z',
      sequence: 1,
    });
    const html = renderToStaticMarkup(createElement(MechanicsPanel as any, { state, project }));

    expect(html).toContain('Studio Test');
    expect(html).toContain('worldline-project-v2');
    expect(html).toContain('worldline-experiment-v2');
    expect(html).toContain('worldline-worldpack-v2');
  });
});
