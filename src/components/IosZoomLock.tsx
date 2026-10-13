'use client';

import { useEffect } from 'react';

/**
 * Prevents accidental pinch-to-zoom, double-tap zoom, and input zoom jumps on iOS devices.
 * Keeps the mobile web app feeling like an authentic native iOS app.
 */
export function IosZoomLock() {
  useEffect(() => {
    // Only attach on non-iOS environments; iOS Mobile Safari must NOT have e.preventDefault() on document gestures
    if (typeof window === 'undefined' || /iPhone|iPad|iPod/.test(navigator.userAgent)) {
      return;
    }

    // Prevent multi-touch pinch zoom
    const handleGestureStart = (e: Event) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    // Prevent rapid double-tap to zoom
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
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
