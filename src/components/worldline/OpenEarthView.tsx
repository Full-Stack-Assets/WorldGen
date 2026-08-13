import { useCallback, useMemo, useRef, useState } from 'react';
import type { TimeMode } from '../../worldline/types';
import { FlagshipAtmosphereOverlay } from './FlagshipAtmosphereOverlay';
import { FlagshipControlsLayer } from './FlagshipControlsLayer';
import { ForgeControls } from './ForgeControls';
import type { MapLibreMap } from './maplibreRuntime';
import { useFlagshipFlight as useCinematicJourney } from './useFlagshipFlight';
import { useForgeController } from './useForgeControllerV5';
import { useMountedEarthMap } from './useMountedEarthMap';
import './flagship-sequence.css';
import './forge.css';

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

  const [mapReady, setMapReady] = useState(false);
  const journey = useCinematicJourney(
    mapRef,
    reducedMotion,
    compact,
    onCinematicStateChange,
  );
  const forge = useForgeController(mapRef, journey, reducedMotion, compact);
  const startAutoplay = useCallback(() => journey.play(0), [journey.play]);
  const forge = useForgeController(mapRef, journey, reducedMotion);
  const handleReady = useCallback(() => {
    setMapReady(true);
    onReady?.();
  }, [onReady]);

  useMountedEarthMap({
    containerRef,
    mapRef,
    center,
    zoom,
    projectionMode,
    autoplay: autoplayFlagship,
    compact,
    reducedMotion,
    onReady: handleReady,
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
      <FlagshipControlsLayer
        journey={journey}
        forgeOpen={forge.state.mode !== 'closed'}
      />
      <ForgeControls
        state={forge.state}
        onOpen={forge.open}
        onClose={forge.close}
        onSelectParcel={forge.selectParcel}
        onPromptChange={forge.setPrompt}
        onGenerate={forge.generate}
        onSelectVariant={forge.selectVariant}
        onToggleGhost={forge.toggleGhost}
        onTransformationChange={forge.setTransformation}
        onDirect={forge.direct}
        onExportStill={forge.exportStill}
        onExportScene={forge.exportScene}
      />
    </div>
  );
}
