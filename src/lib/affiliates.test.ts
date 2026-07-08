import { describe, it, expect, afterEach, vi } from 'vitest';
import { AFFILIATE_PARTNERS, affiliatesEnabled } from './affiliates';

afterEach(() => vi.unstubAllEnvs());

describe('affiliates', () => {
  it('is disabled by default', () => {
    expect(affiliatesEnabled()).toBe(false);
  });

  it('enables only for the exact string "true"', () => {
    vi.stubEnv('VITE_AFFILIATE_ENABLED', 'true');
    expect(affiliatesEnabled()).toBe(true);
    vi.stubEnv('VITE_AFFILIATE_ENABLED', '1');
    expect(affiliatesEnabled()).toBe(false);
  });

  it('ships partners with unique ids and https URLs', () => {
    const ids = AFFILIATE_PARTNERS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of AFFILIATE_PARTNERS) {
      expect(p.url).toMatch(/^https:\/\//);
    }
  });
});
