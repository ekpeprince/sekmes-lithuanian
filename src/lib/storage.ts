import { UserProgress, MistakeItem, Quest } from '@/types/lesson';

const STORAGE_KEY = 'sekmes_user_progress_v1';

export const DEFAULT_QUESTS: Quest[] = [
  {
    id: 'quest-lesson',
    title: 'Dienos pamoka',
    englishTitle: 'Daily Lesson',
    description: 'Užbaikite bent 1 pamoką šiandien',
    englishDescription: 'Complete at least 1 lesson today',
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
    englishTitle: 'Energy Boost',
    description: 'Surinkite 50 XP per dieną',
    englishDescription: 'Earn 50 XP today',
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
    englishTitle: 'Speed Master',
    description: 'Išbandykite 60 sekundžių žaibo treniruotę',
    englishDescription: 'Try a 60-second lightning drill',
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
    englishTitle: 'Mistake Cleaner',
    description: 'Ištaisykite klaidą iš klaidų banko',
    englishDescription: 'Clear a mistake from your mistake bank',
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
  streakFreezes: 1,
  mysteryChestClaimedDate: undefined,
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
    const today = new Date().toISOString().split('T')[0];
    const isNewDay = Boolean(parsed.lastActiveDate && parsed.lastActiveDate !== today);

    // Reset daily quests if a new calendar day has arrived
    const questsToUse = isNewDay
      ? DEFAULT_QUESTS.map(q => ({ ...q, current: 0, completed: false, claimed: false }))
      : (Array.isArray(parsed.quests) && parsed.quests.length > 0 ? parsed.quests : DEFAULT_QUESTS);

    const merged: UserProgress = {
      ...DEFAULT_PROGRESS,
      ...parsed,
      // Ensure valid heart counts and arrays
      completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [],
      hearts: typeof parsed.hearts === 'number' ? Math.min(5, Math.max(0, parsed.hearts)) : 5,
      mistakesBank: Array.isArray(parsed.mistakesBank) ? parsed.mistakesBank : [],
      quests: questsToUse,
      leagueTier: parsed.leagueTier || getLeagueTierByXp(parsed.xp || 0),
      speedDrillHighScore: parsed.speedDrillHighScore || 0,
      streakFreezes: typeof parsed.streakFreezes === 'number' ? parsed.streakFreezes : 1,
      mysteryChestClaimedDate: parsed.mysteryChestClaimedDate,
    };

    if (isNewDay) {
      saveProgress(merged);
    }

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
  
  // Calculate streak & check freeze protection
  let newStreak = current.streak;
  let remainingFreezes = current.streakFreezes ?? 1;

  if (current.lastActiveDate !== today) {
    const lastDate = new Date(current.lastActiveDate);
    const currentDate = new Date(today);
    const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays === 2 && remainingFreezes > 0) {
      // Streak freeze protects 1 missed day!
      remainingFreezes -= 1;
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
    streakFreezes: remainingFreezes,
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

// Claim Mystery Reward Chest when daily quests are completed
export function claimMysteryChest(): {
  progress: UserProgress;
  reward: { xp: number; gems: number; streakFreeze: boolean };
} {
  const current = getStoredProgress();
  const today = new Date().toISOString().split('T')[0];
  const bonusXp = 50;
  const bonusGems = 25;
  const streakFreezeAwarded = true;

  const updated: UserProgress = {
    ...current,
    xp: current.xp + bonusXp,
    gems: current.gems + bonusGems,
    streakFreezes: (current.streakFreezes ?? 1) + 1,
    mysteryChestClaimedDate: today,
    leagueTier: getLeagueTierByXp(current.xp + bonusXp),
  };

  saveProgress(updated);
  return {
    progress: updated,
    reward: { xp: bonusXp, gems: bonusGems, streakFreeze: streakFreezeAwarded },
  };
}

export function resetAllProgress(): UserProgress {
  const reset = { ...DEFAULT_PROGRESS };
  saveProgress(reset);
  return reset;
}
