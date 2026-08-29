import { describe, expect, it } from 'vitest';
import { hashCanonical, sha256Hex } from '../kernel/hash';

describe('Worldline canonical hashing', () => {
  it('matches the standard SHA-256 test vector', () => {
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('produces the same digest for equivalent canonical values', () => {
    expect(hashCanonical({ b: 1, a: 2 })).toBe(hashCanonical({ a: 2, b: 1 }));
  });

  it('changes when canonical content changes', () => {
    expect(hashCanonical({ a: 1 })).not.toBe(hashCanonical({ a: 2 }));
  });
});
