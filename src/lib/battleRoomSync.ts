import { BATTLE_QUESTIONS } from '@/data/battleQuestions';

export interface BattleRoomPlayer {
  id: string;
  name: string;
  joined: boolean;
  score: number;
  currentRound?: number;
  lastAnswerCorrect?: boolean;
}

export interface BattleRoomQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  englishSubtitle?: string;
  category?: string;
}

export type BattleRoomStatus = 'waiting' | 'ready' | 'starting' | 'in_progress' | 'completed';

export interface BattleRoomDoc {
  roomId: string;
  status: BattleRoomStatus;
  host: BattleRoomPlayer;
  guest: BattleRoomPlayer | null;
  countdown: number; // 3, 2, 1
  currentRound: number;
  tier: string;
  questions: BattleRoomQuestion[];
  createdAt: any;
  countdownStartTime?: number | null;
}

// Generate 5 questions formatted to the required schema
export function generateBattleRoomQuestions(count: number = 5): BattleRoomQuestion[] {
  const shuffled = [...BATTLE_QUESTIONS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map((q) => {
    const answerIdx = q.options.findIndex((opt) => opt.lt === q.correctAnswer);
    return {
      id: q.id,
      question: q.prompt,
      options: q.options.map((opt) => opt.lt),
      answerIndex: answerIdx >= 0 ? answerIdx : 0,
      englishSubtitle: q.englishSubtitle,
      category: q.category,
    };
  });
}

// Helper: map server room response to client BattleRoomDoc schema
export function mapServerRoomToDoc(data: any): BattleRoomDoc {
  if (!data) return data;
  const roomId = data.roomId || data.id || '';

  let host: BattleRoomPlayer = data.host;
  let guest: BattleRoomPlayer | null = data.guest || null;

  // Fallback if room was stored using older players dictionary schema
  if (!host && data.players) {
    const playersArr: any[] = Object.values(data.players);
    const hostPlayer = playersArr.find((p) => p.isHost) || playersArr[0];
    if (hostPlayer) {
      host = {
        id: hostPlayer.id,
        name: hostPlayer.name || 'Host',
        joined: true,
        score: hostPlayer.score || 0,
        currentRound: hostPlayer.currentRound || 0,
      };
    }
  }

  if (!guest && data.players) {
    const playersArr: any[] = Object.values(data.players);
    const guestPlayer = playersArr.find((p) => !p.isHost && p.id !== host?.id);
    if (guestPlayer) {
      guest = {
        id: guestPlayer.id,
        name: guestPlayer.name || 'Player 2',
        joined: true,
        score: guestPlayer.score || 0,
        currentRound: guestPlayer.currentRound || 0,
      };
    }
  }

  return {
    roomId,
    status: (data.status === 'finished' ? 'completed' : data.status) || 'waiting',
    host: host || { id: 'unknown_host', name: 'Host', joined: true, score: 0, currentRound: 0 },
    guest,
    countdown: typeof data.countdown === 'number' ? data.countdown : 3,
    currentRound: typeof data.currentRound === 'number' ? data.currentRound : 0,
    tier: data.tier || 'SIDABRINĖ LYGA',
    questions: Array.isArray(data.questions) ? data.questions : [],
    createdAt: data.createdAt || Date.now(),
    countdownStartTime: data.countdownStartTime ?? null,
  };
}

// Local storage helper for instant responsiveness & offline fallback
function saveLocalRoom(room: BattleRoomDoc) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`battle_room_${room.roomId}`, JSON.stringify(room));
    window.dispatchEvent(
      new CustomEvent('battle_room_local_sync', { detail: { roomId: room.roomId, room } })
    );
  } catch {
    // Ignore storage quota or security errors
  }
}

