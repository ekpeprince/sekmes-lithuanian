import mqtt, { MqttClient } from 'mqtt';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
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
  return `sekmes/battle/${sanitizeRoomId(roomId).toLowerCase()}`;
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

// ============================================================================
// MQTT Connection Management (EMQX & HiveMQ ultra-fast WebSocket relays)
// ============================================================================
const BROKER_URLS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
];

let globalMqttClient: MqttClient | null = null;
let currentBrokerIdx = 0;
const subscribedTopics = new Set<string>();

function getOrCreateMqttClient(): MqttClient | null {
  if (typeof window === 'undefined') return null;

  if (globalMqttClient && !globalMqttClient.disconnecting) {
    return globalMqttClient;
  }

  try {
    const brokerUrl = BROKER_URLS[currentBrokerIdx % BROKER_URLS.length];
    const client = mqtt.connect(brokerUrl, {
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 2000,
      keepalive: 30,
      clientId: `sekmes_${Math.random().toString(36).substring(2, 10)}`,
    });

    client.on('connect', () => {
      // Re-subscribe all active topics on reconnect
      for (const topic of subscribedTopics) {
        client.subscribe(topic, { qos: 1 });
      }
    });

    client.on('error', (err) => {
      console.warn('[BATTLE_MQTT_ERROR]:', err);
      // Try next broker on failure
      currentBrokerIdx++;
    });

    globalMqttClient = client;
    return client;
  } catch (e) {
    console.warn('[BATTLE_MQTT_INIT_WARN]:', e);
    return null;
  }
}

// Reconstruct room state by replaying an array of event payloads
export function applyEventsToRoom(baseRoom: BattleRoomDoc | null, events: any[]): BattleRoomDoc | null {
  let room: BattleRoomDoc | null = baseRoom ? { ...baseRoom } : null;

  for (const ev of events) {
    if (!ev || !ev.action) continue;

    if (ev.room) {
      const existingGuest = room?.guest;
      const existingGuestReady = room?.guestReady;

      room = mapServerRoomToDoc(ev.room);

      if (existingGuest && !room.guest) {
        room.guest = existingGuest;
        room.guestReady = existingGuestReady ?? false;
      }
      continue;
    }

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
      } else if (room.status === 'starting') {
        room.status = 'waiting';
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
    } else if (ev.action === 'rematch' && ev.room) {
      room = mapServerRoomToDoc(ev.room);
    }
  }

  return room;
}

// Broadcast event to MQTT broker with RETAINED flag and server API
export async function broadcastRoomEvent(roomId: string, eventData: any): Promise<void> {
  const cleanId = sanitizeRoomId(roomId);
  if (!cleanId) return;

  const topic = getRoomTopic(cleanId);
  const payload = {
    ...eventData,
    roomId: cleanId,
    timestamp: Date.now(),
  };
  const payloadStr = JSON.stringify(payload);

  // 0. Cloud Firestore Real-Time Sync (Cross-device, persistent across serverless instances)
  if (db && isFirebaseConfigured) {
    try {
      const roomRef = doc(db, 'battle_rooms', cleanId);
      const roomPayload = eventData.room ? { ...eventData.room } : { roomId: cleanId, ...eventData };
      setDoc(roomRef, JSON.parse(JSON.stringify(roomPayload)), { merge: true }).catch(() => {});
    } catch (e) {
      console.warn('[BATTLE_FIRESTORE_BROADCAST_WARN]:', e);
    }
  }

  // 1. MQTT Broker with retain: true (guarantees cross-device state delivery even to late joiners)
  try {
    const client = getOrCreateMqttClient();
    if (client) {
      if (client.connected) {
        client.publish(topic, payloadStr, { retain: true, qos: 1 });
      } else {
        client.once('connect', () => {
          client.publish(topic, payloadStr, { retain: true, qos: 1 });
        });
      }
    }
  } catch (err) {
    console.warn('[BATTLE_MQTT_BROADCAST_WARN]:', err);
  }

  // 2. Server API route synchronization (POST /api/battle)
  try {
    fetch('/api/battle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payloadStr,
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

  // Remember host identity locally
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`battle_host_${roomId}`, 'true');
    } catch {}
  }

  // Immediate local cache for instant UI feedback
  saveLocalRoom(roomDoc);

  // Broadcast create event to MQTT broker and server API
  await broadcastRoomEvent(roomId, { action: 'create', room: roomDoc });

  return roomDoc;
}

