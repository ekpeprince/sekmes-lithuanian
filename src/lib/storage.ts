import { UserProgress, MistakeItem, Quest } from '@/types/lesson';

const STORAGE_KEY = 'sekmes_user_progress_v1';

export const DEFAULT_QUESTS: Quest[] = [
  {
    id: 'quest-lesson',
    title: 'Dienos pamoka',
    description: 'Užbaikite bent 1 pamoką šiandien',
    icon: '📖',
    current: 0,
    target: 1,
    rewardXp: 20,
    rewardGems: 10,
    completed: false,
    claimed: false,
  },
  {
    id: 'quest-xp',
    title: 'Energijos pliūpsnis',
    description: 'Surinkite 50 XP per dieną',
    icon: '⚡',
    current: 0,
    target: 50,
    rewardXp: 30,
    rewardGems: 15,
    completed: false,
    claimed: false,
  },
  {
    id: 'quest-drill',
    title: 'Greičio meistras',
    description: 'Išbandykite 60 sekundžių žaibo treniruotę',
    icon: '⏱️',
    current: 0,
    target: 1,
    rewardXp: 25,
    rewardGems: 10,
    completed: false,
    claimed: false,
  },
  {
    id: 'quest-mistakes',
    title: 'Klaidų švarintojas',
    description: 'Ištaisykite klaidą iš klaidų banko',
    icon: '🎯',
    current: 0,
    target: 1,
    rewardXp: 15,
    rewardGems: 5,
    completed: false,
    claimed: false,
  },
];

export const DEFAULT_PROGRESS: UserProgress = {
  xp: 0,
  hearts: 5,
  maxHearts: 5,
  streak: 1,
  completedLessons: [],
  lastActiveDate: new Date().toISOString().split('T')[0],
  soundEnabled: true,
  gems: 120,
  voiceGender: 'female',
  mistakesBank: [],
  quests: DEFAULT_QUESTS,
  leagueTier: 'Bronza',
  leagueRank: 4,
  speedDrillHighScore: 0,
};

export function getStoredProgress(): UserProgress {
  if (typeof window === 'undefined') {
    return DEFAULT_PROGRESS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveProgress(DEFAULT_PROGRESS);
      return DEFAULT_PROGRESS;
    }
    const parsed = JSON.parse(raw) as Partial<UserProgress>;
    const merged: UserProgress = {
      ...DEFAULT_PROGRESS,
      ...parsed,
      // Ensure valid heart counts and arrays
      completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [],
      hearts: typeof parsed.hearts === 'number' ? Math.min(5, Math.max(0, parsed.hearts)) : 5,
      mistakesBank: Array.isArray(parsed.mistakesBank) ? parsed.mistakesBank : [],
      quests: Array.isArray(parsed.quests) && parsed.quests.length > 0 ? parsed.quests : DEFAULT_QUESTS,
      leagueTier: parsed.leagueTier || getLeagueTierByXp(parsed.xp || 0),
      speedDrillHighScore: parsed.speedDrillHighScore || 0,
    };
    return merged;
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(progress: UserProgress): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    window.dispatchEvent(new Event('sekmes-progress-updated'));
  } catch (err) {
    console.error('Failed to save progress to localStorage', err);
  }
}

export function deductHeart(): UserProgress {
  const current = getStoredProgress();
  const nextHearts = Math.max(0, current.hearts - 1);
  const updated: UserProgress = {
    ...current,
    hearts: nextHearts,
  };
  saveProgress(updated);
  return updated;
}

export function refillHearts(): UserProgress {
  const current = getStoredProgress();
  const updated: UserProgress = {
    ...current,
    hearts: current.maxHearts || 5,
  };
  saveProgress(updated);
  return updated;
}

export function getLeagueTierByXp(xp: number): 'Geležis' | 'Bronza' | 'Sidabras' | 'Auksas' | 'Gintaras' {
  if (xp >= 500) return 'Gintaras';
  if (xp >= 300) return 'Auksas';
  if (xp >= 150) return 'Sidabras';
  if (xp >= 50) return 'Bronza';
  return 'Geležis';
}

