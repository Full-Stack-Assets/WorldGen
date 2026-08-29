import { describe, expect, it } from 'vitest';
import { executeTransitionIr, validateTransitionIr } from '../causal/transitionIr';

const mechanism = {
  readSet: ['/metrics/population'],
  writeSet: ['/metrics/population'],
};

const program = {
  version: 'TRANSITION_IR_V1' as const,
  operations: [
    { op: 'ASSERT' as const, path: '/metrics/population', comparator: 'GTE' as const, value: 0 },
    { op: 'INCREMENT' as const, path: '/metrics/population', value: { input: 'delta' } },
  ],
};

describe('Transition IR v1', () => {
  it('executes the same input deterministically without mutating the base state', () => {
    const base = { metrics: { population: 100 } };
    validateTransitionIr(program, mechanism);
    const first = executeTransitionIr(base, program, { delta: 5 });
    const second = executeTransitionIr(base, program, { delta: 5 });
    expect(first).toEqual({ metrics: { population: 105 } });
    expect(second).toEqual(first);
    expect(base).toEqual({ metrics: { population: 100 } });
  });

  it('rejects undeclared writes', () => {
    expect(() => validateTransitionIr({
      version: 'TRANSITION_IR_V1',
      operations: [{ op: 'SET', path: '/secret', value: 1 }],
    }, mechanism)).toThrow('Undeclared write path');
  });

  it('rejects prototype-pollution paths', () => {
    expect(() => validateTransitionIr({
      version: 'TRANSITION_IR_V1',
      operations: [{ op: 'SET', path: '/__proto__/polluted', value: true }],
    }, { readSet: [], writeSet: ['/'] })).toThrow('Forbidden JSON Pointer segment');
  });
});
