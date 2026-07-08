import { describe, it, expect, afterEach, vi } from 'vitest';
import { getMonetizationConfig } from './monetization';

afterEach(() => vi.unstubAllEnvs());

describe('getMonetizationConfig', () => {
  it('yields nothing when no env vars are set', () => {
    const config = getMonetizationConfig();
    expect(config.supportLinks).toHaveLength(0);
    expect(config.adsense).toBeUndefined();
  });

  it('collects configured donation links', () => {
    vi.stubEnv('VITE_SUPPORT_KOFI', 'https://ko-fi.com/x');
    vi.stubEnv('VITE_SUPPORT_GITHUB_SPONSORS', 'https://github.com/sponsors/x');
    const links = getMonetizationConfig().supportLinks;
    expect(links.map((l) => l.id)).toEqual(['kofi', 'sponsors']);
  });

  it('rejects non-https donation URLs', () => {
    vi.stubEnv('VITE_SUPPORT_PATREON', 'http://insecure.example');
    expect(getMonetizationConfig().supportLinks).toHaveLength(0);
  });

  it('enables AdSense only when both client and slot are set', () => {
    vi.stubEnv('VITE_ADSENSE_CLIENT', 'ca-pub-1');
    expect(getMonetizationConfig().adsense).toBeUndefined();
    vi.stubEnv('VITE_ADSENSE_SLOT', '123');
    expect(getMonetizationConfig().adsense).toEqual({ client: 'ca-pub-1', slot: '123' });
  });
});
