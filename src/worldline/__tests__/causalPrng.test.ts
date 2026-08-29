import { describe, expect, it } from 'vitest';
import { createPrng, seedToPrngState } from '../causal/prng';

describe('Worldline xoshiro128**', () => {
  it('matches the donor state-transition vector', () => {
    const prng = createPrng([1, 2, 3, 4]);
    expect(Array.from({ length: 8 }, () => prng.nextUint32()))
      .toEqual([11520, 0, 5927040, 70819200, 2031721883, 1637235492, 1287239034, 3734860849]);
  });

  it('repeats 10,000 seed expansions and first draws exactly', async () => {
    const states = await Promise.all(Array.from({ length: 10_000 }, (_, seed) => seedToPrngState(seed)));
    const repeated = await Promise.all(Array.from({ length: 10_000 }, (_, seed) => seedToPrngState(seed)));
    for (let seed = 0; seed < states.length; seed += 1) {
      expect(states[seed]).toEqual(repeated[seed]);
      expect(createPrng(states[seed]).nextUint32()).toBe(createPrng(repeated[seed]).nextUint32());
    }
  });

  it('fails closed for malformed state and preserves clone isolation', () => {
    expect(() => createPrng([0, 0, 0, 0])).toThrow('E_INVALID_PRNG_STATE');
    const original = createPrng([11, 22, 33, 44]);
    original.nextUint32();
    const clone = original.clone();
    expect(original.nextUint32()).toBe(clone.nextUint32());
    clone.nextUint32();
    expect(original.snapshot()).not.toEqual(clone.snapshot());
  });
});
