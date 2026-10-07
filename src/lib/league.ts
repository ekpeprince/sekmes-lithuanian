export type LeagueTier = 'Geležis' | 'Bronza' | 'Sidabras' | 'Auksas' | 'Gintaras';

export interface LeagueTierConfig {
  id: LeagueTier;
  name: string;
  englishName: string;
  icon: string;
  color: string;
  bgGradient: string;
  badgeBg: string;
  badgeText: string;
  minXp: number;
  description: string;
  englishDescription: string;
  rewards: {
    first: number; // Gems
    second: number;
    third: number;
  };
}

export interface Competitor {
  id: string;
  name: string;
  city: string;
  flag: string;
  avatarColor: string;
  initials: string;
  photoURL?: string;
  streak: number;
  xp: number;
  isUser?: boolean;
  rank: number;
  change?: 'up' | 'down' | 'same';
}

export const LEAGUE_TIERS: Record<LeagueTier, LeagueTierConfig> = {
  Geležis: {
    id: 'Geležis',
    name: 'Geležies Lyga',
    englishName: 'Iron League',
    icon: '⚔️',
    color: 'slate',
    bgGradient: 'from-slate-500 via-slate-600 to-slate-700',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-800',
    minXp: 0,
    description: 'Pradinė divizija visiems naujiems mokiniams. Užbaikite pirmąsias pamokas ir kilkite į Bronzą!',
    englishDescription: 'Starter division for all new learners. Complete your first lessons and climb to Bronze!',
    rewards: { first: 25, second: 15, third: 10 },
  },
  Bronza: {
    id: 'Bronza',
    name: 'Bronzos Lyga',
    englishName: 'Bronze League',
    icon: '🥉',
    color: 'amber',
    bgGradient: 'from-amber-600 via-amber-700 to-amber-800',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    minXp: 150,
    description: 'Aktyvūs mokiniai, tvirtinantys lietuviškus pasisveikinimus, skaičius ir kavinės frazes.',
    englishDescription: 'Active learners practicing Lithuanian greetings, everyday numbers, and café phrases.',
    rewards: { first: 40, second: 25, third: 15 },
  },
  Sidabras: {
    id: 'Sidabras',
    name: 'Sidabro Lyga',
    englishName: 'Silver League',
    icon: '🥈',
    color: 'zinc',
    bgGradient: 'from-slate-400 via-zinc-500 to-slate-600',
    badgeBg: 'bg-slate-200',
    badgeText: 'text-slate-900',
    minXp: 400,
    description: 'Pažengusi divizija: veiksmažodžių asmenavimas, laiko klausimai ir linksnių galūnės.',
    englishDescription: 'Advanced division: verb conjugations, time questions, and noun case endings.',
    rewards: { first: 60, second: 35, third: 20 },
  },
  Auksas: {
    id: 'Auksas',
    name: 'Aukso Lyga',
    englishName: 'Gold League',
    icon: '🥇',
    color: 'yellow',
    bgGradient: 'from-amber-400 via-yellow-500 to-amber-600',
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-950',
    minXp: 800,
    description: 'Atkakli kova dėl patekimo į čempionų Gintaro Lygą. Tik 3 geriausi gauna bilietą!',
    englishDescription: 'Competitive tier battling for qualification into the Amber League. Only the top 3 qualify!',
    rewards: { first: 80, second: 50, third: 30 },
  },
  Gintaras: {
    id: 'Gintaras',
    name: 'Gintaro Lyga',
    englishName: 'Amber League (Champions)',
    icon: '💎',
    color: 'amber',
    bgGradient: 'from-amber-500 via-orange-500 to-amber-600',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-950',
    minXp: 1500,
    description: 'Aukščiausia Baltijos gintaro divizija. Čia varžosi atkakliausi kalbos entuziastai!',
    englishDescription: 'The highest Baltic Amber division. The most dedicated language enthusiasts compete here!',
    rewards: { first: 100, second: 60, third: 40 },
  },
};

/**
 * Calculates time remaining until Sunday 23:59:59 (Weekly Tournament Close)
 */
