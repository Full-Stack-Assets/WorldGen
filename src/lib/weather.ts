import type { WorldStats } from '../types/world';

export type WeatherKind = 'clear' | 'rain' | 'snow';

export function deriveWeather(stats: WorldStats): WeatherKind {
  if (stats.avgTemperature < 0.32) return 'snow';
  if (stats.avgMoisture > 0.55) return 'rain';
  return 'clear';
}
