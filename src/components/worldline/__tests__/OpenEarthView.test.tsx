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
});