export function getLeagueTimeRemaining(): {
  days: number;
  hours: number;
  minutes: number;
  formatted: string;
  englishFormatted: string;
  weekNumber: number;
  isEndingSoon: boolean;
} {
  const now = new Date();

  // Calculate current ISO week number
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const daysSinceStart = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);

  // Target: Sunday 23:59:59 of current week
  const currentDayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  const daysUntilSunday = currentDayOfWeek === 0 ? 0 : 7 - currentDayOfWeek;

  const targetSunday = new Date(now);
  targetSunday.setDate(now.getDate() + daysUntilSunday);
  targetSunday.setHours(23, 59, 59, 999);

  const diffMs = Math.max(0, targetSunday.getTime() - now.getTime());
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(diffMinutes / (60 * 24));
  const hours = Math.floor((diffMinutes % (60 * 24)) / 60);
  const minutes = diffMinutes % 60;

  const formatted =
    days > 0
      ? `${days} d. ${hours} val.`
      : `${hours} val. ${minutes} min.`;

  const englishFormatted =
    days > 0
      ? `${days}d ${hours}h`
      : `${hours}h ${minutes}m`;

  return {
    days,
    hours,
    minutes,
    formatted,
    englishFormatted,
    weekNumber,
    isEndingSoon: days === 0 && hours < 8,
  };
}

/**
 * Curated pool of realistic learners (Lithuanian locals + diaspora & expats learning Lithuanian)
 */
const LEARNER_POOL: Array<{ name: string; city: string; flag: string; avatarColor: string }> = [
  { name: 'Emilija Kazlauskaitė', city: 'Vilnius', flag: '🇱🇹', avatarColor: 'from-pink-500 to-rose-600' },
  { name: 'Lukas Valančius', city: 'Kaunas', flag: '🇱🇹', avatarColor: 'from-sky-500 to-blue-600' },
  { name: 'Austėja Radvilaitė', city: 'Klaipėda', flag: '🇱🇹', avatarColor: 'from-teal-500 to-emerald-600' },
  { name: 'Matas Jankauskas', city: 'Šiauliai', flag: '🇱🇹', avatarColor: 'from-amber-500 to-orange-600' },
  { name: 'Gabrielė Petraitytė', city: 'Panevėžys', flag: '🇱🇹', avatarColor: 'from-purple-500 to-indigo-600' },
  { name: 'Mindaugas Balčiūnas', city: 'Alytus', flag: '🇱🇹', avatarColor: 'from-cyan-500 to-blue-600' },
  { name: 'Dovydas Navickas', city: 'Marijampolė', flag: '🇱🇹', avatarColor: 'from-emerald-500 to-teal-600' },
  { name: 'Kotryna Stankevičiūtė', city: 'Utena', flag: '🇱🇹', avatarColor: 'from-fuchsia-500 to-pink-600' },
  { name: 'Karolis Žukauskas', city: 'Vilnius', flag: '🇱🇹', avatarColor: 'from-indigo-500 to-purple-600' },
  { name: 'Elena Vaitkutė', city: 'Klaipėda', flag: '🇱🇹', avatarColor: 'from-rose-500 to-orange-600' },
  { name: 'Liam O’Connor', city: 'Dublin', flag: '🇮🇪', avatarColor: 'from-green-500 to-emerald-700' },
  { name: 'Sarah Miller', city: 'Chicago', flag: '🇺🇸', avatarColor: 'from-blue-500 to-indigo-700' },
  { name: 'Markus Weber', city: 'Berlin', flag: '🇩🇪', avatarColor: 'from-yellow-600 to-amber-700' },
  { name: 'Sofia Rossi', city: 'Rome', flag: '🇮🇹', avatarColor: 'from-rose-400 to-pink-600' },
  { name: 'Piotr Wiśniewski', city: 'Warsaw', flag: '🇵🇱', avatarColor: 'from-red-500 to-rose-600' },
  { name: 'Olena Shevchenko', city: 'Vilnius', flag: '🇺🇦', avatarColor: 'from-yellow-400 to-blue-500' },
  { name: 'Henrik Larsson', city: 'Stockholm', flag: '🇸🇪', avatarColor: 'from-blue-400 to-yellow-500' },
  { name: 'Julija Urbonaitė', city: 'Trakai', flag: '🇱🇹', avatarColor: 'from-teal-400 to-emerald-500' },
  { name: 'Tomas Rimkus', city: 'Palanga', flag: '🇱🇹', avatarColor: 'from-cyan-400 to-sky-600' },
  { name: 'Rasa Baranauskaitė', city: 'Druskininkai', flag: '🇱🇹', avatarColor: 'from-violet-500 to-purple-700' },
  { name: 'James Evans', city: 'London', flag: '🇬🇧', avatarColor: 'from-blue-600 to-slate-700' },
  { name: 'Camille Dubois', city: 'Paris', flag: '🇫🇷', avatarColor: 'from-indigo-400 to-blue-600' },
  { name: 'Gytis Mockus', city: 'Biržai', flag: '🇱🇹', avatarColor: 'from-amber-600 to-red-600' },
  { name: 'Kamilė Norkutė', city: 'Kėdainiai', flag: '🇱🇹', avatarColor: 'from-pink-400 to-rose-500' },
  { name: 'Tadas Kučinskas', city: 'Mažeikiai', flag: '🇱🇹', avatarColor: 'from-emerald-600 to-teal-800' },
  { name: 'Viktorija Astrauskaitė', city: 'Telšiai', flag: '🇱🇹', avatarColor: 'from-purple-400 to-fuchsia-600' },
  { name: 'Jokūbas Šimkus', city: 'Tauragė', flag: '🇱🇹', avatarColor: 'from-blue-500 to-cyan-600' },
  { name: 'Chloe Brown', city: 'Toronto', flag: '🇨🇦', avatarColor: 'from-red-600 to-rose-700' },
  { name: 'Simona Bagdonaitė', city: 'Ukmergė', flag: '🇱🇹', avatarColor: 'from-teal-500 to-cyan-600' },
  { name: 'Paulius Lukauskas', city: 'Rokiškis', flag: '🇱🇹', avatarColor: 'from-orange-500 to-amber-600' },
];