/**
 * 2. Fetch Battle Room by roomId
 */
export async function getBattleRoom(roomId: string): Promise<BattleRoomDoc | null> {
  const cleanId = sanitizeRoomId(roomId);
  if (!cleanId) return null;

  const local = getLocalRoom(cleanId);
  if (local) return local;

  // 1. Firestore Lookup (Source of Truth)
  if (db && isFirebaseConfigured) {
    try {
      const roomRef = doc(db, 'battle_rooms', cleanId);
      const snap = await getDoc(roomRef);
      if (snap.exists()) {
        const mapped = mapServerRoomToDoc(snap.data());
        if (mapped) {
          saveLocalRoom(mapped);
          return mapped;
        }
      }
    } catch {}
  }

  // 2. Fallback to Server API Route /api/battle
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => controller.abort(), 1500) : null;
    const res = await fetch(`/api/battle?roomId=${cleanId}&_t=${Date.now()}`, {
      signal: controller?.signal,
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (timeout) clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const mapped = mapServerRoomToDoc(data);
      if (mapped) {
        saveLocalRoom(mapped);
        return mapped;
      }
    }
  } catch {}

  return null;
}

/**
 * 3. Guest Join: Updates local, MQTT broker & API route with guest in lobby
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

  // Broadcast join event to host and server with full room document
  await broadcastRoomEvent(cleanId, {
    action: 'join',
    roomId: cleanId,
    guest: guestData,
    guestUser: guestData,
    room: updatedRoom,
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
  let existing = getLocalRoom(cleanId);
  if (!existing) {
    existing = await getBattleRoom(cleanId);
  }

  if (existing) {
    if (isHost) {
      existing.hostReady = isReady;
      if (existing.host) existing.host.ready = isReady;
    } else {
      existing.guestReady = isReady;
      if (existing.guest) existing.guest.ready = isReady;
    }

    const hostIsReady = Boolean(existing.hostReady ?? existing.host?.ready);
    const guestIsReady = Boolean(existing.guestReady ?? existing.guest?.ready);
    const bothReady = Boolean(existing.guest && hostIsReady && guestIsReady);

    if (bothReady) {
      existing.status = 'starting';
    }

    saveLocalRoom(existing);

    await broadcastRoomEvent(cleanId, {
      action: 'ready',
      roomId: cleanId,
      isHost,
      isReady,
      bothReady,
      room: existing,
    });
  } else {
    await broadcastRoomEvent(cleanId, {
      action: 'ready',
      roomId: cleanId,
      isHost,
      isReady,
    });
  }
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

  await broadcastRoomEvent(cleanId, {
    action: 'start',
    roomId: cleanId,
    room: existing ? { ...existing, status: 'in_progress' } : undefined,
  });
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
    room: existing,
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

  await broadcastRoomEvent(cleanId, {
    action: 'complete',
    roomId: cleanId,
    room: existing ? { ...existing, status: 'completed' } : undefined,
  });
}

/**
 * 7b. Request Rematch within the same room (resets scores and generates fresh questions)
 */
export async function requestBattleRoomRematch(roomId: string): Promise<BattleRoomDoc | null> {
  const cleanId = sanitizeRoomId(roomId);
  let existing = getLocalRoom(cleanId);
  if (!existing) {
    existing = await getBattleRoom(cleanId);
  }
  if (!existing) return null;

  const newQuestions = generateBattleRoomQuestions(5, `${cleanId}_${Date.now()}`);

  const updatedRoom: BattleRoomDoc = {
    ...existing,
    status: 'waiting',
    hostReady: false,
    guestReady: false,
    countdown: 3,
    currentRound: 0,
    questions: newQuestions,
    host: {
      ...existing.host,
      score: 0,
      ready: false,
      currentRound: 0,
    },
    guest: existing.guest
      ? {
          ...existing.guest,
          score: 0,
          ready: false,
          currentRound: 0,
        }
      : null,
  };

  saveLocalRoom(updatedRoom);

  await broadcastRoomEvent(cleanId, {
    action: 'rematch',
    roomId: cleanId,
    room: updatedRoom,
  });

  return updatedRoom;
}

