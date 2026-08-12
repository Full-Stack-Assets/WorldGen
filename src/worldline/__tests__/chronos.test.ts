import { describe, expect, it } from 'vitest';
import { createChronosExport, serializeChronosExport } from '../chronos';
import { createInitialWorldlineState } from '../state';

describe('Chronos export', () => {
  it('is deterministic and provider-independent', () => {
    const state = createInitialWorldlineState();
    const first = serializeChronosExport(createChronosExport(state));
    const second = serializeChronosExport(createChronosExport(state));
    expect(first).toBe(second);
    expect(first.toLowerCase()).not.toContain('openfreemap');
    expect(first.toLowerCase()).not.toContain('google-photorealistic');
  });
});
