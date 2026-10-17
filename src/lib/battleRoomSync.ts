import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth, isFirebaseConfigured } from './firebase';
import { BATTLE_QUESTIONS } from '@/data/battleQuestions';

// Helper: Ensure anonymous or active auth session exists before Firestore read/write
async function ensureAuthSession(): Promise<void> {
  if (!auth) return;
  if (auth.currentUser) return;
  try {
    await signInAnonymously(auth);
  } catch (err) {
    console.warn('[BATTLE_SYNC_AUTH_WARN]: Anonymous auth notice:', err);
  }
}

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

// Strip undefined fields for Firestore compatibility
function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

// Universal Room ID sanitization: strips leading '#' and whitespace, uppercase
export function sanitizeRoomId(roomId?: any): string {
  if (!roomId || typeof roomId !== 'string') return '';
  return roomId.trim().replace(/^#+/, '').toUpperCase();
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

  // If questions are missing or empty, automatically populate deterministically by roomId
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

/**
 * 1. Create a new Battle Room (Canonical Store: Firestore battle_rooms/{roomId})
 */
export async function createBattleRoom(
  hostUser: { id: string; name: string },
  tier: string = 'SIDABRINĖ LYGA',
  customRoomId?: string
): Promise<BattleRoomDoc> {
  await ensureAuthSession();

  const cleanId = customRoomId ? customRoomId.trim().replace(/^#+/, '').toUpperCase() : Math.random().toString(36).substring(2, 8).toUpperCase();
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

  // Canonical Firestore write (dual-write to battle_rooms & battles for compatibility)
  if (db && isFirebaseConfigured) {
    const payload = {
      id: roomId,
      ...sanitizeForFirestore(roomDoc),
      status: 'waiting',
      hostReady: false,
      guestReady: false,
      guest: null,
      createdAt: Date.now(),
    };
    setDoc(doc(db, 'battle_rooms', roomId), payload, { merge: true }).catch((err) => {
      console.warn('[BATTLE_SYNC_WARN]: Firestore room creation error (battle_rooms):', err);
    });
    setDoc(doc(db, 'battles', roomId), payload, { merge: true }).catch(() => {});
  }

  // Server API route synchronization (guarantees cross-device delivery regardless of client auth state)
  try {
    fetch('/api/battle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', room: roomDoc }),
    }).catch(() => {});
  } catch {}

  return roomDoc;
}

/**
 * 2. Fetch Battle Room by roomId (Hybrid: Firestore + API Route fallback)
 */
