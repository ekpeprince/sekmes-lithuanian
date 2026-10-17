import { BATTLE_QUESTIONS } from '@/data/battleQuestions';

export interface BattleRoomPlayer {
  id: string;
  name: string;
  joined: boolean;
  score: number;
  ready?: boolean;
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
  hostReady?: boolean;
  guestReady?: boolean;
  countdown: number; // 3, 2, 1
  currentRound: number;
  tier: string;
  questions: BattleRoomQuestion[];
  createdAt: any;
  countdownStartTime?: number | null;
}

// Universal Room ID sanitization: strips leading '#' and whitespace, uppercase
export function sanitizeRoomId(roomId?: any): string {
  if (!roomId || typeof roomId !== 'string') return '';
  return roomId.trim().replace(/^#+/, '').toUpperCase();
}

// Global pub/sub topic for cross-device real-time sync
export function getRoomTopic(roomId: string): string {
  return `sekmes_1v1_${sanitizeRoomId(roomId).toLowerCase()}`;
}

// Generate 5 questions formatted to the required schema deterministically by seedStr
export function generateBattleRoomQuestions(count: number = 5, seedStr: string = 'DEFAULT'): BattleRoomQuestion[] {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  const seededRandom = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const copy = [...BATTLE_QUESTIONS];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count).map((q) => {
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

  if (!host && data.players) {
    const playersArr: any[] = Object.values(data.players);
    const hostPlayer = playersArr.find((p) => p.isHost) || playersArr[0];
    if (hostPlayer) {
      host = {
        id: hostPlayer.id,
        name: hostPlayer.name || 'Host',
        joined: true,
        score: hostPlayer.score || 0,
        ready: Boolean(hostPlayer.ready ?? data.hostReady),
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
        ready: Boolean(guestPlayer.ready ?? data.guestReady),
        currentRound: guestPlayer.currentRound || 0,
      };
    }
  }

  const hostReady = Boolean(data.hostReady ?? host?.ready);
  const guestReady = Boolean(data.guestReady ?? guest?.ready);

  const questions = Array.isArray(data.questions) && data.questions.length > 0
    ? data.questions
    : generateBattleRoomQuestions(5, roomId);

  return {
    roomId,
    status: (data.status === 'finished' ? 'completed' : data.status) || 'waiting',
    host: host ? { ...host, ready: hostReady } : { id: 'unknown_host', name: 'Host', joined: true, score: 0, ready: hostReady, currentRound: 0 },
    guest: guest ? { ...guest, ready: guestReady } : null,
    hostReady,
    guestReady,
    countdown: typeof data.countdown === 'number' ? data.countdown : 3,
    currentRound: typeof data.currentRound === 'number' ? data.currentRound : 0,
    tier: data.tier || 'SIDABRINĖ LYGA',
    questions,
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

// Broadcast event to public pub/sub relay and server API
export async function broadcastRoomEvent(roomId: string, eventData: any): Promise<void> {
  const cleanId = sanitizeRoomId(roomId);
  if (!cleanId) return;

  const topic = getRoomTopic(cleanId);
  const payload = {
    ...eventData,
    roomId: cleanId,
    timestamp: Date.now(),
  };

  // 1. ntfy.sh public pub/sub relay (instant cross-device delivery worldwide)
  try {
    fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {}

  // 2. Server API route synchronization
  try {
    fetch('/api/battle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {}
}

/**
 * 1. Create a new Battle Room
 */
export async function createBattleRoom(
  hostUser: { id: string; name: string },
  tier: string = 'SIDABRINĖ LYGA',
  customRoomId?: string
): Promise<BattleRoomDoc> {
  const cleanId = customRoomId ? sanitizeRoomId(customRoomId) : Math.random().toString(36).substring(2, 8).toUpperCase();
  const roomId = cleanId;
  const questions = generateBattleRoomQuestions(5, roomId);

  const roomDoc: BattleRoomDoc = {
    roomId,
    status: 'waiting',
    host: {
      id: hostUser.id,
      name: hostUser.name || 'Host',
      joined: true,
      score: 0,
      ready: false,
      currentRound: 0,
    },
    guest: null,
    hostReady: false,
    guestReady: false,
    countdown: 3,
    currentRound: 0,
    tier,
    questions,
    createdAt: Date.now(),
  };

  // Immediate local cache for instant UI feedback
  saveLocalRoom(roomDoc);

  // Broadcast create event to pub/sub and server API
  await broadcastRoomEvent(roomId, { action: 'create', room: roomDoc });

  return roomDoc;
}

// Reconstruct room state by replaying an array of event payloads
export function applyEventsToRoom(baseRoom: BattleRoomDoc | null, events: any[]): BattleRoomDoc | null {
  let room: BattleRoomDoc | null = baseRoom ? { ...baseRoom } : null;

  for (const ev of events) {
    if (!ev || !ev.action) continue;

    if (!room && ev.roomId) {
      const roomId = sanitizeRoomId(ev.roomId);
      room = {
        roomId,
        status: 'waiting',
        host: { id: 'host', name: 'Host', joined: true, score: 0, ready: false, currentRound: 0 },
        guest: null,
        hostReady: false,
        guestReady: false,
        countdown: 3,
        currentRound: 0,
        tier: 'SIDABRINĖ LYGA',
        questions: generateBattleRoomQuestions(5, roomId),
        createdAt: Date.now(),
      };
    }

    if (ev.action === 'create' && ev.room) {
      const existingGuest = room?.guest;
      const existingGuestReady = room?.guestReady;
      room = mapServerRoomToDoc(ev.room);
      if (existingGuest && !room.guest) {
        room.guest = existingGuest;
        room.guestReady = existingGuestReady ?? false;
      }
    } else if (ev.action === 'join') {
      const guestData = ev.guest || ev.guestUser;
      if (guestData) {
        if (!room) {
          const roomId = sanitizeRoomId(ev.roomId);
          room = {
            roomId,
            status: 'waiting',
            host: { id: 'host', name: 'Host', joined: true, score: 0, ready: false, currentRound: 0 },
            guest: {
              id: guestData.id,
              name: guestData.name || 'Player 2',
              joined: true,
              score: guestData.score || 0,
              ready: false,
              currentRound: 0,
            },
            hostReady: false,
            guestReady: false,
            countdown: 3,
            currentRound: 0,
            tier: 'SIDABRINĖ LYGA',
            questions: generateBattleRoomQuestions(5, roomId),
            createdAt: Date.now(),
          };
        } else {
          room.guest = {
            id: guestData.id,
            name: guestData.name || 'Player 2',
            joined: true,
            score: guestData.score || 0,
            ready: false,
            currentRound: 0,
          };
          room.guestReady = false;
          if (room.status === 'ready' || !room.status) {
            room.status = 'waiting';
          }
        }
      }
    } else if (ev.action === 'ready' && room) {
      const isHost = Boolean(ev.isHost);
      const isReady = Boolean(ev.isReady ?? true);

      if (isHost) {
        room.hostReady = isReady;
        if (room.host) room.host.ready = isReady;
      } else {
        room.guestReady = isReady;
        if (room.guest) room.guest.ready = isReady;
      }

      const hostIsReady = Boolean(room.hostReady ?? room.host?.ready);
      const guestIsReady = Boolean(room.guestReady ?? room.guest?.ready);
      if (room.guest && hostIsReady && guestIsReady) {
        room.status = 'starting';
      }
    } else if (ev.action === 'start' && room) {
      room.status = 'in_progress';
    } else if (ev.action === 'score' && room) {
      if (ev.isHost) {
        room.host.score = ev.newScore;
        room.host.currentRound = ev.newRound;
        if (ev.isCorrect !== undefined) room.host.lastAnswerCorrect = ev.isCorrect;
      } else if (room.guest) {
        room.guest.score = ev.newScore;
        room.guest.currentRound = ev.newRound;
        if (ev.isCorrect !== undefined) room.guest.lastAnswerCorrect = ev.isCorrect;
      }
      if ((room.host.currentRound ?? 0) >= 5 && (room.guest?.currentRound ?? 0) >= 5) {
        room.status = 'completed';
      }
    } else if (ev.action === 'complete' && room) {
      room.status = 'completed';
    }
  }

  return room;
}

/**
 * 2. Fetch Battle Room by roomId
 */
export async function getBattleRoom(roomId: string): Promise<BattleRoomDoc | null> {
  const cleanId = sanitizeRoomId(roomId);
  if (!cleanId) return null;

  const local = getLocalRoom(cleanId);
  const topic = getRoomTopic(cleanId);

  // 1. Fetch event log from ntfy.sh
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => controller.abort(), 2000) : null;
    const res = await fetch(`https://ntfy.sh/${topic}/json?poll=1&since=all`, { signal: controller?.signal });
    if (timeout) clearTimeout(timeout);

    if (res.ok) {
      const text = await res.text();
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      const events: any[] = [];
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.event === 'message' && parsed.message) {
            const body = typeof parsed.message === 'string' ? JSON.parse(parsed.message) : parsed.message;
            events.push(body);
          }
        } catch {}
      }

      if (events.length > 0) {
        const reconstructed = applyEventsToRoom(local, events);
        if (reconstructed) {
          saveLocalRoom(reconstructed);
          return reconstructed;
        }
      }
    }
  } catch (err) {
    console.warn('[BATTLE_SYNC_WARN]: ntfy fetch error:', err);
  }

  // 2. Fallback to Server API Route /api/battle
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => controller.abort(), 1500) : null;
    const res = await fetch(`/api/battle?roomId=${cleanId}`, { signal: controller?.signal });
    if (timeout) clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const mapped = mapServerRoomToDoc(data);
      saveLocalRoom(mapped);
      return mapped;
    }
  } catch {}

  return local;
}

