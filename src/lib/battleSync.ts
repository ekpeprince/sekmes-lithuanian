// Real-time synchronization and AI rival engine for Friend Battles (Lietuvių Kalbos Dvikova)

import { doc, setDoc, getDoc, onSnapshot, updateDoc, Unsubscribe } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { BattleQuestion, getRandomBattleQuestions } from '@/data/battleQuestions';

export interface BattleAnswer {
  selected: string;
  correct: boolean;
  timeMs: number;
  points: number;
}

export interface BattlePlayer {
  id: string;
  name: string;
  avatar: string;
  score: number;
  streak: number;
  answers: Record<number, BattleAnswer>;
  isReady: boolean;
  isHost: boolean;
  isBot?: boolean;
}

export interface BattleRoom {
  id: string;
  status: 'waiting' | 'in_progress' | 'finished';
  createdAt: number;
  players: Record<string, BattlePlayer>;
  questions: BattleQuestion[];
  currentRound: number; // 0 to 4
  roundStartTime: number;
  winnerId?: string;
}

export interface AIRival {
  id: string;
  name: string;
  city: string;
  avatar: string;
  tagline: string;
  difficulty: 'easy' | 'medium' | 'hard';
  accuracy: number; // 0.0 - 1.0
  minDelayMs: number;
  maxDelayMs: number;
}

export const AI_RIVALS: AIRival[] = [
  {
    id: 'bot-mantas',
    name: 'Mantas',
    city: 'Vilnius',
    avatar: '🐺',
    tagline: 'Gediminas Tower defender! Fast and intuitive.',
    difficulty: 'medium',
    accuracy: 0.85,
    minDelayMs: 2500,
    maxDelayMs: 5500,
  },
  {
    id: 'bot-gabija',
    name: 'Gabija',
    city: 'Kaunas',
    avatar: '🦊',
    tagline: 'Language enthusiast from Laisvės alėja. Sharp eye!',
    difficulty: 'hard',
    accuracy: 0.92,
    minDelayMs: 2000,
    maxDelayMs: 4500,
  },
  {
    id: 'bot-tadas',
    name: 'Tadas',
    city: 'Klaipėda',
    avatar: '🦅',
    tagline: 'Seaside lightning! Daring answers.',
    difficulty: 'easy',
    accuracy: 0.72,
    minDelayMs: 3000,
    maxDelayMs: 7000,
  },
  {
    id: 'bot-aiste',
    name: 'Mokytoja Aistė',
    city: 'Senamiestis',
    avatar: '🦉',
    tagline: 'Native Lithuanian teacher. Rarely misses!',
    difficulty: 'hard',
    accuracy: 0.96,
    minDelayMs: 3000,
    maxDelayMs: 6000,
  },
];

const LOCAL_STORAGE_PREFIX = 'sekmes_battle_room_';

// Generate human-friendly 6-char room code, e.g. VYT-482
export function generateRoomCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const prefix = letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${num}`;
}

// Calculate points for an answer (100 base + speed bonus up to 50 + streak bonus)
export function calculateAnswerPoints(isCorrect: boolean, timeMs: number, currentStreak: number): number {
  if (!isCorrect) return 0;
  const maxTimeMs = 15000;
  const elapsed = Math.min(maxTimeMs, Math.max(0, timeMs));
  const speedRatio = Math.max(0, 1 - elapsed / maxTimeMs);
  const speedBonus = Math.round(speedRatio * 50);
  const streakBonus = Math.min(50, currentStreak * 10);
  return 100 + speedBonus + streakBonus;
}

// Save room to local storage (fallback & offline)
function saveLocalRoom(room: BattleRoom): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${room.id}`, JSON.stringify(room));
    window.dispatchEvent(new CustomEvent('sekmes-battle-update', { detail: room }));
  } catch {}
}

