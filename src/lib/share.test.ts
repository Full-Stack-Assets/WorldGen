import { describe, it, expect, beforeEach } from 'vitest';
import { buildShareUrl, parseShareParams } from './share';
import { DEFAULT_CONFIG, type WorldConfig } from '../types/world';
import { seedToString } from './worldgen';

const config: WorldConfig = { ...DEFAULT_CONFIG, seed: 12345, scale: 90, seaLevel: 0.4, octaves: 5 };

beforeEach(() => {
  window.history.replaceState({}, '', '/');
});

describe('buildShareUrl', () => {
  it('encodes seed, scale, sea, and octaves', () => {
    const url = buildShareUrl(config);
    const params = new URL(url).searchParams;
    expect(params.get('seed')).toBe(seedToString(config.seed));
    expect(params.get('scale')).toBe('90');
    expect(params.get('sea')).toBe('0.4');
    expect(params.get('oct')).toBe('5');
  });
});

describe('parseShareParams', () => {
  it('returns null without a seed param', () => {
    expect(parseShareParams()).toBeNull();
  });

  it('round-trips a share URL back into a partial config', () => {
    const url = buildShareUrl(config);
    window.history.replaceState({}, '', new URL(url).search);
    const parsed = parseShareParams();
    expect(parsed).not.toBeNull();
    expect(parsed?.seed).toBe(config.seed);
    expect(parsed?.scale).toBe(90);
    expect(parsed?.seaLevel).toBe(0.4);
    expect(parsed?.octaves).toBe(5);
  });
});
