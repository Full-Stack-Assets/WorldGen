import { describe, expect, it } from 'vitest';
import { canonicalize, hashCanonical } from '../causal/canonicalJson';

describe('canonical JSON', () => {
  it('sorts object keys and normalizes negative zero deterministically', async () => {
    expect(canonicalize({ z: -0, a: { d: 2, c: 1 } }))
      .toBe('{"a":{"c":1,"d":2},"z":0}');
    expect(await hashCanonical({ b: 2, a: 1 }))
      .toBe(await hashCanonical({ a: 1, b: 2 }));
  });

  it('rejects values outside the canonical JSON domain', () => {
    expect(() => canonicalize({ value: Number.NaN })).toThrow('Non-finite number');
    expect(() => canonicalize({ value: undefined })).toThrow('Unsupported canonical value');
  });
});
