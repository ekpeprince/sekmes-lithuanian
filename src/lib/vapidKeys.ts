import webpush from 'web-push';
import fs from 'fs';
import path from 'path';

export interface VapidKeyPair {
  publicKey: string;
  privateKey: string;
}

// In-memory or file-persisted fallback VAPID keys for local dev / preview environments
let cachedVapidKeys: VapidKeyPair | null = null;

export function getVapidKeys(): VapidKeyPair {
  if (cachedVapidKeys) {
    return cachedVapidKeys;
  }

  // 1. Check environment variables
  const envPublic = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const envPrivate = process.env.VAPID_PRIVATE_KEY;

  if (envPublic && envPrivate) {
    cachedVapidKeys = {
      publicKey: envPublic.trim(),
      privateKey: envPrivate.trim(),
    };
    return cachedVapidKeys;
  }

  // 2. Check local dev cache file to keep VAPID keys stable between dev server restarts
  try {
    const cacheDir = path.join(process.cwd(), '.next');
    const keyFile = path.join(cacheDir, 'vapid-keys.json');

    if (fs.existsSync(keyFile)) {
      const data = JSON.parse(fs.readFileSync(keyFile, 'utf-8'));
      if (data.publicKey && data.privateKey) {
        cachedVapidKeys = data;
        return data;
      }
    }

    // Generate new VAPID keys dynamically if none exist
    const generated = webpush.generateVAPIDKeys();
    cachedVapidKeys = generated;

    if (fs.existsSync(cacheDir)) {
      fs.writeFileSync(keyFile, JSON.stringify(generated, null, 2), 'utf-8');
    }
    return generated;
  } catch {
    // Fallback in-memory generation
    const generated = webpush.generateVAPIDKeys();
    cachedVapidKeys = generated;
    return generated;
  }
}

export function configureWebPush(): VapidKeyPair {
  const keys = getVapidKeys();
  const contactEmail = process.env.VAPID_SUBJECT || 'mailto:admin@labasapp.com';
  
  webpush.setVapidDetails(
    contactEmail,
    keys.publicKey,
    keys.privateKey
  );

  return keys;
}

export async function sendWebPushNotification(
  subscription: webpush.PushSubscription,
  payload: {
    title: string;
    body: string;
    url?: string;
    tag?: string;
  }
): Promise<boolean> {
  try {
    configureWebPush();
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload),
      {
        TTL: 60 * 60, // 1 hour time-to-live
        urgency: 'high',
      }
    );
    return true;
  } catch (error: unknown) {
    console.warn('[WEB_PUSH_ERROR]: Failed to send notification to subscription:', error);
    return false;
  }
}