export async function getBattleRoom(roomId: string): Promise<BattleRoomDoc | null> {
  await ensureAuthSession();

  const cleanId = roomId.trim().replace(/^#+/, '').toUpperCase();
  if (!cleanId) return null;

  // 1. Direct Firestore fetch from battle_rooms
  if (db && isFirebaseConfigured) {
    try {
      const snapPromise = getDoc(doc(db, 'battle_rooms', cleanId));
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
      const snap = (await Promise.race([snapPromise, timeoutPromise])) as any;

      if (snap && snap.exists && snap.exists()) {
        const mapped = mapServerRoomToDoc({ id: snap.id, ...snap.data() });
        saveLocalRoom(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('[BATTLE_SYNC_WARN]: Firestore battle_rooms getDoc error:', err);
    }

    // 2. Fallback to 'battles' collection
    try {
      const snap2 = await getDoc(doc(db, 'battles', cleanId));
      if (snap2.exists()) {
        const mapped = mapServerRoomToDoc({ id: snap2.id, ...snap2.data() });
        saveLocalRoom(mapped);
        return mapped;
      }
    } catch {}
  }

  // 3. Fallback to Server API Route /api/battle
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => controller.abort(), 2500) : null;
    const res = await fetch(`/api/battle?roomId=${cleanId}`, { signal: controller?.signal });
    if (timeout) clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const mapped = mapServerRoomToDoc(data);
      saveLocalRoom(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('[BATTLE_SYNC_WARN]: /api/battle get error:', err);
  }

  return getLocalRoom(cleanId);
}

/**
 * 3. Guest Join: Updates Firestore & API route with guest in lobby
 * Notice: status remains 'waiting' until BOTH players toggle ready!
 */
export async function joinBattleRoom(
  roomId: string,
  guestUser: { id: string; name: string }
): Promise<BattleRoomDoc> {
  await ensureAuthSession();

  const cleanId = roomId.trim().replace(/^#+/, '').toUpperCase();
  const guestData: BattleRoomPlayer = {
    id: guestUser.id,
    name: guestUser.name || 'Player 2',
    joined: true,
    score: 0,
    ready: false,
    currentRound: 0,
  };

  const joinPayload = {
    guest: sanitizeForFirestore(guestData),
    guestReady: false,
    status: 'waiting',
    countdown: 3,
  };

  // Canonical Firestore update (dual-write to battle_rooms & battles)
  if (db && isFirebaseConfigured && cleanId) {
    setDoc(doc(db, 'battle_rooms', cleanId), joinPayload, { merge: true }).catch((err) => {
      console.warn('[BATTLE_SYNC_WARN]: Firestore join error (battle_rooms):', err);
    });
    setDoc(doc(db, 'battles', cleanId), joinPayload, { merge: true }).catch(() => {});
  }

  // Server API route join (vital backup for cross-device notification)
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => controller.abort(), 2500) : null;
    fetch('/api/battle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller?.signal,
      body: JSON.stringify({
        action: 'join',
        roomId: cleanId,
        guestUser: guestData,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((serverRoom) => {
        if (timeout) clearTimeout(timeout);
        if (serverRoom) {
          const mapped = mapServerRoomToDoc(serverRoom);
          saveLocalRoom(mapped);
        }
      })
      .catch(() => {
        if (timeout) clearTimeout(timeout);
      });
  } catch {}

  // Update local cache & return immediately so guest UI transitions to lobby without delay
  const existing = getLocalRoom(cleanId);
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
  const cleanId = roomId.trim().replace(/^#+/, '').toUpperCase();
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

  const updates: Record<string, any> = isHost
    ? { hostReady: isReady, 'host.ready': isReady }
    : { guestReady: isReady, 'guest.ready': isReady };

  if (bothReady) {
    updates.status = 'starting';
  }

  // Canonical Firestore update
  if (db && isFirebaseConfigured && cleanId) {
    setDoc(doc(db, 'battle_rooms', cleanId), updates, { merge: true }).catch((err) => {
      console.warn('[BATTLE_SYNC_WARN]: Set ready error (battle_rooms):', err);
    });
    setDoc(doc(db, 'battles', cleanId), updates, { merge: true }).catch(() => {});
  }

  // Server API route update
  try {
    fetch('/api/battle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ready',
        roomId: cleanId,
        isHost,
        isReady,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((serverRoom) => {
        if (serverRoom) {
          const mapped = mapServerRoomToDoc(serverRoom);
          saveLocalRoom(mapped);
        }
      })
      .catch(() => {});
  } catch {}
}

/**
 * 5. Start Match: Updates status: 'in_progress' in Firestore & API route
 */
export async function startBattleRoomMatch(roomId: string): Promise<void> {
  const cleanId = roomId.trim().replace(/^#+/, '').toUpperCase();
  const existing = getLocalRoom(cleanId);
  if (existing) {
    existing.status = 'in_progress';
    saveLocalRoom(existing);
  }

  if (db && isFirebaseConfigured) {
    setDoc(doc(db, 'battle_rooms', cleanId), { status: 'in_progress' }, { merge: true }).catch(() => {});
    setDoc(doc(db, 'battles', cleanId), { status: 'in_progress' }, { merge: true }).catch(() => {});
  }

  try {
    fetch('/api/battle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', roomId: cleanId }),
    }).catch(() => {});
  } catch {}
}

/**
 * 6. Update live player score in Firestore & API route
 */
export async function updateBattlePlayerScore(
  roomId: string,
  isHost: boolean,
  newScore: number,
  newRound: number,
  isCorrect?: boolean
): Promise<void> {
  const cleanId = roomId.trim().replace(/^#+/, '').toUpperCase();
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

  if (db && isFirebaseConfigured) {
    const fieldPrefix = isHost ? 'host' : 'guest';
    const updates: Record<string, any> = {
      [`${fieldPrefix}.score`]: newScore,
      [`${fieldPrefix}.currentRound`]: newRound,
    };
    if (isCorrect !== undefined) {
      updates[`${fieldPrefix}.lastAnswerCorrect`] = isCorrect;
    }
    setDoc(doc(db, 'battle_rooms', cleanId), updates, { merge: true }).catch(() => {});
    setDoc(doc(db, 'battles', cleanId), updates, { merge: true }).catch(() => {});
  }

  try {
    fetch('/api/battle', {
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
    }).catch(() => {});
  } catch {}
}

/**
 * 7. Set room completed in Firestore & API route
 */
export async function setBattleRoomCompleted(roomId: string): Promise<void> {
  const cleanId = roomId.trim().replace(/^#+/, '').toUpperCase();
  const existing = getLocalRoom(cleanId);
  if (existing) {
    existing.status = 'completed';
    saveLocalRoom(existing);
  }

  if (db && isFirebaseConfigured) {
    setDoc(doc(db, 'battle_rooms', cleanId), { status: 'completed' }, { merge: true }).catch(() => {});
    setDoc(doc(db, 'battles', cleanId), { status: 'completed' }, { merge: true }).catch(() => {});
  }

  try {
    fetch('/api/battle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete', roomId: cleanId }),
    }).catch(() => {});
  } catch {}
}

/**
 * 8. Live Real-Time Listener (Firestore WebSocket onSnapshot + Active 1s API route polling)
 * This guarantees 100% reliable cross-device sync even if Firestore client rules reject or delay
 */
export function listenToBattleRoom(
  roomId: string,
  onUpdate: (room: BattleRoomDoc | null) => void
): () => void {
  const cleanId = roomId.trim().replace(/^#+/, '').toUpperCase();
  let unsubFirestore1: Unsubscribe | null = null;
  let unsubFirestore2: Unsubscribe | null = null;
  let isCancelled = false;

  // Immediate local state
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
    if (custom.detail?.roomId && sanitizeRoomId(custom.detail.roomId) === cleanId && custom.detail?.room) {
      onUpdate(custom.detail.room);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
    window.addEventListener('battle_room_local_sync', handleCustomSync);
  }

  // 1. Live Firestore onSnapshot Listener
  if (db && isFirebaseConfigured) {
    const firestoreDb = db;
    ensureAuthSession()
      .catch(() => {})
      .then(() => {
        if (isCancelled) return;
        try {
          unsubFirestore1 = onSnapshot(
            doc(firestoreDb, 'battle_rooms', cleanId),
            (snap) => {
              if (snap.exists()) {
                const data = snap.data();
                const mapped = mapServerRoomToDoc({ id: snap.id, ...data });
                saveLocalRoom(mapped);
                onUpdate(mapped);
              }
            },
            () => {
              // Fallback listener on 'battles' collection
              try {
                if (isCancelled) return;
                unsubFirestore2 = onSnapshot(
                  doc(firestoreDb, 'battles', cleanId),
                  (snap2) => {
                    if (snap2.exists()) {
                      const data2 = snap2.data();
                      const mapped2 = mapServerRoomToDoc({ id: snap2.id, ...data2 });
                      saveLocalRoom(mapped2);
                      onUpdate(mapped2);
                    }
                  },
                  () => {}
                );
              } catch {}
            }
          );
        } catch (err) {
          console.warn('[BATTLE_SYNC_FIRESTORE_INIT_WARN]:', err);
        }
      });
  }

  // 2. Active 1000ms Polling Fallback on /api/battle
  // Guarantees host and guest stay perfectly synced even if Firestore WebSockets are blocked
  const pollServer = async () => {
    if (isCancelled) return;
    try {
      const res = await fetch(`/api/battle?roomId=${cleanId}`);
      if (res.ok) {
        const data = await res.json();
        const mapped = mapServerRoomToDoc(data);
        saveLocalRoom(mapped);
        onUpdate(mapped);
      }
    } catch {}
  };

  // Immediate poll on start
  pollServer();
  const pollInterval = setInterval(pollServer, 1000);

  return () => {
    isCancelled = true;
    clearInterval(pollInterval);
    if (unsubFirestore1) unsubFirestore1();
    if (unsubFirestore2) unsubFirestore2();
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('battle_room_local_sync', handleCustomSync);
    }
  };
}
