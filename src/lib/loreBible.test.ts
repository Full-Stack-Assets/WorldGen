import { describe, expect, it } from 'vitest';
import { serializeWorldBible } from './loreBible';
import type { WorldLore } from '../types/world';

const lore: WorldLore = {
  worldName: 'Ashen Reach',
  tagline: 'A volcanic coast of oaths and ash.',
  history: 'Settlers followed the ember river inland.',
  mythology: 'The First Kiln still breathes under the mountain.',
  factions: [{ name: 'Ember Compact', motto: 'Hold the heat', description: 'Glasswrights and wardens.', territory: 'Caldera towns' }],
  eras: [{ name: 'Kindling Age', years: '0–200', summary: 'Hearths were first lit.' }],
  regions: [{ x: 4, y: 7, name: 'Glassport', description: 'Harbor of black sand.' }],
};

describe('world bible', () => {
  it('serializes structured lore as markdown without claiming observation', () => {
    const markdown = serializeWorldBible(lore);
    expect(markdown).toContain('# Ashen Reach');
    expect(markdown).toContain('Ember Compact');
    expect(markdown).toContain('Kindling Age');
    expect(markdown).toContain('Glassport');
    expect(markdown).toMatch(/not observed history/i);
  });
});
