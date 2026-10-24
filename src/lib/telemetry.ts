import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export type TelemetryEventType =
  | 'APP_OPEN'
  | 'PAGE_VIEW'
  | 'LESSON_START'
  | 'LESSON_COMPLETE'
  | 'PRONUNCIATION_CLICK'
  | 'PRONUNCIATION_SUCCESS'
  | 'WHATSAPP_LEAD_CLICK'
  | 'EXERCISE_ANSWER';

export interface LogEventParams {
  eventType: TelemetryEventType;
  path?: string;
  metadata?: Record<string, unknown>;
}

const ANON_UID_KEY = 'labas_anon_uid';

/**
 * Retrieves or creates a persistent anonymous unique ID stored in localStorage.
 * Ensures every event is attributable to a unique device/user profile even without login.
 */
export function getAnonymousUid(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let uid = localStorage.getItem(ANON_UID_KEY);
    if (!uid) {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        uid = crypto.randomUUID();
      } else {
        uid = 'anon_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
      }
      localStorage.setItem(ANON_UID_KEY, uid);
    }
    return uid;
  } catch {
    return 'temp_anon';
  }
}

/**
 * Asynchronously logs a telemetry event to Firestore 'user_events' collection.
 * 
 * FAIL-SAFE: Wrapped in a strict try...catch block that catches all network,
 * timeout, permission, or ad-blocker errors silently to prevent any UI disruption.
 * Thanks to Firestore offline persistence, offline events are cached locally and
 * automatically synced when network connectivity returns.
 */
export async function logEvent({ eventType, path, metadata = {} }: LogEventParams): Promise<void> {
  // Avoid logging during SSR or build-time prerendering
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const anonymousUid = getAnonymousUid();
    const currentPath = path || window.location.pathname;
    const authUid = auth?.currentUser?.uid || null;

    const eventData = {
      eventType,
      userId: anonymousUid,
      authUid,
      path: currentPath,
      metadata,
      timestamp: serverTimestamp(),
      clientTimestamp: Date.now(),
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
    };

    const eventsCollection = collection(db, 'user_events');
    await addDoc(eventsCollection, eventData);
  } catch (err) {
    // Fail silently so network drops, ad-blockers, or timeouts never break the app
    console.error(`[Telemetry Error] Failed to log event "${eventType}":`, err);
  }
}
