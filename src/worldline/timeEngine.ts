export const PLAYBACK_YEAR_MIN = 2026;
export const PLAYBACK_YEAR_MAX = 2046;

export function nextPlaybackYear(
  year: number,
  min: number = PLAYBACK_YEAR_MIN,
  max: number = PLAYBACK_YEAR_MAX,
): number {
  if (year >= max) return min;
  return Math.min(max, year + 1);
}

export interface TimeVolumeSample {
  year: number;
  offset: number;
  weight: number;
  committed: boolean;
}

/** Local analytical samples around the selected year. Past is committed; future is speculative. */
export function timeVolumeSamples(selectedYear: number, span = 4): TimeVolumeSample[] {
  const samples: TimeVolumeSample[] = [];
  for (let offset = -span; offset <= span; offset += 1) {
    const year = Math.max(PLAYBACK_YEAR_MIN, Math.min(PLAYBACK_YEAR_MAX, selectedYear + offset));
    const distance = Math.abs(offset);
    samples.push({
      year,
      offset,
      weight: Number((1 - distance / (span + 1)).toFixed(4)),
      committed: year <= selectedYear,
    });
  }
  return samples;
}

export function describeTimeMode(mode: 'PLAYBACK' | 'SLICE' | 'PARALLAX' | 'VOLUME'): string {
  switch (mode) {
    case 'PLAYBACK':
      return 'Cinematic evolution of one committed worldline.';
    case 'PARALLAX':
      return 'Past, present, and nearby future states coexist as offset layers.';
    case 'VOLUME':
      return 'Local analytical volume of change through time. Past is committed; future is speculative.';
    default:
      return 'Exact inspection of one instant on the active worldline.';
  }
}
