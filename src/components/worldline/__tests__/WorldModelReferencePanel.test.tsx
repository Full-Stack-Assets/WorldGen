import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { WorldModelReferencePanel } from '../WorldModelReferencePanel';

describe('WorldModelReferencePanel', () => {
  it('shows reference-only world models and the shared evaluation spine without claiming integration', () => {
    const html = renderToStaticMarkup(createElement(WorldModelReferencePanel));
    expect(html).toContain('WORLD MODEL LAB');
    expect(html).toContain('Genie 3');
    expect(html).toContain('NVIDIA Cosmos 3');
    expect(html).toContain('REFERENCE ONLY');
    expect(html).toContain('PERCEPTUAL QUALITY');
    expect(html).toContain('PHYSICAL REALISM');
    expect(html.toLowerCase()).toContain('no external model is connected');
  });
});
