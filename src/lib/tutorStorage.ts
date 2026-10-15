export interface TutorMessage {
  id: string;
  sender: 'user' | 'aiste';
  text: string;
  translation?: string;
  suggestions?: string[];
  timestamp: string;
}

export interface TutorSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: TutorMessage[];
}

const STORAGE_KEY = 'labasapp_tutor_sessions';
const ACTIVE_SESSION_KEY = 'labasapp_active_tutor_session_id';

export const INITIAL_AISTE_GREETING =
  'Labas! Aš esu Aistė. Apie ką norėtum pasikalbėti šiandien?';
export const INITIAL_AISTE_TRANSLATION =
  "Hi! I'm Aistė. What would you like to talk about today?";

function getCurrentTimeStr(): string {
  if (typeof window === 'undefined') return '12:00';
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function getSessions(): TutorSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const activeId = getActiveSessionId();
      const filtered = parsed.filter((s: TutorSession) => {
        const hasUserMsg = s.messages && s.messages.some((m) => m.sender === 'user');
        return hasUserMsg || s.id === activeId;
      });
      return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
    }
    return [];
  } catch (err) {
    console.warn('Failed to load tutor sessions from storage:', err);
    return [];
  }
}

export function saveSession(session: TutorSession): void {
  if (typeof window === 'undefined') return;
  try {
    const sessions = getSessions();
    const existingIndex = sessions.findIndex((s) => s.id === session.id);
    const updated = {
      ...session,
      updatedAt: Date.now(),
    };

    if (existingIndex >= 0) {
      sessions[existingIndex] = updated;
    } else {
      sessions.unshift(updated);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.warn('Failed to save tutor session:', err);
  }
}

export function deleteSession(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const sessions = getSessions().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));

    if (getActiveSessionId() === id) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  } catch (err) {
    console.warn('Failed to delete tutor session:', err);
  }
}

export function getSession(id: string): TutorSession | null {
  const sessions = getSessions();
  return sessions.find((s) => s.id === id) || null;
}

export function getActiveSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_SESSION_KEY);
}

export function setActiveSessionId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_SESSION_KEY, id);
}

export function createNewSession(initialTitle = 'Naujas pokalbis'): TutorSession {
  const now = Date.now();
  const newSession: TutorSession = {
    id: `session_${now}_${Math.random().toString(36).substring(2, 7)}`,
    title: initialTitle,
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: `init-${now}`,
        sender: 'aiste',
        text: INITIAL_AISTE_GREETING,
        translation: INITIAL_AISTE_TRANSLATION,
        suggestions: [
          'Kaip sekasi?',
          'Papasakok apie Lietuvą 🇱🇹',
          'Išmokyk mane naują žodį',
        ],
        timestamp: getCurrentTimeStr(),
      },
    ],
  };

  saveSession(newSession);
  setActiveSessionId(newSession.id);
  return newSession;
}
