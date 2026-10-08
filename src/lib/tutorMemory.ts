// Persistent Long-Term Memory for AI Lithuanian Tutor (Aistė)

export interface TutorMemory {
  learnerName?: string;
  facts: string[];
  weakSpots: string[];
  recentTopics: string[];
  lastSessionDate?: string;
  totalSessions: number;
  tutorName: string;
}

export const DEFAULT_TUTOR_MEMORY: TutorMemory = {
  learnerName: undefined,
  facts: [],
  weakSpots: [],
  recentTopics: [],
  lastSessionDate: undefined,
  totalSessions: 0,
  tutorName: 'Aistė',
};

const STORAGE_KEY = 'sekmes_tutor_memory_v1';

export function getTutorMemory(): TutorMemory {
  if (typeof window === 'undefined') return DEFAULT_TUTOR_MEMORY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TUTOR_MEMORY;
    return { ...DEFAULT_TUTOR_MEMORY, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_TUTOR_MEMORY;
  }
}

export function saveTutorMemory(memory: TutorMemory): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch {}
}

export function recordNewSession(topic?: string): TutorMemory {
  const current = getTutorMemory();
  const updatedTopics = topic && !current.recentTopics.includes(topic)
    ? [topic, ...current.recentTopics.slice(0, 4)]
    : current.recentTopics;

  const updated: TutorMemory = {
    ...current,
    totalSessions: current.totalSessions + 1,
    lastSessionDate: new Date().toLocaleDateString('lt-LT', {
      month: 'long',
      day: 'numeric',
    }),
    recentTopics: updatedTopics,
  };

  saveTutorMemory(updated);
  return updated;
}

export function addLearnerFact(fact: string): TutorMemory {
  const current = getTutorMemory();
  const trimmed = fact.trim();
  if (!trimmed || current.facts.includes(trimmed)) return current;

  const updated: TutorMemory = {
    ...current,
    facts: [trimmed, ...current.facts.slice(0, 15)],
  };
  saveTutorMemory(updated);
  return updated;
}

export function setLearnerName(name: string): TutorMemory {
  const current = getTutorMemory();
  const updated: TutorMemory = {
    ...current,
    learnerName: name.trim(),
  };
  saveTutorMemory(updated);
  return updated;
}

export function addWeakSpot(spot: string): TutorMemory {
  const current = getTutorMemory();
  const trimmed = spot.trim();
  if (!trimmed || current.weakSpots.includes(trimmed)) return current;

  const updated: TutorMemory = {
    ...current,
    weakSpots: [trimmed, ...current.weakSpots.slice(0, 8)],
  };
  saveTutorMemory(updated);
  return updated;
}

export function clearTutorMemory(): TutorMemory {
  saveTutorMemory(DEFAULT_TUTOR_MEMORY);
  return DEFAULT_TUTOR_MEMORY;
}

// Generate formatted memory context string to send to the Gemini prompt
export function formatTutorMemoryPrompt(memory: TutorMemory): string {
  const parts: string[] = [];

  parts.push(`TUTOR IDENTITY: You are ${memory.tutorName}, a real, warm, supportive human Lithuanian language teacher living in Vilnius. You genuinely care about this student and remember past conversations.`);

  if (memory.learnerName) {
    parts.push(`STUDENT NAME: ${memory.learnerName}. Address them by their name when greeting or encouraging them.`);
  }

  if (memory.totalSessions > 1 && memory.lastSessionDate) {
    parts.push(`RELATIONSHIP HISTORY: This is session #${memory.totalSessions}. You last met on ${memory.lastSessionDate}.`);
  }

  if (memory.facts.length > 0) {
    parts.push(`WHAT YOU REMEMBER ABOUT THIS STUDENT (Personal facts):\n${memory.facts.map(f => `  • ${f}`).join('\n')}`);
  }

  if (memory.recentTopics.length > 0) {
    parts.push(`RECENT TOPICS DISCUSSED:\n${memory.recentTopics.map(t => `  • ${t}`).join('\n')}`);
  }

  if (memory.weakSpots.length > 0) {
    parts.push(`AREAS THEY ARE WORKING ON:\n${memory.weakSpots.map(w => `  • ${w}`).join('\n')}`);
  }

  parts.push(`INSTRUCTION ON MEMORY: Reference what you know naturally (e.g. "Džiugu tave vėl matyti!", mention their interests or past discussions if relevant). Do NOT recite memory like a robot; weave it in like a caring friend and mentor.`);

  return parts.join('\n\n');
}
