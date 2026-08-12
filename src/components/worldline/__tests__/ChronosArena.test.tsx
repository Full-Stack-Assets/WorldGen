import { describe, expect, it } from 'vitest';
import { CHRONOS_EVIDENCE_COPY, ChronosArena } from '../ChronosArena';

describe('ChronosArena', () => {
  it('exports the playable arena and permanently labels the mechanic as fictional', () => {
    expect(typeof ChronosArena).toBe('function');
    expect(CHRONOS_EVIDENCE_COPY).toMatch(/fictional gameplay mechanic/i);
    expect(CHRONOS_EVIDENCE_COPY).toMatch(/worldline|spacetime/i);
  });
});