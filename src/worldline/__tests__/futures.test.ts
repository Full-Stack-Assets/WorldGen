import { describe, expect, it } from 'vitest';
import { selectFutureRepresentation } from '../futures';

describe('future representation', () => {
  it.each([
    [2, 'DIRECT'],
    [4, 'WORLDLINES'],
    [25, 'FAMILIES'],
    [500, 'LANDSCAPE'],
    [10001, 'CONTINENTS'],
  ] as const)('maps %i branches to %s', (count, expected) => {
    expect(selectFutureRepresentation(count)).toBe(expected);
  });
});
