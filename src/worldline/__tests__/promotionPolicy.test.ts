import { describe, expect, it } from 'vitest';
import { isAutoPromoteEligible, promotionBoundaryReason } from '../promotionPolicy';

describe('promotion policy', () => {
  it('auto-promotes only reversible low-risk rendering and data-normalization work', () => {
    expect(isAutoPromoteEligible({
      kind: 'DATA_NORMALIZATION',
      reversible: true,
      machineVerifiable: true,
      independentVerificationPassed: true,
    })).toBe(true);
    expect(isAutoPromoteEligible({
      kind: 'ARCHITECTURAL',
      reversible: true,
      machineVerifiable: true,
      independentVerificationPassed: true,
    })).toBe(false);
  });

  it('blocks scientific claims even when scores improve', () => {
    expect(promotionBoundaryReason('SCIENTIFIC_CLAIM')).toMatch(/human-gated/i);
  });
});
