import { useCallback, useMemo, useRef } from 'react';
import type { TimeMode } from '../../worldline/types';
import { FlagshipAtmosphereOverlay } from './FlagshipAtmosphereOverlay';
import { FlagshipControlsLayer } from './FlagshipControlsLayer';
import type { MapLibreMap } from './maplibreRuntime';
import { useFlagshipFlight as useCinematicJourney } from './useFlagshipFlight';
import { useMountedEarthMap } from './useMountedEarthMap';
import './flagship-sequence.css';

export { chooseEarthProjection } from './maplibreRuntime';

export interface OpenEarthViewProps {
  center?: [number, number];
  zoom?: number;
  selectedYear?: number;
  timeMode?: TimeMode;
  projectionMode?: 'globe' | 'mercator';
  autoplayFlagship?: boolean;
  onReady?: () => void;
  onFailure?: (reason: string) => void;
  onCinematicStateChange?: (active: boolean) => void;
}

export function OpenEarthView({
  center = [-70.9342, 41.6362],
  zoom = 12.4,
  selectedYear = 2026,
  timeMode = 'SLICE',
  projectionMode = 'globe',
  autoplayFlagship = true,
  onReady,
  onFailure,
  onCinematicStateChange,
}: OpenEarthViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const reducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true,
    [],
  );
  const compact = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(max-width: 820px)').matches === true,
    [],
  );

  const journey = useCinematicJourney(
    mapRef,
    reducedMotion,
    compact,
    onCinematicStateChange,
  );
  const startAutoplay = useCallback(() => journey.play(0), [journey.play]);

  useMountedEarthMap({
    containerRef,
    mapRef,
    center,
    zoom,
    projectionMode,
    autoplay: autoplayFlagship,
    compact,
    reducedMotion,
    onReady,
    onFailure,
    onAutoplay: startAutoplay,
    setStatus: journey.setStatus,
  });

  return (
    <div className="wl-open-earth" aria-label="Open Earth geographic view">
      <div ref={containerRef} className="wl-open-earth-map" />
      <FlagshipAtmosphereOverlay
        selectedYear={selectedYear}
        timeMode={timeMode}
      />
      <FlagshipControlsLayer journey={journey} />
    </div>
  );
}