function getLocalRoom(roomId: string): BattleRoomDoc | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`battle_room_${roomId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * 1. Create a new Battle Room via POST /api/battle
 */
export async function createBattleRoom(
  hostUser: { id: string; name: string },
  tier: string = 'SIDABRINĖ LYGA'
): Promise<BattleRoomDoc> {
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const questions = generateBattleRoomQuestions(5);

  const roomDoc: BattleRoomDoc = {
    roomId,
    status: 'waiting',
    host: {
      id: hostUser.id,
      name: hostUser.name || 'Host',
      joined: true,
      score: 0,
      currentRound: 0,
    },
    guest: null,
    countdown: 3,
    currentRound: 0,
    tier,
    questions,
    createdAt: Date.now(),
  };

  // Immediate local cache
  saveLocalRoom(roomDoc);

  try {
    const res = await fetch('/api/battle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        room: {
          id: roomId,
          ...roomDoc,
        },
      }),
    });
    if (res.ok) {
      const roomData = await res.json();
      const mapped = mapServerRoomToDoc(roomData);
      saveLocalRoom(mapped);
      return mapped;
    }
  } catch (err) {
    console.error('[BATTLE_SYNC_ERROR]: Failed to create room on server:', err);
  }

  return roomDoc;
}

/**
 * 2. Fetch Battle Room by roomId via GET /api/battle?roomId=...
 */
export async function getBattleRoom(roomId: string): Promise<BattleRoomDoc | null> {
  const cleanId = roomId.trim().toUpperCase();

  try {
    const res = await fetch(`/api/battle?roomId=${cleanId}`);
    if (res.ok) {
      const roomData = await res.json();
      const mapped = mapServerRoomToDoc(roomData);
      saveLocalRoom(mapped);
      return mapped;
    }
  } catch (err) {
    console.error('[BATTLE_SYNC_ERROR]: Failed to get battle room from server:', err);
  }

  return getLocalRoom(cleanId);
}

/**
 * 3. Guest Join: POST /api/battle with action: 'join'
 */
export async function joinBattleRoom(
  roomId: string,
  guestUser: { id: string; name: string }
): Promise<BattleRoomDoc> {
  const cleanId = roomId.trim().toUpperCase();
  const guestData: BattleRoomPlayer = {
    id: guestUser.id,
    name: guestUser.name || 'Player 2',
    joined: true,
    score: 0,
    currentRound: 0,
  };

  try {
    const res = await fetch('/api/battle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'join',
        roomId: cleanId,
        guestUser: guestData,
      }),
    });

    if (res.ok) {
      const roomData = await res.json();
      const mapped = mapServerRoomToDoc(roomData);
      saveLocalRoom(mapped);
      return mapped;
    }
  } catch (err) {
    console.error('[BATTLE_SYNC_ERROR]: Failed to join room on server:', err);
  }

  // Local fallback
  const existing = getLocalRoom(cleanId);
  const updatedRoom: BattleRoomDoc = existing
    ? {
        ...existing,
        guest: guestData,
        status: 'ready',
        countdown: 3,
      }
    : {
        roomId: cleanId,
        status: 'ready',
        host: { id: 'host_fallback', name: 'Host', joined: true, score: 0, currentRound: 0 },
        guest: guestData,
        countdown: 3,
        currentRound: 0,
        tier: 'SIDABRINĖ LYGA',
        questions: generateBattleRoomQuestions(5),
        createdAt: Date.now(),
      };

  saveLocalRoom(updatedRoom);
  return updatedRoom;
}

/**
 * 4. Start Match: POST /api/battle with action: 'start'
 */
export async function startBattleRoomMatch(roomId: string): Promise<void> {
  const cleanId = roomId.trim().toUpperCase();
  const existing = getLocalRoom(cleanId);
  if (existing) {
    existing.status = 'in_progress';
    saveLocalRoom(existing);
  }

  try {
    await fetch('/api/battle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start',
        roomId: cleanId,
      }),
    });
  } catch (err) {
    console.error('[BATTLE_SYNC_ERROR]: Failed to start match on server:', err);
  }
}

/**
 * 5. Update live player score: POST /api/battle with action: 'score'
 */
export async function updateBattlePlayerScore(
  roomId: string,
  isHost: boolean,
  newScore: number,
  newRound: number,
  isCorrect?: boolean
): Promise<void> {
  const cleanId = roomId.trim().toUpperCase();
  const existing = getLocalRoom(cleanId);

  if (existing) {
    if (isHost) {
      existing.host.score = newScore;
      existing.host.currentRound = newRound;
      if (isCorrect !== undefined) existing.host.lastAnswerCorrect = isCorrect;
    } else if (existing.guest) {
      existing.guest.score = newScore;
      existing.guest.currentRound = newRound;
      if (isCorrect !== undefined) existing.guest.lastAnswerCorrect = isCorrect;
    }
    if ((existing.host.currentRound ?? 0) >= 5 && (existing.guest?.currentRound ?? 0) >= 5) {
      existing.status = 'completed';
    }
    saveLocalRoom(existing);
  }

  try {
    await fetch('/api/battle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'score',
        roomId: cleanId,
        isHost,
        newScore,
        newRound,
        isCorrect,
      }),
    });
  } catch (err) {
    console.error('[BATTLE_SYNC_ERROR]: Failed to update score on server:', err);
  }
}

/**
 * 6. Set room completed: POST /api/battle with action: 'complete'
 */
export async function setBattleRoomCompleted(roomId: string): Promise<void> {
  const cleanId = roomId.trim().toUpperCase();
  const existing = getLocalRoom(cleanId);
  if (existing) {
    existing.status = 'completed';
    saveLocalRoom(existing);
  }

  try {
    await fetch('/api/battle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'complete',
        roomId: cleanId,
      }),
    });
  } catch (err) {
    console.error('[BATTLE_SYNC_ERROR]: Failed to set room completed on server:', err);
  }
}

/**
 * 7. Active Polling Listener: Polls /api/battle?roomId=... every 1000ms
 */
export function listenToBattleRoom(
  roomId: string,
  onUpdate: (room: BattleRoomDoc | null) => void
): () => void {
  const cleanId = roomId.trim().toUpperCase();

  // Initial local state
  const initial = getLocalRoom(cleanId);
  if (initial) {
    onUpdate(initial);
  }

  // Cross-tab / window storage listener
  const handleStorage = (e: StorageEvent) => {
    if (e.key === `battle_room_${cleanId}` && e.newValue) {
      try {
        onUpdate(JSON.parse(e.newValue));
      } catch {}
    }
  };

  const handleCustomSync = (e: Event) => {
    const custom = e as CustomEvent<{ roomId: string; room: BattleRoomDoc }>;
    if (custom.detail?.roomId?.toUpperCase() === cleanId && custom.detail?.room) {
      onUpdate(custom.detail.room);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
    window.addEventListener('battle_room_local_sync', handleCustomSync);
  }

  // Active poller function
  const fetchRoom = async () => {
    try {
      const res = await fetch(`/api/battle?roomId=${cleanId}`);
      if (res.ok) {
        const roomData = await res.json();
        const mapped = mapServerRoomToDoc(roomData);
        saveLocalRoom(mapped);
        onUpdate(mapped);
      }
    } catch (err) {
      console.error('[BATTLE_SYNC_POLL_ERROR]:', err);
    }
  };

  // Immediate poll on mount
  fetchRoom();

  // 1000ms active polling
  const pollTimer = setInterval(fetchRoom, 1000);

  return () => {
    clearInterval(pollTimer);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('battle_room_local_sync', handleCustomSync);
    }
  };
}
