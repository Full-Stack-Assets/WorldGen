import * as THREE from 'three';

export interface DayNightState {
  sunPosition: [number, number, number];
  sunIntensity: number;
  sunColor: THREE.Color;
  ambientIntensity: number;
  hemiIntensity: number;
  starsVisible: boolean;
  fogColor: THREE.Color;
  backgroundColor: THREE.Color;
  moonIntensity: number;
}

const NOON_COLOR = new THREE.Color('#fff5e6');
const HORIZON_COLOR = new THREE.Color('#ff9d5c');
const NIGHT_SUN_COLOR = new THREE.Color('#3a4a7a');

const DAY_FOG = new THREE.Color('#0a1628');
const NIGHT_FOG = new THREE.Color('#02050d');
const DAY_BG = new THREE.Color('#0a1628');
const NIGHT_BG = new THREE.Color('#020308');

// timeOfDay: 0..1, where 0.25 = sunrise, 0.5 = noon, 0.75 = sunset, 0/1 = midnight.
export function computeDayNight(timeOfDay: number): DayNightState {
  const angle = (timeOfDay - 0.25) * Math.PI * 2;
  const sunHeight = Math.sin(angle);
  const sunHoriz = Math.cos(angle);

  const dayFactor = THREE.MathUtils.clamp((sunHeight + 0.15) / 1.0, 0, 1);
  const horizonFactor = 1 - Math.min(1, Math.abs(sunHeight) / 0.4);

  const sunPosition: [number, number, number] = [
    sunHoriz * 100,
    Math.max(sunHeight, -0.25) * 90 + 15,
    40,
  ];

  const sunColor = NIGHT_SUN_COLOR.clone()
    .lerp(HORIZON_COLOR, Math.min(1, horizonFactor + dayFactor * 0.3))
    .lerp(NOON_COLOR, dayFactor);

  return {
    sunPosition,
    sunIntensity: 0.1 + dayFactor * 1.7,
    sunColor,
    ambientIntensity: 0.06 + dayFactor * 0.28,
    hemiIntensity: 0.08 + dayFactor * 0.5,
    starsVisible: dayFactor < 0.2,
    fogColor: NIGHT_FOG.clone().lerp(DAY_FOG, dayFactor),
    backgroundColor: NIGHT_BG.clone().lerp(DAY_BG, dayFactor),
    moonIntensity: 0.1 + (1 - dayFactor) * 0.4,
  };
}