export function completeLesson(lessonId: string, xpEarned: number): UserProgress {
  const current = getStoredProgress();
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate streak
  let newStreak = current.streak;
  if (current.lastActiveDate !== today) {
    const lastDate = new Date(current.lastActiveDate);
    const currentDate = new Date(today);
    const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1;
    }
  }

  const completedLessons = current.completedLessons.includes(lessonId)
    ? current.completedLessons
    : [...current.completedLessons, lessonId];

  const nextXp = current.xp + xpEarned;

  // Update daily quests
  const updatedQuests = (current.quests || DEFAULT_QUESTS).map(q => {
    if (q.id === 'quest-lesson') {
      const nextCurr = Math.min(q.target, q.current + 1);
      return { ...q, current: nextCurr, completed: nextCurr >= q.target };
    }
    if (q.id === 'quest-xp') {
      const nextCurr = Math.min(q.target, q.current + xpEarned);
      return { ...q, current: nextCurr, completed: nextCurr >= q.target };
    }
    return q;
  });

  const updated: UserProgress = {
    ...current,
    xp: nextXp,
    gems: (current.gems || 0) + 15,
    streak: Math.max(1, newStreak),
    completedLessons,
    lastActiveDate: today,
    quests: updatedQuests,
    leagueTier: getLeagueTierByXp(nextXp),
  };

  saveProgress(updated);
  return updated;
}

// Record an exercise mistake into user's mistakes bank
export function recordMistake(mistake: Omit<MistakeItem, 'timestamp'>): UserProgress {
  const current = getStoredProgress();
  const existing = current.mistakesBank || [];

  // Deduplicate by exercise prompt
  if (existing.some(m => m.exercisePrompt === mistake.exercisePrompt)) {
    return current;
  }

  const newEntry: MistakeItem = {
    ...mistake,
    timestamp: Date.now(),
  };

  const updated: UserProgress = {
    ...current,
    mistakesBank: [newEntry, ...existing].slice(0, 50), // keep top 50
  };

  saveProgress(updated);
  return updated;
}

// Remove or resolve a mistake from bank
export function resolveMistake(id: string): UserProgress {
  const current = getStoredProgress();
  const updatedBank = (current.mistakesBank || []).filter(m => m.id !== id);

  // Update mistake quest
  const updatedQuests = (current.quests || DEFAULT_QUESTS).map(q => {
    if (q.id === 'quest-mistakes') {
      const nextCurr = Math.min(q.target, q.current + 1);
      return { ...q, current: nextCurr, completed: nextCurr >= q.target };
    }
    return q;
  });

  const updated: UserProgress = {
    ...current,
    mistakesBank: updatedBank,
    quests: updatedQuests,
    xp: current.xp + 5, // Bonus XP for correcting mistake
  };

  saveProgress(updated);
  return updated;
}

// Record speed drill high score
export function recordSpeedDrillScore(score: number): UserProgress {
  const current = getStoredProgress();
  const nextHigh = Math.max(current.speedDrillHighScore || 0, score);

  const updatedQuests = (current.quests || DEFAULT_QUESTS).map(q => {
    if (q.id === 'quest-drill') {
      const nextCurr = Math.min(q.target, q.current + 1);
      return { ...q, current: nextCurr, completed: nextCurr >= q.target };
    }
    return q;
  });

  const updated: UserProgress = {
    ...current,
    speedDrillHighScore: nextHigh,
    quests: updatedQuests,
    xp: current.xp + Math.round(score / 2),
  };

  saveProgress(updated);
  return updated;
}

// Claim reward for a completed quest
export function claimQuestReward(questId: string): UserProgress {
  const current = getStoredProgress();
  let xpToAdd = 0;
  let gemsToAdd = 0;

  const updatedQuests = (current.quests || DEFAULT_QUESTS).map(q => {
    if (q.id === questId && q.completed && !q.claimed) {
      xpToAdd = q.rewardXp;
      gemsToAdd = q.rewardGems;
      return { ...q, claimed: true };
    }
    return q;
  });

  const updated: UserProgress = {
    ...current,
    xp: current.xp + xpToAdd,
    gems: current.gems + gemsToAdd,
    quests: updatedQuests,
    leagueTier: getLeagueTierByXp(current.xp + xpToAdd),
  };

  saveProgress(updated);
  return updated;
}

export function resetAllProgress(): UserProgress {
  const reset = { ...DEFAULT_PROGRESS };
  saveProgress(reset);
  return reset;
}
