import { doc, setDoc, getDocs, collection, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { LeagueTier, Competitor } from './league';

export interface LeaderboardMemberDoc {
  userId: string;
  displayName: string;
  photoURL?: string;
  xp: number;
  streak: number;
  tier: LeagueTier;
  updatedAt?: unknown;
}

/**
 * Sync logged-in user profile & XP to Firestore leaderboard under /leaderboard/{tier}/members/{userId}
 */
export async function syncUserToLeaderboard(
  userId: string,
  profile: {
    displayName?: string | null;
    photoURL?: string | null;
  },
  tier: LeagueTier,
  xp: number,
  streak: number
): Promise<void> {
  if (!db || !isFirebaseConfigured || !userId) return;

  try {
    const memberRef = doc(db, 'leaderboard', tier, 'members', userId);
    await setDoc(
      memberRef,
      {
        userId,
        displayName: profile.displayName || 'Lietuvių Mokinys',
        photoURL: profile.photoURL || null,
        xp,
        streak,
        tier,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err: unknown) {
    console.warn('Notice: Could not sync leaderboard to Cloud Firestore:', (err as Error)?.message || err);
  }
}

/**
 * Fetch real learners from Cloud Firestore for the selected tier
 */
export async function fetchRealLeaderboardMembers(tier: LeagueTier): Promise<Competitor[]> {
  if (!db || !isFirebaseConfigured) return [];

  try {
    const membersRef = collection(db, 'leaderboard', tier, 'members');
    const q = query(membersRef, orderBy('xp', 'desc'), limit(20));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return [];

    return snapshot.docs.map((docSnap, index) => {
      const data = docSnap.data() as LeaderboardMemberDoc;
      const name = data.displayName || 'Vartotojas';
      const initials = name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase() || 'LT';

      return {
        id: `firestore_${data.userId}`,
        name,
        city: 'Lietuva',
        flag: '🇱🇹',
        avatarColor: 'from-emerald-500 to-teal-600',
        initials,
        photoURL: data.photoURL,
        streak: data.streak || 1,
        xp: data.xp || 0,
        rank: index + 1,
      };
    });
  } catch (err: unknown) {
    console.warn('Notice: Could not fetch real Firestore leaderboard members, using cohort:', (err as Error)?.message || err);
    return [];
  }
}
