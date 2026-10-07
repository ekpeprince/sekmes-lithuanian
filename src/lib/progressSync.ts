import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { UserProgress } from '@/types/lesson';

/**
 * Save user progress to Cloud Firestore under users/{userId}
 */
export async function saveProgressToCloud(userId: string, progress: UserProgress): Promise<void> {
  if (!db || !isFirebaseConfigured || !userId) return;

  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        progress: {
          xp: progress.xp,
          hearts: progress.hearts,
          maxHearts: progress.maxHearts,
          streak: progress.streak,
          completedLessons: progress.completedLessons,
          lastActiveDate: progress.lastActiveDate,
          gems: progress.gems,
          leagueTier: progress.leagueTier || 'Gintaras',
          voiceGender: progress.voiceGender || 'female',
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error: unknown) {
    console.warn('Notice: Could not save progress to cloud Firestore:', (error as Error)?.message || error);
  }
}

/**
 * Load user progress from Cloud Firestore under users/{userId}
 */
export async function loadProgressFromCloud(userId: string): Promise<Partial<UserProgress> | null> {
  if (!db || !isFirebaseConfigured || !userId) return null;

  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);

    if (snap.exists() && snap.data().progress) {
      return snap.data().progress as Partial<UserProgress>;
    }
  } catch (error: unknown) {
    // If Cloud Firestore hasn't been created yet in Firebase Console or network is unreachable, fallback silently to local progress
    console.warn('Notice: Firestore progress sync unavailable, using local progress:', (error as Error)?.message || error);
  }

  return null;
}
