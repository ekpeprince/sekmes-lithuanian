import { NextRequest, NextResponse } from 'next/server';
import { BattleRoom, BattlePlayer, BattleAnswer, calculateAnswerPoints } from '@/lib/battleSync';
import { generateBattleRoomQuestions } from '@/lib/battleRoomSync';

export const runtime = 'nodejs';

// Server-side local memory cache
const serverRooms: Map<string, any> = (globalThis as any).__labasServerRooms || new Map<string, any>();
(globalThis as any).__labasServerRooms = serverRooms;

const MAX_SERVER_ROOMS = 500;
const ROOM_ID_REGEX = /^[A-Z0-9-]{3,16}$/;

function sanitizeRoomId(id?: any): string {
  if (!id || typeof id !== 'string') return '';
  return id.trim().replace(/^#+/, '').toUpperCase();
}

// Clean up rooms older than 2 hours periodically
function cleanupOldRooms() {
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, r] of serverRooms.entries()) {
    if (r.createdAt && r.createdAt < twoHoursAgo) {
      serverRooms.delete(id);
    }
  }

  if (serverRooms.size > MAX_SERVER_ROOMS) {
    const sorted = Array.from(serverRooms.entries()).sort(
      (a, b) => (a[1].createdAt || 0) - (b[1].createdAt || 0)
    );
    const toRemove = sorted.slice(0, serverRooms.size - MAX_SERVER_ROOMS);
    for (const [id] of toRemove) {
      serverRooms.delete(id);
    }
  }
}

// Server-side fast in-memory room store
async function getPersistedRoom(roomId: string): Promise<any | null> {
  return serverRooms.get(roomId) || null;
}

async function persistRoom(roomId: string, room: any): Promise<void> {
  serverRooms.set(roomId, room);
}

