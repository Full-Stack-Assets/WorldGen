import { describe, expect, it } from 'vitest';
import { OpenEarthView } from '../OpenEarthView';

describe('OpenEarthView', () => {
  it('exports a renderable Earth view component', () => {
    expect(typeof OpenEarthView).toBe('function');
  });
});
