import { describe, expect, it } from 'vitest';
import { createDeterministicRandom, PRNG_V1 } from '../kernel/prng';

describe('Worldline deterministic PRNG', () => {
  it('uses a versioned identity', () => {
    expect(PRNG_V1).toBe('worldline-prng-mulberry32-v1');
  });

  it('replays the same sequence for the same seed', () => {
    const left = createDeterministicRandom('seed');
    const right = createDeterministicRandom('seed');
    expect([left(), left(), left(), left()]).toEqual([right(), right(), right(), right()]);
  });

  it('changes the sequence when the seed changes', () => {
    const left = createDeterministicRandom('seed-a');
    const right = createDeterministicRandom('seed-b');
    expect([left(), left()]).not.toEqual([right(), right()]);
  });
});
