import { describe, expect, it } from 'vitest';
import { epistemicVisualClass } from '../TruthLens';

describe('Truth Lens', () => {
  it('keeps observed and generated visual classes distinct', () => {
    expect(epistemicVisualClass('OBSERVED')).not.toBe(epistemicVisualClass('GENERATED'));
  });
});
