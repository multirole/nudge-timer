import { useEffect } from 'react';
import { useTimerStore } from '../store/timerStore';

export function useTimerTick() {
  const isRunning = useTimerStore(state => state.isRunning);
  const tick = useTimerStore(state => state.tick);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    if (isRunning) {
      intervalId = setInterval(() => {
        tick();
      }, 100);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, tick]);
}
