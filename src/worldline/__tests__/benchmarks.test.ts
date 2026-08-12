import { describe, expect, it } from 'vitest';
import { create4DWorldBenchExport, createBenchmarkReceipt, createOmniWorldBenchTrace } from '../benchmarks';
import { createInitialWorldlineState } from '../state';

describe('benchmark contracts', () => {
  it('does not invent a score for an unexecuted benchmark', () => {
    const receipt = createBenchmarkReceipt({ benchmark: '4DWorldBench', status: 'NOT_RUN' });
    expect(receipt.score).toBeNull();
  });

  it('rejects a score attached to a non-completed benchmark', () => {
    expect(() => createBenchmarkReceipt({ benchmark: 'Omni-WorldBench', status: 'NOT_RUN', score: 0.9 })).toThrow();
  });

  it('exports deterministic compatibility artifacts', () => {
    const state = createInitialWorldlineState();
    expect(create4DWorldBenchExport(state)).toEqual(create4DWorldBenchExport(state));
    expect(createOmniWorldBenchTrace(state)).toEqual(createOmniWorldBenchTrace(state));
  });
});
