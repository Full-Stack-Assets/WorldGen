import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import { downloadForgeScenePackage, downloadForgeStill } from './forgeExports';
import { applyForgeScene } from './forgeMapLayers';
import {
  FORGE_VARIANTS,
  createInitialForgeState,
  forgeVariant,
  matchForgePrompt,
  type ForgeCameraState,
  type ForgeDirectorShot,
  type ForgeState,
  type ForgeVariantId,
} from './forgeModel';
import { enterForgeState } from './forgeStateTransitions';
import { FLAGSHIP_STAGES } from './flagshipSequence';
import type { MapLibreMap } from './maplibreRuntime';
import type { FlagshipFlightController } from './useFlagshipFlight';

export interface ForgeController {
  state: ForgeState;
  open: () => void;
  close: () => void;
  selectParcel: () => void;
  setPrompt: (prompt: string) => void;
  generate: () => void;
  selectVariant: (variantId: ForgeVariantId) => void;
  toggleGhost: () => void;
  setTransformation: (value: number) => void;
  direct: () => void;
  exportStill: () => void;
  exportScene: () => void;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function cameraState(map: MapLibreMap): ForgeCameraState {
  const center = map.getCenter?.();
  return {
    center: center ? [center.lng, center.lat] : [-70.9217, 41.6349],
    zoom: map.getZoom?.() ?? 17.4,
    pitch: map.getPitch?.() ?? 72,
    bearing: map.getBearing?.() ?? -40,
  };
}

function moveToForgeShot(
  map: MapLibreMap,
  shot: ForgeDirectorShot,
  reducedMotion: boolean,
): Promise<void> {
  const duration = reducedMotion
    ? Math.max(360, Math.round(shot.durationMs * 0.18))
    : shot.durationMs;
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    map.once('moveend', finish);
    const camera = {
      center: [...shot.center],
      zoom: shot.zoom,
      pitch: shot.pitch,
      bearing: shot.bearing,
      duration,
      curve: 1.24,
      speed: 0.56,
      essential: !reducedMotion,
    };
    if (shot.transition === 'ease') map.easeTo(camera);
    else map.flyTo(camera);
    window.setTimeout(finish, duration + 1000);
  });
}

