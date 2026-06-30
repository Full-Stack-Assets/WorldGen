import type { WorldConfig } from '../types/world';
import { parseSeed, seedToString } from './worldgen';

export function buildShareUrl(config: WorldConfig): string {
  const base = import.meta.env.BASE_URL || '/';
  const origin = window.location.origin;
  const path = base.endsWith('/') ? base.slice(0, -1) : base;
  const params = new URLSearchParams({
    seed: seedToString(config.seed),
    scale: String(config.scale),
    sea: String(config.seaLevel),
    oct: String(config.octaves),
  });
  return `${origin}${path}/?${params.toString()}`;
}

export function parseShareParams(): Partial<WorldConfig> | null {
  const params = new URLSearchParams(window.location.search);
  const seed = params.get('seed');
  if (!seed) return null;

  const config: Partial<WorldConfig> = { seed: parseSeed(seed) };
  const scale = params.get('scale');
  const sea = params.get('sea');
  const oct = params.get('oct');
  if (scale) config.scale = parseFloat(scale);
  if (sea) config.seaLevel = parseFloat(sea);
  if (oct) config.octaves = parseInt(oct, 10);
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
