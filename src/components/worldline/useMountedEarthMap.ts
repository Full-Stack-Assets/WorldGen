import { useEffect, useRef, type MutableRefObject } from 'react';
import { createFlagshipMap, type MountedFlagshipMap } from './createFlagshipMap';
import type { MapLibreMap } from './maplibreRuntime';

export interface MountedEarthMapOptions {
  containerRef: MutableRefObject<HTMLDivElement | null>;
  mapRef: MutableRefObject<MapLibreMap | null>;
  center: [number, number];
  zoom: number;
  projectionMode: 'globe' | 'mercator';
  autoplay: boolean;
  compact: boolean;
  reducedMotion: boolean;
  onReady?: () => void;
  onFailure?: (reason: string) => void;
  onAutoplay: () => Promise<boolean>;
  setStatus: (status: string | null) => void;
}

export function useMountedEarthMap({
  containerRef,
  mapRef,
  center,
  zoom,
  projectionMode,
  autoplay,
  compact,
  reducedMotion,
  onReady,
  onFailure,
  onAutoplay,
  setStatus,
}: MountedEarthMapOptions): void {
  const autoplayedRef = useRef(false);

  useEffect(() => {
    let disposed = false;
    let mounted: MountedFlagshipMap | null = null;
    let autoplayTimer: number | null = null;
    const container = containerRef.current;
    if (!container) return undefined;

    void createFlagshipMap({
      container,
      center,
      zoom,
      projectionMode,
      openingInSpace: autoplay,
      compact,
    })
      .then((result) => {
        if (disposed) {
          result.dispose();
          return;
        }
        mounted = result;
        mapRef.current = result.map;
        setStatus(
          reducedMotion
            ? 'Flagship sequence ready. Reduced-motion mode is active.'
            : 'Flagship sequence ready.',
        );
        onReady?.();
        if (autoplay && !reducedMotion && !autoplayedRef.current) {
          autoplayedRef.current = true;
          autoplayTimer = window.setTimeout(() => void onAutoplay(), 900);
        }
      })
      .catch((error: unknown) => {
        if (!disposed) {
          onFailure?.(
            error instanceof Error
              ? error.message
              : 'Open Earth provider failed to load.',
          );
        }
      });

    return () => {
      disposed = true;
      if (autoplayTimer !== null) window.clearTimeout(autoplayTimer);
      mapRef.current = null;
      mounted?.dispose();
    };
  }, [
    autoplay,
    center[0],
    center[1],
    compact,
    containerRef,
    mapRef,
    onAutoplay,
    onFailure,
    onReady,
    projectionMode,
    reducedMotion,
    setStatus,
    zoom,
  ]);
}