/**
 * Generate stable pseudo-random integer based on seed
 */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Gets or generates a deterministic, persistent weekly cohort for a given league tier.
 * The 29 competitor scores are fixed for the week with realistic day-of-week progression,
 * allowing the user to ACTUALLY overtake opponents as they practice!
 */
export function getWeeklyCohort(
  tier: LeagueTier,
  userXp: number,
  userInfo?: { name?: string; avatar?: string; photoURL?: string }
): Competitor[] {
  const { weekNumber } = getLeagueTimeRemaining();
  const now = new Date();
  const dayOfWeekFactor = (now.getDay() === 0 ? 7 : now.getDay()) / 7; // Sunday has highest XP

  // Tier XP scaling brackets
  const xpBrackets: Record<LeagueTier, { min: number; max: number; baseStreak: number }> = {
    Geležis: { min: 30, max: 180, baseStreak: 3 },
    Bronza: { min: 140, max: 420, baseStreak: 6 },
    Sidabras: { min: 350, max: 800, baseStreak: 9 },
    Auksas: { min: 700, max: 1450, baseStreak: 12 },
    Gintaras: { min: 1300, max: 2400, baseStreak: 16 },
  };

  const bracket = xpBrackets[tier] || xpBrackets.Bronza;

  // Generate 29 distinct competitors for the cohort
  const cohortCompetitors: Competitor[] = LEARNER_POOL.slice(0, 29).map((learner, index) => {
    // Deterministic seed for stability throughout current week
    const seed = weekNumber * 100 + index * 17 + tier.length * 3;
    const rand = pseudoRandom(seed);
    const randStreak = pseudoRandom(seed + 1);

    // Score distributes from max down to min across the 29 ranks
    const rankRatio = (29 - index) / 29;
    const targetXp = bracket.min + Math.round((bracket.max - bracket.min) * (rankRatio * 0.85 + rand * 0.15));
    // Apply progress factor based on day of week
    const weeklyXp = Math.max(bracket.min, Math.round(targetXp * (0.65 + dayOfWeekFactor * 0.35)));

    const streak = Math.max(1, Math.round(bracket.baseStreak + (randStreak * 6 - 3)));

    const initials = learner.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();

    return {
      id: `learner_${tier}_${index}`,
      name: learner.name,
      city: learner.city,
      flag: learner.flag,
      avatarColor: learner.avatarColor,
      initials,
      streak,
      xp: weeklyXp,
      rank: 0,
    };
  });

  // User participant entry with real XP
  const userName = userInfo?.name || 'Tu (You)';
  const userInitials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'TU';

  const userCompetitor: Competitor = {
    id: 'user_active',
    name: userName,
    city: 'Lietuva',
    flag: '🇱🇹',
    avatarColor: 'from-amber-400 to-orange-500',
    initials: userInitials,
    photoURL: userInfo?.photoURL,
    streak: Math.max(1, Math.round(userXp / 30) || 1),
    xp: userXp,
    isUser: true,
    rank: 0,
  };

  // Combine user into cohort and rank by XP descending
  const allParticipants = [...cohortCompetitors, userCompetitor];
  allParticipants.sort((a, b) => b.xp - a.xp);

  return allParticipants.map((comp, idx) => ({
    ...comp,
    rank: idx + 1,
  }));
}