/**
 * 3. Guest Join: Updates local, pub/sub & API route with guest in lobby
 */
export async function joinBattleRoom(
  roomId: string,
  guestUser: { id: string; name: string }
): Promise<BattleRoomDoc> {
  const cleanId = sanitizeRoomId(roomId);
  const guestData: BattleRoomPlayer = {
    id: guestUser.id,
    name: guestUser.name || 'Player 2',
    joined: true,
    score: 0,
    ready: false,
    currentRound: 0,
  };

  let existing = getLocalRoom(cleanId);
  if (!existing) {
    existing = await getBattleRoom(cleanId);
  }
  const updatedRoom: BattleRoomDoc = existing
    ? {
        ...existing,
        guest: guestData,
        guestReady: false,
        status: 'waiting',
        countdown: 3,
      }
    : {
        roomId: cleanId,
        status: 'waiting',
        host: { id: 'host_fallback', name: 'Host', joined: true, score: 0, ready: false, currentRound: 0 },
        guest: guestData,
        hostReady: false,
        guestReady: false,
        countdown: 3,
        currentRound: 0,
        tier: 'SIDABRINĖ LYGA',
        questions: generateBattleRoomQuestions(5, cleanId),
        createdAt: Date.now(),
      };

  saveLocalRoom(updatedRoom);

  // Broadcast join event to host and server
  await broadcastRoomEvent(cleanId, {
    action: 'join',
    roomId: cleanId,
    guest: guestData,
    guestUser: guestData,
  });

  return updatedRoom;
}

