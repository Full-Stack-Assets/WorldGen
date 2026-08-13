import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import { captureFlagshipWebM } from './cinematicCapture';
import { setFlagshipStageVisuals } from './flagshipConceptLayers';
import { FLAGSHIP_STAGES } from './flagshipSequence';
import { moveToStage, type MapLibreMap } from './maplibreRuntime';

const ROOT_CLASS = 'wl-cinematic-active';
const FINAL_STAGE_INDEX = FLAGSHIP_STAGES.length - 1;

export interface FlagshipFlightController {
  activeStageIndex: number;
  completedStageIndex: number;
  playing: boolean;
  exporting: boolean;
  status: string | null;
  setStatus: (status: string | null) => void;
  play: (startIndex?: number) => Promise<boolean>;
  pause: () => void;
  exit: () => void;
  exportWebM: () => Promise<void>;
  selectStage: (index: number) => Promise<void>;
}

export function useFlagshipFlight(
  mapRef: MutableRefObject<MapLibreMap | null>,
  reducedMotion: boolean,
  compact: boolean,
  onCinematicStateChange?: (active: boolean) => void,
): FlagshipFlightController {
  const sequenceTokenRef = useRef(0);
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [completedStageIndex, setCompletedStageIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState<string | null>(
    'Loading the cinematic Earth surface.',
  );

  const setCinematic = useCallback(
    (active: boolean) => {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle(ROOT_CLASS, active);
      }
      onCinematicStateChange?.(active);
    },
    [onCinematicStateChange],
  );

  const pause = useCallback(() => {
    sequenceTokenRef.current += 1;
    mapRef.current?.stop();
    setPlaying(false);
    setStatus('Cinematic flight paused.');
  }, [mapRef]);

  const play = useCallback(
    async (startIndex = 0): Promise<boolean> => {
      const map = mapRef.current;
      if (!map) {
        setStatus('The Earth surface is still loading.');
        return false;
      }

      const token = sequenceTokenRef.current + 1;
      sequenceTokenRef.current = token;
      setCinematic(true);
      setPlaying(true);
      setStatus(null);

      for (let index = startIndex; index < FLAGSHIP_STAGES.length; index += 1) {
        if (sequenceTokenRef.current !== token) return false;
        setActiveStageIndex(index);
        setCompletedStageIndex((current) => Math.max(current, index));
        setFlagshipStageVisuals(map, index);
        await moveToStage(map, FLAGSHIP_STAGES[index], reducedMotion);
      }

      if (sequenceTokenRef.current !== token) return false;
      setPlaying(false);
      setCompletedStageIndex(FINAL_STAGE_INDEX);
      setStatus(
        'Flagship flight complete. Explore freely or replay the sequence.',
      );
      return true;
    },
    [mapRef, reducedMotion, setCinematic],
  );

  const selectStage = useCallback(
    async (index: number) => {
      const map = mapRef.current;
      if (!map || playing || exporting || index > completedStageIndex) return;
      sequenceTokenRef.current += 1;
      setCinematic(true);
      setActiveStageIndex(index);
      setFlagshipStageVisuals(map, index);
      setStatus(null);
      await moveToStage(map, FLAGSHIP_STAGES[index], reducedMotion);
    },
    [completedStageIndex, exporting, mapRef, playing, reducedMotion, setCinematic],
  );

  const exit = useCallback(() => {
    sequenceTokenRef.current += 1;
    mapRef.current?.stop();
    setPlaying(false);
    setCinematic(false);
    setStatus('Free exploration active.');
  }, [mapRef, setCinematic]);

  const exportWebM = useCallback(async () => {
    const map = mapRef.current;
    if (!map || exporting || playing) return;
    setExporting(true);
    setStatus('Preparing WebM capture. Keep this tab visible during the flight.');
    try {
      const result = await captureFlagshipWebM(
        map.getCanvas(),
        compact,
        () => play(0),
      );
      setStatus(
        result === 'downloaded'
          ? 'WebM capture created. The live globe remains ready to explore.'
          : 'Capture ended without video data. Try the interactive replay instead.',
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : 'WebM capture failed in this browser.',
      );
    } finally {
      setExporting(false);
    }
  }, [compact, exporting, mapRef, play, playing]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') exit();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [exit]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden' && playing) {
        pause();
        setStatus('Cinematic flight paused while the tab is hidden.');
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [pause, playing]);

  useEffect(
    () => () => {
      sequenceTokenRef.current += 1;
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove(ROOT_CLASS);
      }
    },
    [],
  );

  return {
    activeStageIndex,
    completedStageIndex,
    playing,
    exporting,
    status,
    setStatus,
    play,
    pause,
    exit,
    exportWebM,
    selectStage,
  };
}
