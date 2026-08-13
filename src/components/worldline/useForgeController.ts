import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { FLAGSHIP_STAGES } from './flagshipSequence';
import { applyForgeScene, setForgeSelection, setForgeVisibility } from './forgeMapLayers';
import {
  createInitialForgeState,
  forgeVariant,
  matchForgePrompt,
  type ForgeState,
  type ForgeVariantId,
} from './forgeModel';
import { downloadForgeScenePackage, downloadForgeStill, readForgeCamera } from './forgeExports';
import type { MapLibreMap } from './maplibreRuntime';
import type { FlagshipFlightController } from './useFlagshipFlight';

const PARCEL_STAGE_INDEX = Math.max(
  0,
  FLAGSHIP_STAGES.findIndex((stage) => stage.id === 'parcel'),
);

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
  exportStill: () => Promise<void>;
  exportScene: () => void;
}

function paint(map: MapLibreMap | null, state: ForgeState, visible: boolean, selected: boolean): void {
  if (!map) return;
  applyForgeScene(map, {
    variantId: state.variantId,
    transformation: state.transformation,
    ghostOpacity: state.ghostOpacity,
    ghostVisible: state.ghostVisible,
    visible,
    selected,
  });
}

export function useForgeController(
  mapRef: MutableRefObject<MapLibreMap | null>,
  journey: FlagshipFlightController,
  reducedMotion: boolean,
): ForgeController {
  const [state, setState] = useState<ForgeState>(() => createInitialForgeState());
  const cancelDirectorRef = useRef<(() => void) | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const sync = useCallback((next: ForgeState, selected = next.parcelSelected) => {
    paint(mapRef.current, next, next.mode !== 'closed', selected);
  }, [mapRef]);

  const abortDirector = useCallback(() => {
    cancelDirectorRef.current?.();
    cancelDirectorRef.current = null;
  }, []);

  const open = useCallback(() => {
    const map = mapRef.current;
    if (!map) {
      setState((current) => ({
        ...current,
        status: 'The Earth surface is still loading.',
      }));
      return;
    }
    journey.pause();
    void journey.selectStage(PARCEL_STAGE_INDEX);
    const next: ForgeState = {
      ...createInitialForgeState(),
      mode: 'selecting',
      status: 'Select the waterfront parcel. FORGE remains a visual concept lab.',
    };
    setState(next);
    setForgeVisibility(map, true);
    setForgeSelection(map, false);
    sync(next, false);
  }, [journey, mapRef, sync]);

  const close = useCallback(() => {
    abortDirector();
    const next = createInitialForgeState();
    setState(next);
    const map = mapRef.current;
    if (map) {
      setForgeVisibility(map, false);
      setForgeSelection(map, false);
    }
    journey.exit();
  }, [journey, mapRef, abortDirector]);

  const selectParcel = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const next: ForgeState = {
      ...stateRef.current,
      mode: 'prompting',
      parcelSelected: true,
      status: 'Parcel selected. Describe a visual direction.',
    };
    setState(next);
    setForgeSelection(map, true);
    sync(next, true);
  }, [mapRef, sync]);

  const setPrompt = useCallback((prompt: string) => {
    setState((current) => ({ ...current, prompt }));
  }, []);

  const generate = useCallback(() => {
    const variantId = matchForgePrompt(stateRef.current.prompt);
    const next: ForgeState = {
      ...stateRef.current,
      variantId,
      generated: true,
      mode: 'comparing',
      transformation: 0.68,
      status: `Matched ${forgeVariant(variantId).name}. Compare three visual directions.`,
    };
    setState(next);
    sync(next, true);
  }, [sync]);

  const selectVariant = useCallback((variantId: ForgeVariantId) => {
    const next: ForgeState = {
      ...stateRef.current,
      variantId,
      mode: 'editing',
      status: `${forgeVariant(variantId).name} is a visual concept, not a constructed future.`,
    };
    setState(next);
    sync(next, true);
  }, [sync]);

  const toggleGhost = useCallback(() => {
    const next: ForgeState = { ...stateRef.current, ghostVisible: !stateRef.current.ghostVisible };
    setState(next);
    sync(next, true);
  }, [sync]);

  const setTransformation = useCallback((value: number) => {
    const next: ForgeState = { ...stateRef.current, transformation: Math.max(0, Math.min(1, value)) };
    setState(next);
    sync(next, true);
  }, [sync]);

  const direct = useCallback(() => {
    const map = mapRef.current;
    const variant = forgeVariant(stateRef.current.variantId);
    if (!map) return;
    abortDirector();
    setState((current) => ({ ...current, mode: 'directing', status: 'Director path playing. Escape to stop.' }));
    let cancelled = false;
    let timer: number | null = null;
    let settleWait: (() => void) | null = null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') stop();
    };
    const onHidden = () => {
      if (document.hidden) stop();
    };
    const abort = () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
      settleWait?.();
      settleWait = null;
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onHidden);
      map.stop();
    };
    const stop = () => {
      if (cancelled) return;
      abort();
      cancelDirectorRef.current = null;
      setState((current) => (
        current.mode === 'directing'
          ? { ...current, mode: 'editing', status: 'Director stopped.' }
          : current
      ));
    };
    cancelDirectorRef.current = abort;
    window.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onHidden);
    const run = async () => {
      for (const shot of variant.directorPath) {
        if (cancelled || reducedMotion) break;
        const motion = shot.transition === 'fly' ? map.flyTo : map.easeTo;
        motion.call(map, {
          center: [...shot.center],
          zoom: shot.zoom,
          pitch: shot.pitch,
          bearing: shot.bearing,
          duration: shot.durationMs,
        });
        await new Promise<void>((resolve) => {
          settleWait = resolve;
          timer = window.setTimeout(resolve, shot.durationMs);
        });
      }
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onHidden);
      if (timer !== null) window.clearTimeout(timer);
      if (!cancelled) {
        cancelDirectorRef.current = null;
        setState((current) => ({ ...current, mode: 'editing', status: 'Director complete. Still a visual concept.' }));
      }
    };
    void run();
  }, [mapRef, reducedMotion, abortDirector]);

  const exportStill = useCallback(async () => {
    await downloadForgeStill(mapRef.current?.getCanvas() ?? null);
  }, [mapRef]);

  const exportScene = useCallback(() => {
    downloadForgeScenePackage(stateRef.current, readForgeCamera(mapRef.current));
  }, [mapRef]);

  useEffect(() => () => {
    cancelDirectorRef.current?.();
    cancelDirectorRef.current = null;
  }, []);

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
