import type { WorldConfig } from '../types/world';
import { parseSeed, seedToString } from './worldgen';

const NUMERIC_PARAMS: Array<{
  key: keyof WorldConfig;
  param: string;
  parse: (value: string) => number;
}> = [
  { key: 'scale', param: 'scale', parse: parseFloat },
  { key: 'seaLevel', param: 'sea', parse: parseFloat },
  { key: 'octaves', param: 'oct', parse: (v) => parseInt(v, 10) },
  { key: 'persistence', param: 'persist', parse: parseFloat },
  { key: 'lacunarity', param: 'lac', parse: parseFloat },
  { key: 'moistureScale', param: 'moist', parse: parseFloat },
  { key: 'temperatureScale', param: 'temp', parse: parseFloat },
  { key: 'width', param: 'w', parse: (v) => parseInt(v, 10) },
  { key: 'height', param: 'h', parse: (v) => parseInt(v, 10) },
];

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
  for (const { key, param, parse } of NUMERIC_PARAMS) {
    const raw = params.get(param);
    if (raw == null || raw === '') continue;
    const value = parse(raw);
    if (Number.isFinite(value)) {
      (config as Record<string, number>)[key] = value;
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
