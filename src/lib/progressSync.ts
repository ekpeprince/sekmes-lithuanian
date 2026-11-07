import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { UserProgress, TokenClaimRecord, LearningLogEntry } from '@/types/lesson';

/**
 * Save user progress & Stellar wallet/XP schema to Cloud Firestore under users/{userId}
 */
export async function saveProgressToCloud(
  userId: string,
  progress: UserProgress,
  userEmail?: string | null
): Promise<void> {
  if (!db || !isFirebaseConfigured || !userId) return;

  try {
    const userRef = doc(db, 'users', userId);
    const xpBalance = typeof progress.xpBalance === 'number' ? progress.xpBalance : progress.xp;
    const lifetimeXpEarned = Math.max(
      progress.lifetimeXpEarned || 0,
      xpBalance,
      progress.xp || 0
    );

    const payload: Record<string, unknown> = {
      uid: userId,
      stellarPublicKey: progress.stellarPublicKey ?? null,
      xpBalance,
      lifetimeXpEarned,
      streakDays: progress.streakDays ?? progress.streak ?? 1,
      lastClaimTimestamp: progress.lastClaimTimestamp ?? null,
      totalLabasClaimed: progress.totalLabasClaimed || 0,
      voiceDrillsCompleted: progress.voiceDrillsCompleted || 0,
      progress: {
        xp: xpBalance,
        xpBalance,
        lifetimeXpEarned,
        hearts: progress.hearts,
        maxHearts: progress.maxHearts,
        streak: progress.streak,
        streakDays: progress.streak,
        completedLessons: progress.completedLessons,
        lastActiveDate: progress.lastActiveDate,
        gems: progress.gems,
        leagueTier: progress.leagueTier || 'Geležis',
        voiceGender: progress.voiceGender || 'male',
        stellarPublicKey: progress.stellarPublicKey ?? null,
        lastClaimTimestamp: progress.lastClaimTimestamp ?? null,
        totalLabasClaimed: progress.totalLabasClaimed || 0,
        voiceDrillsCompleted: progress.voiceDrillsCompleted || 0,
        duelsWonCount: progress.duelsWonCount || 0,
        wordsMasteredCount: progress.wordsMasteredCount || 0,
        totalPracticeSeconds: progress.totalPracticeSeconds || 0,
      },
      updatedAt: serverTimestamp(),
    };

    if (userEmail !== undefined && userEmail !== null) {
      payload.email = userEmail;
    }

    await setDoc(userRef, payload, { merge: true });
  } catch (error: unknown) {
    console.warn(
      'Notice: Could not save progress to cloud Firestore:',
      (error as Error)?.message || error
    );
  }
}

/**
 * Load user progress and top-level Stellar XP schema from Cloud Firestore under users/{userId}
 */
export async function loadProgressFromCloud(
  userId: string
): Promise<Partial<UserProgress> | null> {
  if (!db || !isFirebaseConfigured || !userId) return null;

  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();
      const nested = (data.progress || {}) as Partial<UserProgress>;
      const topXpBalance =
        typeof data.xpBalance === 'number'
          ? data.xpBalance
          : typeof nested.xpBalance === 'number'
          ? nested.xpBalance
          : typeof nested.xp === 'number'
          ? nested.xp
          : undefined;

      const topLifetimeXp =
        typeof data.lifetimeXpEarned === 'number'
          ? data.lifetimeXpEarned
          : typeof nested.lifetimeXpEarned === 'number'
          ? nested.lifetimeXpEarned
          : topXpBalance;

      return {
        ...nested,
        ...(topXpBalance !== undefined ? { xp: topXpBalance, xpBalance: topXpBalance } : {}),
        ...(topLifetimeXp !== undefined ? { lifetimeXpEarned: topLifetimeXp } : {}),
        stellarPublicKey:
          data.stellarPublicKey !== undefined
            ? data.stellarPublicKey
            : nested.stellarPublicKey ?? null,
        streak:
          typeof data.streakDays === 'number'
            ? data.streakDays
            : nested.streak ?? 1,
        streakDays:
          typeof data.streakDays === 'number'
            ? data.streakDays
            : nested.streak ?? 1,
        lastClaimTimestamp:
          data.lastClaimTimestamp !== undefined
            ? data.lastClaimTimestamp
            : nested.lastClaimTimestamp ?? null,
        totalLabasClaimed:
          typeof data.totalLabasClaimed === 'number'
            ? data.totalLabasClaimed
            : nested.totalLabasClaimed ?? 0,
        voiceDrillsCompleted:
          typeof data.voiceDrillsCompleted === 'number'
            ? data.voiceDrillsCompleted
            : nested.voiceDrillsCompleted ?? 0,
      };
    }
  } catch (error: unknown) {
    console.warn(
      'Notice: Firestore progress sync unavailable, using local progress:',
      (error as Error)?.message || error
    );
  }

  return null;
}

/**
 * Link or update the user's Stellar Mainnet public key in Firestore under users/{userId}
 */
export async function saveStellarWalletToCloud(
  userId: string,
  stellarPublicKey: string | null,
  userEmail?: string | null
): Promise<void> {
  if (!db || !isFirebaseConfigured || !userId) return;

  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        uid: userId,
        ...(userEmail ? { email: userEmail } : {}),
        stellarPublicKey: stellarPublicKey ? stellarPublicKey.trim() : null,
        progress: {
          stellarPublicKey: stellarPublicKey ? stellarPublicKey.trim() : null,
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error: unknown) {
    console.warn(
      'Notice: Could not save Stellar wallet to Firestore:',
      (error as Error)?.message || error
    );
  }
}

/**
 * Record verified learning achievement in Firestore learning_logs collection
 */
export async function logLearningAchievementToCloud(
  entry: Omit<LearningLogEntry, 'timestamp'>
): Promise<void> {
  if (!db || !isFirebaseConfigured || !entry.uid) return;

  try {
    const logsRef = collection(db, 'learning_logs');
    await addDoc(logsRef, {
      uid: entry.uid,
      activityType: entry.activityType,
      xpEarned: entry.xpEarned,
      referenceId: entry.referenceId || null,
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp(),
    });
  } catch (error: unknown) {
    console.warn(
      'Notice: Could not record learning_logs entry:',
      (error as Error)?.message || error
    );
  }
}

/**
 * Load user's $LABAS token claim history from users/{userId}/token_claims or top-level token_claims
 */
export async function loadTokenClaimsFromCloud(
  userId: string
): Promise<TokenClaimRecord[]> {
  if (!db || !isFirebaseConfigured || !userId) return [];

  try {
    const subRef = collection(db, 'users', userId, 'token_claims');
    const q = query(subRef, orderBy('timestamp', 'desc'), limit(20));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<TokenClaimRecord, 'id'>),
      }));
    }

    const topRef = collection(db, 'token_claims');
    const topQ = query(topRef, where('uid', '==', userId), limit(20));
    const topSnap = await getDocs(topQ);
    const items = topSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<TokenClaimRecord, 'id'>),
    }));
    return items.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  } catch (error: unknown) {
    console.warn(
      'Notice: Could not load token_claims from Firestore:',
      (error as Error)?.message || error
    );
    return [];
  }
}
