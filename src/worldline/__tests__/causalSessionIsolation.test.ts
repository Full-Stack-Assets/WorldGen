import { expect, it } from 'vitest';
import { hashCanonical } from '../causal/canonicalJson';
import {
  createInitialCanonicalWorldState,
  createInitialWorldlineSessionState,
  selectSessionYear,
} from '../state';

it('session view changes do not alter canonical state identity', async () => {
  const canonical = createInitialCanonicalWorldState();
  const session = createInitialWorldlineSessionState(canonical);
  const before = await hashCanonical(canonical);
  const changed = selectSessionYear(session, 2040);
  expect(changed.selectedYear).toBe(2040);
  expect(await hashCanonical(canonical)).toBe(before);
});
