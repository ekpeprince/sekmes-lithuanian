'use client';

import { useEffect } from 'react';

/**
 * Prevents accidental pinch-to-zoom, double-tap zoom, and input zoom jumps on iOS devices.
 * Keeps the mobile web app feeling like an authentic native iOS app.
 */
export function IosZoomLock() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Prevent iOS Safari multi-touch pinch zoom
    const handleGestureStart = (e: Event) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    // Prevent rapid double-tap to zoom on iOS Safari
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        // If the tap target is not a text input or textarea, prevent the default double-tap zoom
        const target = e.target as HTMLElement | null;
        const isEditable = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
        if (!isEditable && e.cancelable) {
          e.preventDefault();
        }
      }
      lastTouchEnd = now;
    };

    document.addEventListener('gesturestart', handleGestureStart, { passive: false });
    document.addEventListener('gesturechange', handleGestureStart, { passive: false });
    document.addEventListener('gestureend', handleGestureStart, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('gesturestart', handleGestureStart);
      document.removeEventListener('gesturechange', handleGestureStart);
      document.removeEventListener('gestureend', handleGestureStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return null;
}
