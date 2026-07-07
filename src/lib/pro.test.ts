import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getProConfig, isProUnlocked, clearLicense, verifyLicense } from './pro';

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllEnvs());

describe('getProConfig', () => {
  it('is unavailable without a Gumroad product id', () => {
    expect(getProConfig().licensingAvailable).toBe(false);
  });

  it('exposes licensing + buy URL when configured', () => {
    vi.stubEnv('VITE_GUMROAD_PRODUCT_ID', 'prod_1');
    vi.stubEnv('VITE_PRO_PRODUCT_URL', 'https://x.gumroad.com/l/pro');
    const config = getProConfig();
    expect(config.licensingAvailable).toBe(true);
    expect(config.buyUrl).toBe('https://x.gumroad.com/l/pro');
  });

  it('rejects a non-https buy URL', () => {
    vi.stubEnv('VITE_PRO_PRODUCT_URL', 'http://x');
    expect(getProConfig().buyUrl).toBeUndefined();
  });
});

describe('pro unlock state', () => {
  it('reads the unlock flag from localStorage', () => {
    expect(isProUnlocked()).toBe(false);
    localStorage.setItem('worldgen_pro', JSON.stringify({ key: 'abc' }));
    expect(isProUnlocked()).toBe(true);
  });

  it('treats malformed storage as locked', () => {
    localStorage.setItem('worldgen_pro', 'not-json');
    expect(isProUnlocked()).toBe(false);
  });

  it('clearLicense re-locks', () => {
    localStorage.setItem('worldgen_pro', JSON.stringify({ key: 'abc' }));
    clearLicense();
    expect(isProUnlocked()).toBe(false);
  });
});

describe('verifyLicense guards', () => {
  it('rejects an empty key without a network call', async () => {
    expect(await verifyLicense('  ')).toEqual({ ok: false, message: expect.any(String) });
  });

  it('reports when licensing is not configured', async () => {
    const result = await verifyLicense('some-key');
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/not configured/i);
  });
});
