import { NextRequest, NextResponse } from 'next/server';
import { BattleRoom, BattlePlayer, BattleAnswer, calculateAnswerPoints } from '@/lib/battleSync';

export const runtime = 'nodejs';

// Server-side in-memory active battle rooms registry
// Accessible across any devices/browsers playing together
const serverRooms = new Map<string, BattleRoom>();

const MAX_SERVER_ROOMS = 500;
const ROOM_ID_REGEX = /^[A-Z0-9-]{3,16}$/;

// Clean up rooms older than 2 hours periodically or enforce maximum capacity
function cleanupOldRooms() {
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, r] of serverRooms.entries()) {
    if (r.createdAt < twoHoursAgo) {
      serverRooms.delete(id);
    }
  }

  // If still exceeding capacity, prune oldest rooms
  if (serverRooms.size > MAX_SERVER_ROOMS) {
    const sorted = Array.from(serverRooms.entries()).sort(
      (a, b) => a[1].createdAt - b[1].createdAt
    );
    const toRemove = sorted.slice(0, serverRooms.size - MAX_SERVER_ROOMS);
    for (const [id] of toRemove) {
      serverRooms.delete(id);
    }
  }
}

// GET /api/battle?roomId=ABC-123
export async function GET(request: NextRequest) {
  cleanupOldRooms();

  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId')?.trim().toUpperCase();

  if (!roomId || !ROOM_ID_REGEX.test(roomId)) {
    return NextResponse.json({ error: 'Invalid or missing roomId parameter' }, { status: 400 });
  }

  const room = serverRooms.get(roomId);
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  return NextResponse.json(room);
}

// POST /api/battle
export async function POST(request: NextRequest) {
  cleanupOldRooms();

  try {
    const body = await request.json();
    const { action } = body;

    // 1. CREATE ROOM
    if (action === 'create') {
      const room: BattleRoom = body.room;
      if (!room || !room.id || !ROOM_ID_REGEX.test(room.id)) {
        return NextResponse.json({ error: 'Invalid room payload or format' }, { status: 400 });
      }

      // Sanitize room size & question limit
      if (!Array.isArray(room.questions) || room.questions.length > 10) {
        return NextResponse.json({ error: 'Invalid questions payload' }, { status: 400 });
      }

      cleanupOldRooms();
      serverRooms.set(room.id.toUpperCase(), room);
      return NextResponse.json(room);
    }

    // 2. JOIN ROOM
    if (action === 'join') {
      const roomId = body.roomId?.trim().toUpperCase();
      const guestUser = body.guestUser;

      if (!roomId || !ROOM_ID_REGEX.test(roomId) || !guestUser?.id) {
        return NextResponse.json({ error: 'Invalid join payload' }, { status: 400 });
      }

      const room = serverRooms.get(roomId);
      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      // Limit room to 2 players max for 1v1 duel
      const currentPlayers = Object.keys(room.players || {});
      if (currentPlayers.length >= 2 && !room.players[guestUser.id]) {
        return NextResponse.json({ error: 'Room is already full' }, { status: 403 });
      }

      if (!room.players[guestUser.id]) {
        room.players[guestUser.id] = {
          id: String(guestUser.id).slice(0, 50),
          name: String(guestUser.name || 'Draugas').slice(0, 30),
          avatar: String(guestUser.avatar || '🦁').slice(0, 5),
          score: 0,
          streak: 0,
          answers: {},
          isReady: true,
          isHost: false,
        };
      }

      serverRooms.set(roomId, room);
      return NextResponse.json(room);
    }

    // 3. START BATTLE
    if (action === 'start') {
      const roomId = body.roomId?.trim().toUpperCase();
      if (!roomId || !ROOM_ID_REGEX.test(roomId)) {
        return NextResponse.json({ error: 'Missing or invalid roomId' }, { status: 400 });
      }

      const room = serverRooms.get(roomId);
      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      room.status = 'in_progress';
      room.currentRound = 0;
      room.roundStartTime = Date.now();

      serverRooms.set(roomId, room);
      return NextResponse.json(room);
    }

    // 4. SUBMIT ANSWER (Server-Authoritative Answer Verification)
    if (action === 'answer') {
      const { roomId, playerId, roundIndex, selected, correctAnswer, timeMs } = body;
      const cleanRoomId = roomId?.trim().toUpperCase();

      if (!cleanRoomId || !ROOM_ID_REGEX.test(cleanRoomId)) {
        return NextResponse.json({ error: 'Invalid roomId' }, { status: 400 });
      }

      const room = serverRooms.get(cleanRoomId);
      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      const player = room.players[playerId];
      if (!player) {
        return NextResponse.json(room);
      }

      // If player already answered this round, do not overwrite
      if (player.answers[roundIndex]) {
        return NextResponse.json(room);
      }

      // Security: Validate answer authoritatively against the stored question
      const storedQuestion = room.questions[roundIndex];
      const authoritativeCorrectAnswer = storedQuestion?.correctAnswer;
      const isCorrect = authoritativeCorrectAnswer
        ? selected === authoritativeCorrectAnswer
        : selected === correctAnswer;

      const safeTimeMs = Math.min(Math.max(Number(timeMs) || 15000, 500), 15000);
      const currentStreak = isCorrect ? player.streak + 1 : 0;
      const points = calculateAnswerPoints(isCorrect, safeTimeMs, player.streak);

      const answer: BattleAnswer = {
        selected: String(selected || '').slice(0, 100),
        correct: isCorrect,
        timeMs: safeTimeMs,
        points,
      };

      player.score += points;
      player.streak = currentStreak;
      player.answers[roundIndex] = answer;

      serverRooms.set(cleanRoomId, room);
      return NextResponse.json(room);
    }

    // 5. ADVANCE ROUND
    if (action === 'advance') {
      const { roomId, nextRound } = body;
      const cleanRoomId = roomId?.trim().toUpperCase();

      if (!cleanRoomId || !ROOM_ID_REGEX.test(cleanRoomId)) {
        return NextResponse.json({ error: 'Invalid roomId' }, { status: 400 });
      }

      const room = serverRooms.get(cleanRoomId);
      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      // Idempotency check: don't double advance
      if (room.currentRound >= nextRound) {
        return NextResponse.json(room);
      }

      const isFinished = nextRound >= room.questions.length;
      let winnerId: string | undefined = undefined;

      if (isFinished) {
        const playerList = Object.values(room.players);
        if (playerList.length > 0) {
          playerList.sort((a, b) => b.score - a.score);
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

      serverRooms.set(cleanRoomId, room);
      return NextResponse.json(room);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('Error in /api/battle:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