/**
 * 4. Toggle Player Ready (Both Host and Guest must be ready before match countdown begins)
 */
export async function setBattlePlayerReady(
  roomId: string,
  isHost: boolean,
  isReady: boolean = true
): Promise<void> {
  const cleanId = sanitizeRoomId(roomId);
  const existing = getLocalRoom(cleanId);
  let bothReady = false;

  if (existing) {
    if (isHost) {
      existing.hostReady = isReady;
      if (existing.host) existing.host.ready = isReady;
    } else {
      existing.guestReady = isReady;
      if (existing.guest) existing.guest.ready = isReady;
    }
    bothReady = Boolean(
      existing.guest &&
      (existing.hostReady ?? existing.host?.ready) &&
      (existing.guestReady ?? existing.guest?.ready)
    );
    if (bothReady) {
      existing.status = 'starting';
    }
    saveLocalRoom(existing);
  }

  await broadcastRoomEvent(cleanId, {
    action: 'ready',
    roomId: cleanId,
    isHost,
    isReady,
    bothReady,
  });
}

/**
 * 5. Start Match: Updates status: 'in_progress'
 */
export async function startBattleRoomMatch(roomId: string): Promise<void> {
  const cleanId = sanitizeRoomId(roomId);
  const existing = getLocalRoom(cleanId);
  if (existing) {
    existing.status = 'in_progress';
    saveLocalRoom(existing);
  }

  await broadcastRoomEvent(cleanId, { action: 'start', roomId: cleanId });
}

/**
 * 6. Update live player score
 */
export async function updateBattlePlayerScore(
  roomId: string,
  isHost: boolean,
  newScore: number,
  newRound: number,
  isCorrect?: boolean
): Promise<void> {
  const cleanId = sanitizeRoomId(roomId);
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

  await broadcastRoomEvent(cleanId, {
    action: 'score',
    roomId: cleanId,
    isHost,
    newScore,
    newRound,
    isCorrect,
  });
}

/**
 * 7. Set room completed
 */
export async function setBattleRoomCompleted(roomId: string): Promise<void> {
  const cleanId = sanitizeRoomId(roomId);
  const existing = getLocalRoom(cleanId);
  if (existing) {
    existing.status = 'completed';
    saveLocalRoom(existing);
  }

  await broadcastRoomEvent(cleanId, { action: 'complete', roomId: cleanId });
}

/**
 * 8. Live Real-Time Listener (SSE Stream via ntfy.sh + fast 1s Polling Fallback + Local Event Sync)
 * Guarantees instant 1v1 cross-device connection and ready status updates
 */
