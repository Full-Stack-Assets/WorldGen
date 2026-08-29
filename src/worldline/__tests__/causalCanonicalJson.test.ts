import { describe, expect, it } from 'vitest';
import { canonicalize, hashCanonical } from '../causal/canonicalJson';

describe('canonical JSON', () => {
  it('sorts object keys and normalizes negative zero deterministically', async () => {
    expect(canonicalize({ z: -0, a: { d: 2, c: 1 } }))
      .toBe('{"a":{"c":1,"d":2},"z":0}');
    expect(await hashCanonical({ b: 2, a: 1 }))
      .toBe(await hashCanonical({ a: 1, b: 2 }));
  });

  it('normalizes Unicode strings and keys to NFC before hashing', async () => {
    expect(canonicalize({ 'e\u0301': 'A\u030A' })).toBe('{"é":"Å"}');
    expect(await hashCanonical({ 'e\u0301': 'A\u030A' }))
      .toBe(await hashCanonical({ é: 'Å' }));
  });

  it('rejects keys that collide after Unicode normalization', () => {
    expect(() => canonicalize({ é: 1, 'e\u0301': 2 }))
      .toThrow('Canonical key collision after NFC normalization');
  });

  it('rejects unsafe container shapes', () => {
    const sparse: unknown[] = [];
    sparse.length = 1;
    expect(() => canonicalize(sparse)).toThrow('Sparse arrays are not canonical');

    const accessor = Object.defineProperty({}, 'value', { enumerable: true, get: () => 1 });
    expect(() => canonicalize(accessor)).toThrow('Accessors are not canonical');

    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(() => canonicalize(cyclic)).toThrow('Canonical values cannot contain cycles');
  });

  it('rejects values outside the canonical JSON domain', () => {
    expect(() => canonicalize({ value: Number.NaN })).toThrow('Non-finite number');
    expect(() => canonicalize({ value: undefined })).toThrow('Unsupported canonical value');
    expect(() => canonicalize('\ud800')).toThrow('Unpaired high surrogate');
  });
});