// Get local room
function getLocalRoom(roomId: string): BattleRoom | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${roomId}`);
    if (!raw) return null;
    return JSON.parse(raw) as BattleRoom;
  } catch {
    return null;
  }
}

// Create a new Battle Room
export async function createBattleRoom(hostUser: {
  id: string;
  name: string;
  avatar: string;
}): Promise<BattleRoom> {
  const roomId = generateRoomCode();
  const questions = getRandomBattleQuestions(5);

  const initialRoom: BattleRoom = {
    id: roomId,
    status: 'waiting',
    createdAt: Date.now(),
    questions,
    currentRound: 0,
    roundStartTime: 0,
    players: {
      [hostUser.id]: {
        id: hostUser.id,
        name: hostUser.name || 'Lietuvis',
        avatar: hostUser.avatar || '🦊',
        score: 0,
        streak: 0,
        answers: {},
        isReady: true,
        isHost: true,
      },
    },
  };

  saveLocalRoom(initialRoom);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'battles', roomId), initialRoom);
    } catch (err) {
      console.warn('Firestore battle create error, using local room:', err);
    }
  }

  return initialRoom;
}

// Create a Battle Room with an AI Rival
export function createAIBattleRoom(
  hostUser: { id: string; name: string; avatar: string },
  rival: AIRival
): BattleRoom {
  const roomId = `BOT-${generateRoomCode()}`;
  const questions = getRandomBattleQuestions(5);

  const room: BattleRoom = {
    id: roomId,
    status: 'in_progress',
    createdAt: Date.now(),
    questions,
    currentRound: 0,
    roundStartTime: Date.now(),
    players: {
      [hostUser.id]: {
        id: hostUser.id,
        name: hostUser.name || 'Tu (You)',
        avatar: hostUser.avatar || '🦊',
        score: 0,
        streak: 0,
        answers: {},
        isReady: true,
        isHost: true,
      },
      [rival.id]: {
        id: rival.id,
        name: `${rival.name} (${rival.city})`,
        avatar: rival.avatar,
        score: 0,
        streak: 0,
        answers: {},
        isReady: true,
        isHost: false,
        isBot: true,
      },
    },
  };

  saveLocalRoom(room);
  return room;
}

// Join an existing Battle Room
export async function joinBattleRoom(
  roomId: string,
  guestUser: { id: string; name: string; avatar: string }
): Promise<BattleRoom | null> {
  let room: BattleRoom | null = null;

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, 'battles', roomId));
      if (snap.exists()) {
        room = snap.data() as BattleRoom;
      }
    } catch (err) {
      console.warn('Firestore fetch battle failed, checking local:', err);
    }
  }

  if (!room) {
    room = getLocalRoom(roomId);
  }

  if (!room) return null;

  // Add player if not already in
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

  saveLocalRoom(room);

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'battles', roomId), {
        [`players.${guestUser.id}`]: room.players[guestUser.id],
      });
    } catch (err) {
      console.warn('Failed to update player in Firestore:', err);
    }
  }

  return room;
}

// Start battle (moves status from 'waiting' to 'in_progress')
export async function startBattle(roomId: string): Promise<void> {
  const updates = {
    status: 'in_progress' as const,
    currentRound: 0,
    roundStartTime: Date.now(),
  };

  const local = getLocalRoom(roomId);
  if (local) {
    const updated = { ...local, ...updates };
    saveLocalRoom(updated);
  }

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'battles', roomId), updates);
    } catch (err) {
      console.warn('Failed to start battle in Firestore:', err);
    }
  }
}

// Submit answer for a round
export async function submitAnswer(
  roomId: string,
  playerId: string,
  roundIndex: number,
  selected: string,
  correctAnswer: string,
  timeMs: number
): Promise<BattleRoom | null> {
  const room = getLocalRoom(roomId);
  if (!room) return null;

  const player = room.players[playerId];
  if (!player) return room;

  const isCorrect = selected === correctAnswer;
  const currentStreak = isCorrect ? player.streak + 1 : 0;
  const points = calculateAnswerPoints(isCorrect, timeMs, player.streak);

  const answer: BattleAnswer = {
    selected,
    correct: isCorrect,
    timeMs,
    points,
  };

  const updatedPlayer: BattlePlayer = {
    ...player,
    score: player.score + points,
    streak: currentStreak,
    answers: {
      ...player.answers,
      [roundIndex]: answer,
    },
  };

  const updatedRoom: BattleRoom = {
    ...room,
    players: {
      ...room.players,
      [playerId]: updatedPlayer,
    },
  };

  saveLocalRoom(updatedRoom);

  if (isFirebaseConfigured && db && !room.id.startsWith('BOT-')) {
    try {
      await updateDoc(doc(db, 'battles', roomId), {
        [`players.${playerId}`]: updatedPlayer,
      });
    } catch (err) {
      console.warn('Failed to submit answer to Firestore:', err);
    }
  }

  return updatedRoom;
}

// Advance to next round or finish
export async function advanceRound(roomId: string, nextRound: number): Promise<BattleRoom | null> {
  const room = getLocalRoom(roomId);
  if (!room) return null;

  const isFinished = nextRound >= room.questions.length;
  let winnerId: string | undefined = undefined;

  if (isFinished) {
    const playerList = Object.values(room.players);
    if (playerList.length > 0) {
      playerList.sort((a, b) => b.score - a.score);
      winnerId = playerList[0].id;
    }
  }

  const updates = {
    currentRound: nextRound,
    roundStartTime: Date.now(),
    status: isFinished ? ('finished' as const) : room.status,
    winnerId: isFinished ? winnerId : undefined,
  };

  const updatedRoom: BattleRoom = { ...room, ...updates };
  saveLocalRoom(updatedRoom);

  if (isFirebaseConfigured && db && !room.id.startsWith('BOT-')) {
    try {
      await updateDoc(doc(db, 'battles', roomId), updates);
    } catch (err) {
      console.warn('Failed to advance round in Firestore:', err);
    }
  }

  return updatedRoom;
}

// Subscribe to real-time room updates
export function subscribeToBattleRoom(
  roomId: string,
  onUpdate: (room: BattleRoom) => void
): () => void {
  // If it's a bot game or Firebase not configured, use local events
  if (roomId.startsWith('BOT-') || !isFirebaseConfigured || !db) {
    const handleLocal = (e: Event) => {
      const customEvent = e as CustomEvent<BattleRoom>;
      if (customEvent.detail && customEvent.detail.id === roomId) {
        onUpdate(customEvent.detail);
      }
    };
    window.addEventListener('sekmes-battle-update', handleLocal);
    return () => {
      window.removeEventListener('sekmes-battle-update', handleLocal);
    };
  }

  try {
    const unsub: Unsubscribe = onSnapshot(doc(db, 'battles', roomId), (snap) => {
      if (snap.exists()) {
        const roomData = snap.data() as BattleRoom;
        saveLocalRoom(roomData);
        onUpdate(roomData);
      }
    });
    return unsub;
  } catch (err) {
    console.warn('Firestore subscription failed, falling back to local events:', err);
    const handleLocal = (e: Event) => {
      const customEvent = e as CustomEvent<BattleRoom>;
      if (customEvent.detail && customEvent.detail.id === roomId) {
        onUpdate(customEvent.detail);
      }
    };
    window.addEventListener('sekmes-battle-update', handleLocal);
    return () => {
      window.removeEventListener('sekmes-battle-update', handleLocal);
    };
  }
}
