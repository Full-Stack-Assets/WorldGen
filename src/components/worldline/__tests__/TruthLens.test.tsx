import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EPISTEMIC_CLASSES, TruthLens, epistemicVisualClass } from '../TruthLens';

describe('TruthLens', () => {
  it('renders only the toggle button when inactive', () => {
    const html = renderToStaticMarkup(createElement(TruthLens, { active: false, onToggle: () => undefined }));
    expect(html).toContain('wl-truth-toggle');
    expect(html).toContain('TRUTH LENS OFF');
    expect(html).not.toContain('wl-truth-legend');
  });

  it('shows a legend of every epistemic class when active', () => {
    const html = renderToStaticMarkup(createElement(TruthLens, { active: true, onToggle: () => undefined }));
    expect(html).toContain('TRUTH LENS ON');
    expect(html).toContain('wl-truth-legend');
    for (const value of EPISTEMIC_CLASSES) {
      expect(html).toContain(value);
      expect(html).toContain(epistemicVisualClass(value));
    }
  });

  it('keeps the five canonical epistemic classes', () => {
    expect(EPISTEMIC_CLASSES).toEqual(['OBSERVED', 'RECONSTRUCTED', 'SIMULATED', 'GENERATED', 'SPECULATIVE']);
  });
});
