import { describe, it, expect, beforeEach } from 'vitest';
import { buildShareUrl, parseShareParams } from './share';
import { DEFAULT_CONFIG, type WorldConfig } from '../types/world';
import { seedToString } from './worldgen';

const config: WorldConfig = {
  ...DEFAULT_CONFIG,
  seed: 12345,
  scale: 90,
  seaLevel: 0.4,
  octaves: 5,
  persistence: 0.55,
  lacunarity: 2.2,
  moistureScale: 48,
  temperatureScale: 72,
  width: 128,
  height: 128,
};

beforeEach(() => {
  window.history.replaceState({}, '', '/');
});

describe('buildShareUrl', () => {
  it('encodes the full terrain and climate config', () => {
    const url = buildShareUrl(config);
    const params = new URL(url).searchParams;
    expect(params.get('seed')).toBe(seedToString(config.seed));
    expect(params.get('scale')).toBe('90');
    expect(params.get('sea')).toBe('0.4');
    expect(params.get('oct')).toBe('5');
    expect(params.get('persist')).toBe('0.55');
    expect(params.get('lac')).toBe('2.2');
    expect(params.get('moist')).toBe('48');
    expect(params.get('temp')).toBe('72');
    expect(params.get('w')).toBe('128');
    expect(params.get('h')).toBe('128');
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
    expect(parsed?.persistence).toBe(0.55);
    expect(parsed?.lacunarity).toBe(2.2);
    expect(parsed?.moistureScale).toBe(48);
    expect(parsed?.temperatureScale).toBe(72);
    expect(parsed?.width).toBe(128);
    expect(parsed?.height).toBe(128);
  });

  it('still accepts legacy four-param share URLs', () => {
    window.history.replaceState({}, '', '/?seed=9ix&scale=90&sea=0.4&oct=5');
    const parsed = parseShareParams();
    expect(parsed?.seed).toBe(12345);
    expect(parsed?.scale).toBe(90);
    expect(parsed?.seaLevel).toBe(0.4);
    expect(parsed?.octaves).toBe(5);
    expect(parsed?.persistence).toBeUndefined();
  });

  it('clamps grid size and climate knobs to supported control bounds', () => {
    window.history.replaceState({}, '', '/?seed=9ix&w=1000000&h=-4&scale=3&sea=9&oct=99&persist=2&lac=50&moist=1&temp=900');
    const parsed = parseShareParams();
    expect(parsed?.width).toBe(320);
    expect(parsed?.height).toBe(64);
    expect(parsed?.scale).toBe(30);
    expect(parsed?.seaLevel).toBe(0.55);
    expect(parsed?.octaves).toBe(8);
    expect(parsed?.persistence).toBe(0.8);
    expect(parsed?.lacunarity).toBe(4);
    expect(parsed?.moistureScale).toBe(30);
    expect(parsed?.temperatureScale).toBe(100);
  });
});
