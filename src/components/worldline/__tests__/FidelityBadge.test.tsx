import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ModelFidelity } from '../../../worldline/types';
import { FIDELITY_LABELS, FidelityBadge, fidelityLabel } from '../FidelityBadge';

const ALL_FIDELITIES: ModelFidelity[] = [
  'FIELD',
  'COHORT',
  'MICROSIM',
  'AGENT',
  'INTERACTING_AGENT',
  'COGNITIVE_AGENT',
  'EXPERIENTIAL_MODEL',
];

describe('FidelityBadge', () => {
  it('renders the badge with a data-fidelity attribute and the wl-fidelity-badge class', () => {
    const html = renderToStaticMarkup(createElement(FidelityBadge, { fidelity: 'AGENT' }));
    expect(html).toContain('wl-fidelity-badge');
    expect(html).toContain('data-fidelity="AGENT"');
    expect(html).toContain('AGENT');
  });

  it('maps every ModelFidelity value to a readable human label', () => {
    expect(Object.keys(FIDELITY_LABELS).sort()).toEqual([...ALL_FIDELITIES].sort());
    expect(fidelityLabel('INTERACTING_AGENT')).toBe('INTERACTING AGENT');
    expect(fidelityLabel('COGNITIVE_AGENT')).toBe('COGNITIVE AGENT');
    expect(fidelityLabel('EXPERIENTIAL_MODEL')).toBe('EXPERIENTIAL MODEL');
    expect(fidelityLabel('FIELD')).toBe('FIELD');
  });

  it('renders the mapped human label for every fidelity value', () => {
    for (const fidelity of ALL_FIDELITIES) {
      const html = renderToStaticMarkup(createElement(FidelityBadge, { fidelity }));
      expect(html).toContain(fidelityLabel(fidelity));
    }
  });
});
