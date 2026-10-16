import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { BATTLE_QUESTIONS } from '@/data/battleQuestions';

export interface BattleRoomPlayer {
  id: string;
  name: string;
  score: number;
  currentRound: number;
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

export type BattleRoomStatus = 'waiting' | 'ready' | 'in_progress' | 'completed';

export interface BattleRoomDoc {
  roomId: string;
  host: BattleRoomPlayer;
  guest: BattleRoomPlayer | null;
  status: BattleRoomStatus;
  tier: string;
  questions: BattleRoomQuestion[];
  createdAt: any;
  countdownStartTime?: number | null;
}

// Timeout helper to guarantee promises never hang indefinitely
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 3500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
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

// Clean object for Firestore (strip undefined)
function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

// Local cache helper for offline/demo/cross-tab synchronization
function saveLocalRoom(room: BattleRoomDoc) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`battle_room_${room.roomId}`, JSON.stringify(room));
    window.dispatchEvent(
      new CustomEvent('battle_room_local_sync', { detail: { roomId: room.roomId, room } })
    );
  } catch {
    // Ignore storage errors
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
 * 1. Create a new Battle Room in battle_rooms/{roomId}
 * Generates room data immediately so UI never hangs on loading spinner
 */
export async function createBattleRoom(
  hostUser: { id: string; name: string },
  tier: string = 'SIDABRINĖ LYGA'
): Promise<BattleRoomDoc> {
  const roomId = Math.random().toString(36).substring(2, 8);
  const questions = generateBattleRoomQuestions(5);

  const roomDoc: BattleRoomDoc = {
    roomId,
    host: {
      id: hostUser.id,
      name: hostUser.name || 'Host',
      score: 0,
      currentRound: 0,
    },
    guest: null,
    status: 'waiting',
    tier,
    questions,
    createdAt: Date.now(),
  };

  // Immediate local cache
  saveLocalRoom(roomDoc);

  // Sync to Firestore in background without blocking host UI
  if (db && isFirebaseConfigured) {
    withTimeout(
      setDoc(doc(db, 'battle_rooms', roomId), {
        ...sanitizeForFirestore(roomDoc),
        createdAt: serverTimestamp(),
      }),
      3500
    ).catch((err) => {
      console.error('[BATTLE_ARENA_ERROR]: Failed to create room in Firestore (local fallback active):', err);
    });
  }

  return roomDoc;
}

/**
 * 2. Fetch a Battle Room by roomId with 3.5s timeout
 */
export async function getBattleRoom(roomId: string): Promise<BattleRoomDoc | null> {
  const cleanId = roomId.trim();
  if (db && isFirebaseConfigured) {
    try {
      const roomRef = doc(db, 'battle_rooms', cleanId);
      const snap = await withTimeout(getDoc(roomRef), 3500);
      if (snap.exists()) {
        const data = snap.data() as BattleRoomDoc;
        saveLocalRoom(data);
        return data;
      }
    } catch (err) {
      console.error('[BATTLE_ARENA_ERROR]: Failed to get battle room from Firestore:', err);
    }
  }

  return getLocalRoom(cleanId);
}

/**
 * 3. Guest Join Flow: update guest data and flip status = 'ready'
 */
export async function joinBattleRoom(
  roomId: string,
  guestUser: { id: string; name: string }
): Promise<BattleRoomDoc> {
  const cleanId = roomId.trim();
  const guestData: BattleRoomPlayer = {
    id: guestUser.id,
    name: guestUser.name || 'Mokinys #12',
    score: 0,
    currentRound: 0,
  };

  const existing = await getBattleRoom(cleanId);
  const updatedRoom: BattleRoomDoc = existing
    ? {
        ...existing,
        guest: guestData,
        status: 'ready',
      }
    : {
        roomId: cleanId,
        host: { id: 'host_fallback', name: 'Host', score: 0, currentRound: 0 },
        guest: guestData,
        status: 'ready',
        tier: 'SIDABRINĖ LYGA',
        questions: generateBattleRoomQuestions(5),
        createdAt: Date.now(),
      };

  saveLocalRoom(updatedRoom);

  if (db && isFirebaseConfigured) {
    withTimeout(
      updateDoc(doc(db, 'battle_rooms', cleanId), {
        guest: sanitizeForFirestore(guestData),
        status: 'ready',
      }),
      3500
    ).catch((err) => {
      console.error('[BATTLE_ARENA_ERROR]: Failed to join room in Firestore:', err);
    });
  }

  return updatedRoom;
}

/**
 * 4. Start Match: update status = 'in_progress'
 */
export async function startBattleRoomMatch(roomId: string): Promise<void> {
  const cleanId = roomId.trim();
  const existing = getLocalRoom(cleanId);
  if (existing) {
    existing.status = 'in_progress';
    saveLocalRoom(existing);
  }

  if (db && isFirebaseConfigured) {
    withTimeout(
      updateDoc(doc(db, 'battle_rooms', cleanId), { status: 'in_progress' }),
      3500
    ).catch((err) => {
      console.error('[BATTLE_ARENA_ERROR]: Failed to start match in Firestore:', err);
    });
  }
}

/**
 * 5. Update live player score and round progression
 */
export async function updateBattlePlayerScore(
  roomId: string,
  isHost: boolean,
  newScore: number,
  newRound: number,
  isCorrect?: boolean
): Promise<void> {
  const cleanId = roomId.trim();
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
    if (existing.host.currentRound >= 5 && (existing.guest?.currentRound ?? 0) >= 5) {
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
    withTimeout(
      updateDoc(doc(db, 'battle_rooms', cleanId), updates),
      3500
    ).catch((err) => {
      console.error('[BATTLE_ARENA_ERROR]: Failed to update score in Firestore:', err);
    });
  }
}

/**
 * 6. Set room completed
 */
export async function setBattleRoomCompleted(roomId: string): Promise<void> {
  const cleanId = roomId.trim();
  const existing = getLocalRoom(cleanId);
  if (existing) {
    existing.status = 'completed';
    saveLocalRoom(existing);
  }

  if (db && isFirebaseConfigured) {
    withTimeout(
      updateDoc(doc(db, 'battle_rooms', cleanId), { status: 'completed' }),
      3500
    ).catch((err) => {
      console.error('[BATTLE_ARENA_ERROR]: Failed to set room completed in Firestore:', err);
    });
  }
}

/**
 * 7. Real-Time Listener: Listen to battle_rooms/{roomId} changes
 */
export function listenToBattleRoom(
  roomId: string,
  onUpdate: (room: BattleRoomDoc | null) => void
): () => void {
  const cleanId = roomId.trim();
  let unsubFirestore: Unsubscribe | null = null;

  // Initial local state
  const initial = getLocalRoom(cleanId);
  if (initial) {
    onUpdate(initial);
  }

  // Cross-tab / storage listener
  const handleStorage = (e: StorageEvent) => {
    if (e.key === `battle_room_${cleanId}` && e.newValue) {
      try {
        onUpdate(JSON.parse(e.newValue));
      } catch {}
    }
  };

  const handleCustomSync = (e: Event) => {
    const custom = e as CustomEvent<{ roomId: string; room: BattleRoomDoc }>;
    if (custom.detail?.roomId === cleanId && custom.detail?.room) {
      onUpdate(custom.detail.room);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
    window.addEventListener('battle_room_local_sync', handleCustomSync);
  }

  // Cloud Firestore Real-time listener
  if (db && isFirebaseConfigured) {
    try {
      const roomRef = doc(db, 'battle_rooms', cleanId);
      unsubFirestore = onSnapshot(
        roomRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as BattleRoomDoc;
            saveLocalRoom(data);
            onUpdate(data);
          }
        },
        (err) => {
          console.error('[BATTLE_ARENA_ERROR]: Firestore onSnapshot listener error:', err);
        }
      );
    } catch (err) {
      console.error('[BATTLE_ARENA_ERROR]: Firestore onSnapshot init error:', err);
    }
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('battle_room_local_sync', handleCustomSync);
    }
    if (unsubFirestore) {
      unsubFirestore();
    }
  };
}
