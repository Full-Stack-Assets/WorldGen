import { describe, expect, it } from 'vitest';
import { canonicalizeToJson, normalizeCanonicalValue } from '../kernel/canonicalize';

describe('canonicalizeToJson', () => {
  it('orders object keys deterministically including numeric-looking keys', () => {
    expect(canonicalizeToJson({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
    expect(canonicalizeToJson({ '2': 2, '10': 1, a: 3 })).toBe('{"10":1,"2":2,"a":3}');
  });

  it('normalizes negative zero and preserves array order', () => {
    expect(canonicalizeToJson({ z: -0 })).toBe('{"z":0}');
    expect(canonicalizeToJson([3, { b: 2, a: 1 }])).toBe('[3,{"a":1,"b":2}]');
  });

  it('rejects values that cannot participate in canonical truth', () => {
    expect(() => canonicalizeToJson({ bad: undefined })).toThrow(/non-canonical/i);
    expect(() => canonicalizeToJson(new Date('2026-01-01T00:00:00Z'))).toThrow(/plain JSON object/i);
    const sparse: unknown[] = [];
    sparse.length = 1;
    expect(() => canonicalizeToJson(sparse)).toThrow(/sparse arrays/i);
  });

  it('normalizes a canonical value without changing meaning', () => {
    expect(normalizeCanonicalValue({ b: 1, a: [2, 3] })).toEqual({ a: [2, 3], b: 1 });
  });
});
