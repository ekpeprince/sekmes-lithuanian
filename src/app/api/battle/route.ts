import { NextRequest, NextResponse } from 'next/server';
import { BattleRoom, BattlePlayer, BattleAnswer, calculateAnswerPoints } from '@/lib/battleSync';

export const runtime = 'nodejs';

// Server-side in-memory active battle rooms registry
// Accessible across any devices/browsers playing together
const serverRooms = new Map<string, BattleRoom>();

// Clean up rooms older than 2 hours periodically
function cleanupOldRooms() {
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, r] of serverRooms.entries()) {
    if (r.createdAt < twoHoursAgo) {
      serverRooms.delete(id);
    }
  }
}

// GET /api/battle?roomId=ABC-123
export async function GET(request: NextRequest) {
  cleanupOldRooms();

  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId')?.trim().toUpperCase();

  if (!roomId) {
    return NextResponse.json({ error: 'Missing roomId parameter' }, { status: 400 });
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
      if (!room || !room.id) {
        return NextResponse.json({ error: 'Invalid room payload' }, { status: 400 });
      }
      serverRooms.set(room.id.toUpperCase(), room);
      return NextResponse.json(room);
    }

    // 2. JOIN ROOM
    if (action === 'join') {
      const roomId = body.roomId?.trim().toUpperCase();
      const guestUser: { id: string; name: string; avatar: string } = body.guestUser;

      if (!roomId || !guestUser?.id) {
        return NextResponse.json({ error: 'Invalid join payload' }, { status: 400 });
      }

      const room = serverRooms.get(roomId);
      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      if (!room.players[guestUser.id]) {
        room.players[guestUser.id] = {
          id: guestUser.id,
          name: guestUser.name || 'Draugas',
          avatar: guestUser.avatar || '🦁',
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
      if (!roomId) {
        return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
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

    // 4. SUBMIT ANSWER
    if (action === 'answer') {
      const { roomId, playerId, roundIndex, selected, correctAnswer, timeMs } = body;
      const cleanRoomId = roomId?.trim().toUpperCase();

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

      const isCorrect = selected === correctAnswer;
      const currentStreak = isCorrect ? player.streak + 1 : 0;
      const points = calculateAnswerPoints(isCorrect, timeMs || 15000, player.streak);

      const answer: BattleAnswer = {
        selected,
        correct: isCorrect,
        timeMs: timeMs || 15000,
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
