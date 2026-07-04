import { useCallback, useEffect, useRef, useState } from 'react';

const CYCLE_DURATION_MS = 4 * 60 * 1000;

export function useDayNightCycle() {
  const [timeOfDay, setTimeOfDay] = useState(0.3);
  const [autoPlay, setAutoPlay] = useState(true);
  const rafRef = useRef<number | undefined>(undefined);
  const lastRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!autoPlay) return;

    const tick = (now: number) => {
      if (lastRef.current !== undefined) {
        const dt = now - lastRef.current;
        setTimeOfDay((t) => (t + dt / CYCLE_DURATION_MS) % 1);
      }
      lastRef.current = now;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
      lastRef.current = undefined;
    };
  }, [autoPlay]);

  const setManualTime = useCallback((t: number) => {
    setAutoPlay(false);
    setTimeOfDay(((t % 1) + 1) % 1);
  }, []);

  const toggleAutoPlay = useCallback(() => setAutoPlay((a) => !a), []);

  return { timeOfDay, autoPlay, setManualTime, toggleAutoPlay };
}