/**
 * 8. Live Real-Time Listener (MQTT over WebSocket + Local Storage Sync + Polling Fallback)
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

  const topic = getRoomTopic(cleanId);
  subscribedTopics.add(topic);

  // 0. Firestore Real-Time Listener (Resilient cross-device WebSocket sync)
  let unsubscribeFirestore: (() => void) | null = null;
  if (db && isFirebaseConfigured) {
    try {
      const roomRef = doc(db, 'battle_rooms', cleanId);
      unsubscribeFirestore = onSnapshot(
        roomRef,
        (snapshot) => {
          if (isCancelled || !snapshot.exists()) return;
          const firestoreData = snapshot.data();
          const mapped = mapServerRoomToDoc(firestoreData);
          if (mapped) {
            if (currentRoom?.guest && !mapped.guest) {
              mapped.guest = currentRoom.guest;
              mapped.guestReady = currentRoom.guestReady ?? currentRoom.guest.ready;
            }
            currentRoom = mapped;
            saveLocalRoom(mapped);
            onUpdate(mapped);
          }
        },
        (err) => {
          console.warn('[BATTLE_FIRESTORE_SNAPSHOT_WARN]:', err);
        }
      );
    } catch (e) {
      console.warn('[BATTLE_FIRESTORE_SUB_ERR]:', e);
    }
  }

  // 1. MQTT Real-Time WebSocket Connection
  const client = getOrCreateMqttClient();

  const handleMqttMessage = (incomingTopic: string, messageBuffer: Buffer) => {
    if (isCancelled) return;
    if (incomingTopic === topic) {
      try {
        const payload = JSON.parse(messageBuffer.toString());
        if (payload.room) {
          const mapped = mapServerRoomToDoc(payload.room);
          if (mapped) {
            // Preserve local player ready if incoming is missing it
            if (currentRoom?.guest && !mapped.guest) {
              mapped.guest = currentRoom.guest;
              mapped.guestReady = currentRoom.guestReady ?? currentRoom.guest.ready;
            }
            currentRoom = mapped;
            saveLocalRoom(mapped);
            onUpdate(mapped);
            return;
          }
        }

        const updated = applyEventsToRoom(currentRoom, [payload]);
        if (updated) {
          currentRoom = updated;
          saveLocalRoom(updated);
          onUpdate(updated);
        }
      } catch (err) {
        console.warn('[BATTLE_MQTT_PARSE_ERR]:', err);
      }
    }
  };

  if (client) {
    client.on('message', handleMqttMessage);
    if (client.connected) {
      client.subscribe(topic, { qos: 1 });
    } else {
      client.once('connect', () => {
        if (!isCancelled) client.subscribe(topic, { qos: 1 });
      });
    }
  }

  // 2. Active Polling Fallback via /api/battle
  const pollServer = async () => {
    if (isCancelled) return;

    try {
      const res = await fetch(`/api/battle?roomId=${cleanId}&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      });
      if (res.ok) {
        const serverData = await res.json();
        const mapped = mapServerRoomToDoc(serverData);
        if (mapped) {
          if (currentRoom?.guest && !mapped.guest) {
            mapped.guest = currentRoom.guest;
            mapped.guestReady = currentRoom.guestReady ?? currentRoom.guest.ready;
          }
          currentRoom = mapped;
          saveLocalRoom(mapped);
          onUpdate(mapped);
        }
      }
    } catch {}
  };

  pollServer();
  const pollInterval = setInterval(pollServer, 1500);

  return () => {
    isCancelled = true;
    clearInterval(pollInterval);
    subscribedTopics.delete(topic);

    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }

    if (client) {
      client.off('message', handleMqttMessage);
      try {
        client.unsubscribe(topic);
      } catch {}
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('battle_room_local_sync', handleCustomSync);
    }
  };
}
