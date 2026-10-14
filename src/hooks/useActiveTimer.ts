'use client';
import { useEffect } from 'react';
import { useGame } from '@/context/GameContext';

/**
 * Custom hook to track active practice immersion time.
 * Only tracks time when the tab is actively visible and focused,
 * avoiding tracking idle background time.
 */
export function useActiveTimer(isActive: boolean = true) {
  const { addActivePracticeTime } = useGame();

  useEffect(() => {
    if (!isActive) return;

    let accumulatedSeconds = 0;

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        accumulatedSeconds += 1;
        // Batch sync every 5 seconds to reduce storage operations
        if (accumulatedSeconds >= 5) {
          addActivePracticeTime(accumulatedSeconds);
          accumulatedSeconds = 0;
        }
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      if (accumulatedSeconds > 0) {
        addActivePracticeTime(accumulatedSeconds);
      }
    };
  }, [isActive, addActivePracticeTime]);
}
