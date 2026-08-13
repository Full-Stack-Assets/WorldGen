import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { chooseEarthProjection, OpenEarthView } from '../OpenEarthView';

describe('OpenEarthView', () => {
  it('exports a renderable Earth view component', () => {
    expect(typeof OpenEarthView).toBe('function');
  });

  it('prefers globe projection when the renderer supports it', () => {
    expect(chooseEarthProjection(true, 'globe')).toBe('globe');
    expect(chooseEarthProjection(false, 'globe')).toBe('mercator');
    expect(chooseEarthProjection(true, 'mercator')).toBe('mercator');
  });

  it('renders one visual-first Earth surface with flagship and FORGE controls', () => {
    const html = renderToStaticMarkup(createElement(OpenEarthView, {
      selectedYear: 2026,
      timeMode: 'SLICE',
      autoplayFlagship: false,
      onFailure: () => undefined,
      onCinematicStateChange: () => undefined,
    }));

    expect(html).toContain('WorldGen flagship cinematic sequence');
    expect(html).toContain('Play flagship flight');
    expect(html).toContain('Export WebM');
    expect(html).toContain('Enter FORGE');
    expect(html).not.toContain('causal graph');
    expect((html.match(/wl-open-earth-map/g) ?? []).length).toBe(1);
    expect(html.match(/wl-open-earth-map/g)).toHaveLength(1);
    expect(html).not.toContain('WORLD DASHBOARD');
  });
});