export function useForgeController(
  mapRef: MutableRefObject<MapLibreMap | null>,
  journey: FlagshipFlightController,
  reducedMotion: boolean,
  _compact: boolean,
): ForgeController {
  const [state, setState] = useState<ForgeState>(createInitialForgeState);
  const operationTokenRef = useRef(0);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    applyForgeScene(map, {
      variantId: state.variantId,
      transformation: state.generated ? state.transformation : 0,
      ghostOpacity: state.ghostOpacity,
      ghostVisible: state.ghostVisible,
      visible: state.mode !== 'closed',
      selected: state.parcelSelected,
    });
  }, [
    mapRef,
    state.generated,
    state.ghostOpacity,
    state.ghostVisible,
    state.mode,
    state.parcelSelected,
    state.transformation,
    state.variantId,
  ]);

  const stopOperation = useCallback(() => {
    operationTokenRef.current += 1;
    mapRef.current?.stop();
  }, [mapRef]);

  const open = useCallback(() => {
    const map = mapRef.current;
    if (!map) {
      journey.setStatus('The Earth surface is still loading.');
      return;
    }
    stopOperation();
    journey.pause();
    setState(enterForgeState);
    const parcelStage = FLAGSHIP_STAGES.find((stage) => stage.id === 'parcel');
    if (parcelStage) {
      map.flyTo({
        center: [...parcelStage.center],
        zoom: parcelStage.zoom,
        pitch: parcelStage.pitch,
        bearing: parcelStage.bearing,
        duration: reducedMotion ? 520 : 1900,
        curve: parcelStage.curve,
        speed: parcelStage.speed,
        essential: !reducedMotion,
      });
    }
  }, [journey, mapRef, reducedMotion, stopOperation]);

  const close = useCallback(() => {
    stopOperation();
    setState((current) => ({ ...current, mode: 'closed', status: null }));
    journey.exit();
  }, [journey, stopOperation]);

  const selectParcel = useCallback(() => {
    setState((current) => ({
      ...current,
      mode: 'prompting',
      parcelSelected: true,
      status: 'Waterfront parcel selected. Describe its visual future.',
    }));
  }, []);

  const setPrompt = useCallback((prompt: string) => {
    setState((current) => ({ ...current, prompt, status: null }));
  }, []);

  const generate = useCallback(() => {
    setState((current) => ({
      ...current,
      mode: 'comparing',
      generated: true,
      variantId: matchForgePrompt(current.prompt),
      transformation: 0.68,
      ghostOpacity: 0.46,
      ghostVisible: true,
      status: `${FORGE_VARIANTS.length} visual directions generated from reusable scene assets.`,
    }));
  }, []);

  const selectVariant = useCallback((variantId: ForgeVariantId) => {
    const variant = forgeVariant(variantId);
    setState((current) => ({
      ...current,
      mode: 'editing',
      generated: true,
      variantId,
      status: `${variant.name} placed as a ghosted visual concept.`,
    }));
  }, []);

  const toggleGhost = useCallback(() => {
    setState((current) => ({
      ...current,
      ghostVisible: !current.ghostVisible,
      status: current.ghostVisible
        ? 'Ghost view disabled. Concept geometry is fully materialized.'
        : 'Ghost view enabled. Existing and proposed worlds remain legible together.',
    }));
  }, []);

  const setTransformation = useCallback((value: number) => {
    setState((current) => ({
      ...current,
      transformation: clamp01(value),
      status: null,
    }));
  }, []);

  const direct = useCallback(() => {
    const map = mapRef.current;
    if (!map) {
      setState((current) => ({
        ...current,
        status: 'The Earth surface is still loading.',
      }));
      return;
    }
    const token = operationTokenRef.current + 1;
    operationTokenRef.current = token;
    const variant = forgeVariant(state.variantId);
    setState((current) => ({
      ...current,
      mode: 'directing',
      ghostVisible: false,
      transformation: 1,
      status: `Director is revealing ${variant.name}.`,
    }));

    void (async () => {
      for (const shot of variant.directorPath) {
        if (operationTokenRef.current !== token) return;
        setState((current) => ({
          ...current,
          status: `Director · ${shot.label}`,
        }));
        await moveToForgeShot(map, shot, reducedMotion);
      }
      if (operationTokenRef.current !== token) return;
      setState((current) => ({
        ...current,
        mode: 'editing',
        status: `${variant.name} reveal complete.`,
      }));
    })();
  }, [mapRef, reducedMotion, state.variantId]);

  const exportStill = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    setState((current) => ({
      ...current,
      status: 'Capturing the current FORGE frame.',
    }));
    void downloadForgeStill(map.getCanvas())
      .then(() => {
        setState((current) => ({ ...current, status: 'PNG still exported.' }));
      })
      .catch((error: unknown) => {
        setState((current) => ({
          ...current,
          status: error instanceof Error ? error.message : 'PNG export failed.',
        }));
      });
  }, [mapRef]);

  const exportScene = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      downloadForgeScenePackage(state, cameraState(map));
      setState((current) => ({
        ...current,
        status: 'FORGE scene package exported.',
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        status: error instanceof Error ? error.message : 'Scene export failed.',
      }));
    }
  }, [mapRef, state]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && state.mode !== 'closed') close();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden' && state.mode === 'directing') {
        stopOperation();
        setState((current) => ({
          ...current,
          mode: 'editing',
          status: 'Director reveal paused while the tab is hidden.',
        }));
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [close, state.mode, stopOperation]);

  useEffect(() => () => stopOperation(), [stopOperation]);

  return {
    state,
    open,
    close,
    selectParcel,
    setPrompt,
    generate,
    selectVariant,
    toggleGhost,
    setTransformation,
    direct,
    exportStill,
    exportScene,
  };
}
