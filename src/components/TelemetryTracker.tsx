'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { logEvent } from '@/lib/telemetry';

/**
 * Global telemetry tracker component.
 * Automatically tracks:
 * 1. APP_OPEN: Fired exactly once when the application mounts.
 * 2. PAGE_VIEW: Fired on every route transition and initial navigation.
 * 3. WHATSAPP_LEAD_CLICK: Global listener for any WhatsApp referral link clicks.
 */
export function TelemetryTracker() {
  const pathname = usePathname();
  const isInitialMount = useRef(true);
  const prevPathname = useRef<string | null>(null);

  // 1. Track APP_OPEN once on initial mount
  useEffect(() => {
    logEvent({
      eventType: 'APP_OPEN',
      path: pathname,
      metadata: {
        referrer: document.referrer || null,
        url: window.location.href,
      },
    });
  }, []); // Run strictly once on mount

  // 2. Track PAGE_VIEW on route changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevPathname.current = pathname;
      // Log initial page view
      logEvent({
        eventType: 'PAGE_VIEW',
        path: pathname,
      });
      return;
    }

    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      logEvent({
        eventType: 'PAGE_VIEW',
        path: pathname,
      });
    }
  }, [pathname]);

  // 3. Universal click interceptor for any WhatsApp referral or community links
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor) return;

      const href = anchor.href || '';
      if (
        href.includes('api.whatsapp.com') ||
        href.includes('wa.me') ||
        href.startsWith('whatsapp:')
      ) {
        logEvent({
          eventType: 'WHATSAPP_LEAD_CLICK',
          path: pathname,
          metadata: {
            destination: href,
            anchorText: anchor.innerText?.trim() || null,
          },
        });
      }
    };

    document.addEventListener('click', handleGlobalClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, [pathname]);

  return null;
}
