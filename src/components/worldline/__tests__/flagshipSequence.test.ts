import { describe, expect, it } from 'vitest';
import {
  FLAGSHIP_STAGES,
  createFlagshipConceptGeoJSON,
  createProceduralLifeFrame,
  preferredCaptureMimeType,
  stageDuration,
} from '../flagshipSequence';

describe('flagship visual sequence', () => {
  it('preserves the approved eleven-stage journey', () => {
    expect(FLAGSHIP_STAGES.map((stage) => stage.id)).toEqual([
      'space', 'earth', 'north-america', 'massachusetts', 'new-bedford',
      'neighborhood', 'street', 'parcel', 'building', 'close-exterior', 'future-view',
    ]);
  });

  it('compresses motion for reduced-motion users', () => {
    expect(stageDuration(FLAGSHIP_STAGES[4], true)).toBeLessThan(stageDuration(FLAGSHIP_STAGES[4], false));
    expect(stageDuration(FLAGSHIP_STAGES[4], true)).toBeGreaterThan(0);
  });

  it('returns explicitly conceptual future geometry', () => {
    const collection = createFlagshipConceptGeoJSON();
    expect(collection.features.length).toBeGreaterThan(3);
    expect(collection.features.every((feature) => feature.properties?.classification === 'VISUAL_CONCEPT')).toBe(true);
  });

  it('creates bounded procedural life and lowers compact density', () => {
    const desktop = createProceduralLifeFrame(0.25, false);
    const compact = createProceduralLifeFrame(0.25, true);
    expect(desktop.features.length).toBeGreaterThan(2);
    expect(desktop.features.length).toBeLessThanOrEqual(18);
    expect(compact.features.length).toBeLessThan(desktop.features.length);
  });

  it('selects the first supported WebM format', () => {
    expect(preferredCaptureMimeType((mime) => mime.includes('vp8'))).toContain('vp8');
    expect(preferredCaptureMimeType(() => false)).toBeNull();
  });
});
