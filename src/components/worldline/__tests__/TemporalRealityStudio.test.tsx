import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createInitialWorldlineState } from '../../../worldline/state';
import { WORLD_CATALOG } from '../../../worldline/fixtures';
import { TemporalRealityStudio } from '../TemporalRealityStudio';

describe('Temporal Reality Studio', () => {
  it('renders causal fabric, truth separation, branch controls, and temporal loom', () => {
    const html = renderToStaticMarkup(createElement(TemporalRealityStudio, {
      state: createInitialWorldlineState(), onYear: () => undefined, onCreateBranch: () => undefined, onSelectBranch: () => undefined,
    }));
    expect(html).toContain('CAUSAL FABRIC');
    expect(html).toContain('TRUTH LENS');
    expect(html).toContain('TEMPORAL LOOM');
    expect(html).toContain('VISUAL FIDELITY');
    expect(html).toContain('CAUSAL RELIABILITY');
    expect(html).toContain('NOT RUN');
  });

  it('labels New Bedford as bounded scenario analysis with separate clocks', () => {
    const initial = createInitialWorldlineState();
    const world = WORLD_CATALOG.find((item) => item.id === 'new-bedford-001');
    if (!world) throw new Error('Missing New Bedford fixture');
    const html = renderToStaticMarkup(createElement(TemporalRealityStudio, {
      state: { ...initial, activeWorld: world }, onYear: () => undefined, onCreateBranch: () => undefined, onSelectBranch: () => undefined,
    }));
    expect(html).toContain('SCENARIO · NOT PREDICTION');
    expect(html).toContain('2023–2026 source package');
    expect(html).toContain('2026–2046 scenario horizon');
    expect(html).toContain('EXPERT REVIEW REQUIRED');
  });
});