export function listenToBattleRoom(
  roomId: string,
  onUpdate: (room: BattleRoomDoc | null) => void
): () => void {
  const cleanId = sanitizeRoomId(roomId);
  if (!cleanId) return () => {};

  let currentRoom: BattleRoomDoc | null = getLocalRoom(cleanId);
  let isCancelled = false;
  let eventSource: any = null;

  // Dispatch initial local room immediately
  if (currentRoom) {
    onUpdate(currentRoom);
  }

  // Cross-tab / window storage listener
  const handleStorage = (e: StorageEvent) => {
    if (e.key === `battle_room_${cleanId}` && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        currentRoom = parsed;
        onUpdate(parsed);
      } catch {}
    }
  };

  const handleCustomSync = (e: Event) => {
    const custom = e as CustomEvent<{ roomId: string; room: BattleRoomDoc }>;
    if (custom.detail?.roomId && sanitizeRoomId(custom.detail.roomId) === cleanId && custom.detail?.room) {
      currentRoom = custom.detail.room;
      onUpdate(custom.detail.room);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
    window.addEventListener('battle_room_local_sync', handleCustomSync);
  }

  // Helper to handle any incoming event payload
  const handleEventPayload = (payload: any) => {
    if (isCancelled || !payload) return;
    const updated = applyEventsToRoom(currentRoom, [payload]);
    if (updated) {
      currentRoom = updated;
      saveLocalRoom(updated);
      onUpdate(updated);
    }
  };

  const topic = getRoomTopic(cleanId);

  // 1. Connect to SSE live stream for <50ms real-time event delivery
  if (typeof window !== 'undefined' && typeof EventSource !== 'undefined') {
    try {
      eventSource = new EventSource(`https://ntfy.sh/${topic}/sse`);

      eventSource.onmessage = (event: MessageEvent) => {
        if (isCancelled) return;
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'message' && data.message) {
            const body = typeof data.message === 'string' ? JSON.parse(data.message) : data.message;
            handleEventPayload(body);
          }
        } catch (e) {
          console.warn('[BATTLE_SYNC_SSE_PARSE_WARN]:', e);
        }
      };

      eventSource.onerror = () => {
        // SSE will automatically attempt reconnection; polling acts as fallback
      };
    } catch (err) {
      console.warn('[BATTLE_SYNC_SSE_INIT_WARN]:', err);
    }
  }

  // 2. Active Polling Fallback (Polls ntfy.sh since=all on start, then /api/battle & ntfy)
  let initialPollDone = false;
  const pollHistory = async () => {
    if (isCancelled) return;
    try {
      const url = initialPollDone
        ? `https://ntfy.sh/${topic}/json?poll=1&since=all`
        : `https://ntfy.sh/${topic}/json?poll=1&since=all`;
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        const events: any[] = [];
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.event === 'message' && parsed.message) {
              const body = typeof parsed.message === 'string' ? JSON.parse(parsed.message) : parsed.message;
              events.push(body);
            }
          } catch {}
        }
        if (events.length > 0) {
          const updated = applyEventsToRoom(currentRoom, events);
          if (updated) {
            currentRoom = updated;
            saveLocalRoom(updated);
            onUpdate(updated);
          }
        }
      }
      initialPollDone = true;
    } catch {}

    // Fallback poll /api/battle (never overwrite a known guest or downgrade ready status)
    try {
      const res = await fetch(`/api/battle?roomId=${cleanId}`);
      if (res.ok) {
        const serverData = await res.json();
        const mapped = mapServerRoomToDoc(serverData);
        if (mapped) {
          if (currentRoom?.guest && !mapped.guest) {
            mapped.guest = currentRoom.guest;
            mapped.guestReady = currentRoom.guestReady ?? currentRoom.guest.ready;
          }
          if (currentRoom?.hostReady && !mapped.hostReady) {
            mapped.hostReady = true;
            if (mapped.host) mapped.host.ready = true;
          }
          if (currentRoom?.guestReady && !mapped.guestReady) {
            mapped.guestReady = true;
            if (mapped.guest) mapped.guest.ready = true;
          }
          if (mapped.guest || mapped.status !== 'waiting') {
            currentRoom = mapped;
            saveLocalRoom(mapped);
            onUpdate(mapped);
          }
        }
      }
    } catch {}
  };

  pollHistory();
  const pollInterval = setInterval(pollHistory, 1200);

  return () => {
    isCancelled = true;
    clearInterval(pollInterval);
    if (eventSource) {
      try { eventSource.close(); } catch {}
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('battle_room_local_sync', handleCustomSync);
    }
  };
}