// GET /api/battle?roomId=ABC-123
export async function GET(request: NextRequest) {
  cleanupOldRooms();

  const { searchParams } = new URL(request.url);
  const roomId = sanitizeRoomId(searchParams.get('roomId'));

  if (!roomId || !ROOM_ID_REGEX.test(roomId)) {
    return NextResponse.json({ error: 'Invalid or missing roomId parameter' }, { status: 400 });
  }

  let room = await getPersistedRoom(roomId);
  if (!room) {
    room = await getOrCreateRoom(roomId);
    await persistRoom(roomId, room);
  }

  return NextResponse.json(room, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

// Helper to get or safely initialize room state across serverless instances
async function getOrCreateRoom(cleanId: string): Promise<any> {
  let room = await getPersistedRoom(cleanId);
  if (!room) {
    room = {
      id: cleanId,
      roomId: cleanId,
      status: 'waiting',
      host: { id: 'host_auto', name: 'Host', joined: true, score: 0, ready: false, currentRound: 0 },
      guest: null,
      hostReady: false,
      guestReady: false,
      countdown: 3,
      currentRound: 0,
      tier: 'SIDABRINĖ LYGA',
      questions: generateBattleRoomQuestions(5, cleanId),
      createdAt: Date.now(),
    };
  } else if (!room.questions || !Array.isArray(room.questions) || room.questions.length === 0) {
    room.questions = generateBattleRoomQuestions(5, cleanId);
  }
  return room;
}

// POST /api/battle
export async function POST(request: NextRequest) {
  cleanupOldRooms();

  try {
    const body = await request.json();
    const { action } = body;

    // 1. CREATE ROOM
    if (action === 'create') {
      const room = body.room;
      const cleanId = sanitizeRoomId(room?.roomId || room?.id);
      if (!room || !cleanId || !ROOM_ID_REGEX.test(cleanId)) {
        return NextResponse.json({ error: 'Invalid room payload or format' }, { status: 400 });
      }

      room.id = cleanId;
      room.roomId = cleanId;
      if (!room.status) room.status = 'waiting';
      room.hostReady = Boolean(room.hostReady);
      room.guestReady = false;
      room.guest = null;

      cleanupOldRooms();
      await persistRoom(cleanId, room);
      return NextResponse.json(room);
    }

    // 2. JOIN ROOM
    if (action === 'join') {
      const cleanId = sanitizeRoomId(body.roomId);
      const guestUser = body.guestUser;

      if (!cleanId || !ROOM_ID_REGEX.test(cleanId) || !guestUser?.id) {
        return NextResponse.json({ error: 'Invalid join payload' }, { status: 400 });
      }

      const room = await getOrCreateRoom(cleanId);
      const guestData = {
        id: String(guestUser.id).slice(0, 50),
        name: String(guestUser.name || 'Player 2').slice(0, 30),
        joined: true,
        score: Number(guestUser.score) || 0,
        ready: false,
        currentRound: 0,
      };

      room.guest = guestData;
      room.guestReady = false;
      room.status = 'waiting';
      room.countdown = 3;

      if (!room.players) {
        room.players = {};
      }
      room.players[guestUser.id] = {
        id: guestData.id,
        name: guestData.name,
        avatar: String(guestUser.avatar || '⚔️').slice(0, 5),
        score: 0,
        streak: 0,
        maxStreak: 0,
        answers: {},
        isReady: false,
        isHost: false,
      };

      await persistRoom(cleanId, room);
      return NextResponse.json(room);
    }

    // 2b. READY CHECK (HOST OR GUEST TOGGLES READY)
    if (action === 'ready') {
      const cleanId = sanitizeRoomId(body.roomId);
      const isHost = Boolean(body.isHost);
      const isReady = body.isReady !== undefined ? Boolean(body.isReady) : true;

      if (!cleanId || !ROOM_ID_REGEX.test(cleanId)) {
        return NextResponse.json({ error: 'Invalid ready payload' }, { status: 400 });
      }

      const room = await getOrCreateRoom(cleanId);

      if (isHost) {
        room.hostReady = isReady;
        if (room.host) room.host.ready = isReady;
      } else {
        room.guestReady = isReady;
        if (room.guest) room.guest.ready = isReady;
      }

      const bothReady = Boolean(
        room.guest &&
        (room.hostReady ?? room.host?.ready) &&
        (room.guestReady ?? room.guest?.ready)
      );

      if (bothReady) {
        room.status = 'starting';
      }

      await persistRoom(cleanId, room);
      return NextResponse.json(room);
    }

    // 3. START BATTLE
    if (action === 'start') {
      const roomId = sanitizeRoomId(body.roomId);
      if (!roomId || !ROOM_ID_REGEX.test(roomId)) {
        return NextResponse.json({ error: 'Missing or invalid roomId' }, { status: 400 });
      }

      const room = await getOrCreateRoom(roomId);
      room.status = 'in_progress';
      room.currentRound = 0;
      room.roundStartTime = Date.now();

      await persistRoom(roomId, room);
      return NextResponse.json(room);
    }

    // 4. UPDATE LIVE PLAYER SCORE
    if (action === 'score' || action === 'updateScore' || (action === 'answer' && body.isHost !== undefined)) {
      const { roomId, isHost, newScore, newRound, isCorrect } = body;
      const cleanRoomId = sanitizeRoomId(roomId);

      if (!cleanRoomId || !ROOM_ID_REGEX.test(cleanRoomId)) {
        return NextResponse.json({ error: 'Invalid roomId' }, { status: 400 });
      }

      const room = await getOrCreateRoom(cleanRoomId);

      if (isHost && room.host) {
        room.host.score = newScore;
        room.host.currentRound = newRound;
        if (isCorrect !== undefined) room.host.lastAnswerCorrect = isCorrect;
      } else if (room.guest) {
        room.guest.score = newScore;
        room.guest.currentRound = newRound;
        if (isCorrect !== undefined) room.guest.lastAnswerCorrect = isCorrect;
      }

      if ((room.host?.currentRound ?? 0) >= 5 && (room.guest?.currentRound ?? 0) >= 5) {
        room.status = 'completed';
      }

      await persistRoom(cleanRoomId, room);
      return NextResponse.json(room);
    }

    // 5. COMPLETE BATTLE
    if (action === 'complete') {
      const roomId = sanitizeRoomId(body.roomId);
      if (!roomId || !ROOM_ID_REGEX.test(roomId)) {
        return NextResponse.json({ error: 'Missing or invalid roomId' }, { status: 400 });
      }

      const room = await getOrCreateRoom(roomId);
      room.status = 'completed';
      await persistRoom(roomId, room);
      return NextResponse.json(room);
    }

    // 6. SUBMIT ANSWER
    if (action === 'answer') {
      const { roomId, playerId, roundIndex, selected, correctAnswer, timeMs } = body;
      const cleanRoomId = sanitizeRoomId(roomId);

      if (!cleanRoomId || !ROOM_ID_REGEX.test(cleanRoomId)) {
        return NextResponse.json({ error: 'Invalid roomId' }, { status: 400 });
      }

      const room = await getPersistedRoom(cleanRoomId);
      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      const player = room.players?.[playerId];
      if (!player) {
        return NextResponse.json(room);
      }

      if (player.answers?.[roundIndex]) {
        return NextResponse.json(room);
      }

      const storedQuestion = room.questions?.[roundIndex];
      const authoritativeCorrectAnswer = storedQuestion?.correctAnswer;
      const isCorrect = authoritativeCorrectAnswer
        ? selected === authoritativeCorrectAnswer
        : selected === correctAnswer;

      const safeTimeMs = Math.min(Math.max(Number(timeMs) || 15000, 500), 15000);
      const currentStreak = isCorrect ? (player.streak || 0) + 1 : 0;
      const maxStreak = Math.max(player.maxStreak || 0, currentStreak);
      const points = calculateAnswerPoints(isCorrect, safeTimeMs, player.streak || 0);

      const answer: BattleAnswer = {
        selected: String(selected || '').slice(0, 100),
        correct: isCorrect,
        timeMs: safeTimeMs,
        points,
      };

      player.score = (player.score || 0) + points;
      player.streak = currentStreak;
      player.maxStreak = maxStreak;
      if (!player.answers) player.answers = {};
      player.answers[roundIndex] = answer;

      await persistRoom(cleanRoomId, room);
      return NextResponse.json(room);
    }

    // 7. ADVANCE ROUND
    if (action === 'advance') {
      const { roomId, nextRound } = body;
      const cleanRoomId = sanitizeRoomId(roomId);

      if (!cleanRoomId || !ROOM_ID_REGEX.test(cleanRoomId)) {
        return NextResponse.json({ error: 'Invalid roomId' }, { status: 400 });
      }

      const room = await getPersistedRoom(cleanRoomId);
      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      if (room.currentRound >= nextRound) {
        return NextResponse.json(room);
      }

      const isFinished = nextRound >= (room.questions?.length || 5);
      let winnerId: string | undefined = undefined;

      if (isFinished) {
        const playerList = Object.values(room.players || {}) as any[];
        if (playerList.length > 0) {
          playerList.sort((a, b) => (b.score || 0) - (a.score || 0));
          winnerId = playerList[0].id;
        }
      }

      room.currentRound = nextRound;
      room.roundStartTime = Date.now();
      if (isFinished) {
        room.status = 'finished';
      }
      if (winnerId) {
        room.winnerId = winnerId;
      }

      await persistRoom(cleanRoomId, room);
      return NextResponse.json(room);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('Error in /api/battle:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
