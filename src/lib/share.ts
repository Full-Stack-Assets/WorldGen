import type { WorldConfig } from '../types/world';
import { parseSeed, seedToString } from './worldgen';

const NUMERIC_PARAMS: Array<{
  key: keyof WorldConfig;
  param: string;
  parse: (value: string) => number;
  min: number;
  max: number;
  integer?: boolean;
}> = [
  { key: 'scale', param: 'scale', parse: parseFloat, min: 30, max: 150 },
  { key: 'seaLevel', param: 'sea', parse: parseFloat, min: 0.2, max: 0.55 },
  { key: 'octaves', param: 'oct', parse: (v) => parseInt(v, 10), min: 1, max: 8, integer: true },
  { key: 'persistence', param: 'persist', parse: parseFloat, min: 0.2, max: 0.8 },
  { key: 'lacunarity', param: 'lac', parse: parseFloat, min: 1, max: 4 },
  { key: 'moistureScale', param: 'moist', parse: parseFloat, min: 30, max: 100 },
  { key: 'temperatureScale', param: 'temp', parse: parseFloat, min: 30, max: 100 },
  { key: 'width', param: 'w', parse: (v) => parseInt(v, 10), min: 64, max: 320, integer: true },
  { key: 'height', param: 'h', parse: (v) => parseInt(v, 10), min: 64, max: 320, integer: true },
];

function clampShareValue(value: number, min: number, max: number, integer?: boolean): number {
  const clamped = Math.min(max, Math.max(min, value));
  return integer ? Math.round(clamped) : clamped;
}

export function buildShareUrl(config: WorldConfig): string {
  const base = import.meta.env.BASE_URL || '/';
  const origin = window.location.origin;
  const path = base.endsWith('/') ? base.slice(0, -1) : base;
  const params = new URLSearchParams({
    seed: seedToString(config.seed),
  });
  for (const { key, param } of NUMERIC_PARAMS) {
    params.set(param, String(config[key]));
  }
  return `${origin}${path}/?${params.toString()}`;
}

export function parseShareParams(): Partial<WorldConfig> | null {
  const params = new URLSearchParams(window.location.search);
  const seed = params.get('seed');
  if (!seed) return null;

  const config: Partial<WorldConfig> = { seed: parseSeed(seed) };
  for (const { key, param, parse, min, max, integer } of NUMERIC_PARAMS) {
    const raw = params.get(param);
    if (raw == null || raw === '') continue;
    const value = parse(raw);
    if (Number.isFinite(value)) {
      (config as Record<string, number>)[key] = clampShareValue(value, min, max, integer);
    }
  }
  return config;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
