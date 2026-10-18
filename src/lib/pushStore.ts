import type { PushSubscription as WebPushSubscription } from 'web-push';
import { sendWebPushNotification } from '@/lib/vapidKeys';

export interface BattlePushEntry {
  subscription: WebPushSubscription;
  hostName: string;
  createdAt: number;
}

const globalWithPush = globalThis as unknown as {
  __labasBattlePushSubs?: Map<string, BattlePushEntry>;
};

export const battlePushSubs =
  globalWithPush.__labasBattlePushSubs || new Map<string, BattlePushEntry>();
globalWithPush.__labasBattlePushSubs = battlePushSubs;

export function registerHostPush(
  roomId: string,
  subscription: WebPushSubscription,
  hostName: string = 'Host'
): void {
  const cleanId = roomId.trim().replace(/^#+/, '').toUpperCase();
  battlePushSubs.set(cleanId, {
    subscription,
    hostName: hostName || 'Host',
    createdAt: Date.now(),
  });
}

export async function notifyHostOfGuest(
  roomId: string,
  guestName: string
): Promise<boolean> {
  const cleanId = roomId.trim().replace(/^#+/, '').toUpperCase();
  const entry = battlePushSubs.get(cleanId);
  if (!entry) return false;

  const guestDisplay = guestName || 'A challenger';
  const notificationPayload = {
    title: '⚔️ LabasApp • Draugas prisijungė!',
    body: `🎉 ${guestDisplay} ką tik prisijungė prie tavo kambario (#${cleanId}). Atidaryk programėlę ir pradėkite kovą!`,
    url: `/league?battle=room&roomId=${cleanId}`,
    tag: `friend-joined-${cleanId}`,
  };

  return sendWebPushNotification(entry.subscription, notificationPayload);
}
