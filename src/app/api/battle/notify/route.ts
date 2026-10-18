import { NextRequest, NextResponse } from 'next/server';
import { getVapidKeys } from '@/lib/vapidKeys';
import { registerHostPush, notifyHostOfGuest } from '@/lib/pushStore';

export const runtime = 'nodejs';

function sanitizeRoomId(id?: unknown): string {
  if (!id || typeof id !== 'string') return '';
  return id.trim().replace(/^#+/, '').toUpperCase();
}

// GET: Returns the server's VAPID public key for browser registration
export async function GET() {
  try {
    const keys = getVapidKeys();
    return NextResponse.json({
      vapidPublicKey: keys.publicKey,
    });
  } catch (error) {
    console.error('[NOTIFY_API_ERROR]: Failed to get VAPID keys:', error);
    return NextResponse.json({ error: 'Failed to retrieve push key' }, { status: 500 });
  }
}

// POST: Handles subscription saving and notification triggering
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, roomId, subscription, hostName, guestName } = body;
    const cleanId = sanitizeRoomId(roomId);

    if (!cleanId) {
      return NextResponse.json({ error: 'Missing or invalid roomId' }, { status: 400 });
    }

    // ACTION 1: Register Host Push Subscription
    if (action === 'subscribe') {
      if (!subscription || !subscription.endpoint) {
        return NextResponse.json({ error: 'Invalid push subscription payload' }, { status: 400 });
      }

      registerHostPush(cleanId, subscription, hostName || 'Host');

      return NextResponse.json({
        success: true,
        message: `Push subscription registered for room ${cleanId}`,
      });
    }

    // ACTION 2: Trigger Notification to Host because Guest Joined
    if (action === 'trigger') {
      const delivered = await notifyHostOfGuest(cleanId, guestName);

      return NextResponse.json({
        delivered,
        roomId: cleanId,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[NOTIFY_API_ERROR]: Error processing push request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
