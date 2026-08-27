import { describe, expect, it } from 'vitest';
import {
  assertOperationWithinDeclaredSets,
  assertTransitionIrV1,
} from '../kernel/transitionIr';
import type { TransitionIrOperation } from '../kernel/types';

describe('Transition IR v1', () => {
  it('accepts the bounded operation grammar', () => {
    expect(() => assertTransitionIrV1({
      version: '1',
      operations: [{ op: 'SET', path: '/worlds/earth/energy', value: 1 }],
    })).not.toThrow();
  });

  it('rejects arbitrary operation names and malformed JSON pointers', () => {
    expect(() => assertTransitionIrV1({
      version: '1',
      operations: [{ op: 'RUN_CODE', path: '/x' }],
    })).toThrow(/unsupported operation/i);
    expect(() => assertTransitionIrV1({
      version: '1',
      operations: [{ op: 'SET', path: '/bad~2path', value: 1 }],
    })).toThrow(/JSON Pointer/i);
  });

  it('enforces declared write paths', () => {
    const operation: TransitionIrOperation = { op: 'SET', path: '/worlds/earth/energy', value: 10 };
    expect(() => assertOperationWithinDeclaredSets(operation, [], ['/worlds/earth'])).not.toThrow();
    expect(() => assertOperationWithinDeclaredSets(operation, [], ['/worlds/mars'])).toThrow(/write set/i);
  });

  it('requires read authority for read-modify-write operations', () => {
    const increment: TransitionIrOperation = { op: 'INCREMENT', path: '/worlds/earth/energy', value: 1 };
    expect(() => assertOperationWithinDeclaredSets(increment, ['/worlds/earth'], ['/worlds/earth'])).not.toThrow();
    expect(() => assertOperationWithinDeclaredSets(increment, [], ['/worlds/earth'])).toThrow(/read set/i);

    const assertion: TransitionIrOperation = { op: 'ASSERT', path: '/worlds/earth/energy', equals: 10 };
    expect(() => assertOperationWithinDeclaredSets(assertion, ['/worlds/earth'], [])).not.toThrow();
  });
});
