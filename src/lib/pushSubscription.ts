'use client';

import { isNotificationSupported } from './notifications';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribes the current device to Web Push notifications specifically for battle alerts.
 * Sends the subscription to the server mapped to the given roomId.
 */
export async function registerHostBattlePush(
  roomId: string,
  hostName: string = 'Host'
): Promise<{ success: boolean; reason?: string }> {
  if (typeof window === 'undefined') {
    return { success: false, reason: 'SSR environment' };
  }

  if (!isNotificationSupported()) {
    return { success: false, reason: 'Notifications not supported on this browser' };
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { success: false, reason: 'PushManager or Service Worker unavailable' };
  }

  try {
    // 1. Request permission if not already granted
    let permission = window.Notification.permission;
    if (permission === 'default') {
      permission = await window.Notification.requestPermission();
    }
    if (permission !== 'granted') {
      return { success: false, reason: 'Notification permission denied' };
    }

    // 2. Fetch VAPID public key from backend
    const keyRes = await fetch('/api/battle/notify');
    if (!keyRes.ok) {
      return { success: false, reason: 'Failed to retrieve VAPID key' };
    }
    const { vapidPublicKey } = await keyRes.json();
    if (!vapidPublicKey) {
      return { success: false, reason: 'Invalid VAPID public key' };
    }

    // 3. Ensure Service Worker registration is ready
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      registration = await navigator.serviceWorker.register('/sw.js');
    }
    await navigator.serviceWorker.ready;

    // 4. Subscribe with PushManager
    const existingSub = await registration.pushManager.getSubscription();
    let subscription = existingSub;

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });
    }

    // 5. Send subscription to server
    const response = await fetch('/api/battle/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'subscribe',
        roomId,
        hostName,
        subscription: subscription.toJSON(),
      }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, reason: 'Server rejected subscription' };
    }
  } catch (err: unknown) {
    console.warn('[PUSH_SUBSCRIPTION_WARN]: Could not subscribe host to push alerts:', err);
    return { success: false, reason: String(err) };
  }
}

/**
 * Triggers a Web Push notification to the host of a battle room when a guest joins.
 */
export async function triggerHostJoinNotification(
  roomId: string,
  guestName: string
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const res = await fetch('/api/battle/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'trigger',
        roomId,
        guestName,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return Boolean(data.delivered);
    }
    return false;
  } catch (err) {
    console.warn('[TRIGGER_PUSH_WARN]: Failed to trigger host notification:', err);
    return false;
  }
}
