// Offline Audio Cache & Pre-Caching Manager for Sėkmės PWA
import { UNITS } from '@/data/curriculum';
import { SPEAKING_DRILLS } from '@/data/speakingDrills';

export const AUDIO_CACHE_NAME = 'sekmes-audio-v1';

// Extract all essential Lithuanian curriculum phrases for offline learning
export function getAllCurriculumPhrases(): string[] {
  const phraseSet = new Set<string>();

  // Core polite starter expressions
  const corePhrases = [
    'Labas',
    'Labas rytas',
    'Laba diena',
    'Labas vakaras',
    'Viso gero',
    'Iki pasimatymo',
    'Ačiū',
    'Labai ačiū',
    'Prašom',
    'Atsiprašau',
    'Taip',
    'Ne',
    'Kava',
    'Arbata',
    'Vanduo',
    'Namas',
    'Kava ir arbata, prašom',
    'Aš esu',
    'Tu esi',
    'Jis yra',
    'Ji yra',
    'Mes esame',
    'Jūs esate',
    'Koks jūsų vardas?',
    'Mano vardas yra Jonas.',
    'Labai malonu!',
    'Man taip pat labai malonu!',
  ];

  corePhrases.forEach(p => phraseSet.add(p.trim()));
  SPEAKING_DRILLS.forEach(d => phraseSet.add(d.phrase.trim()));

  // Extract from all lessons and exercises
  UNITS.forEach(unit => {
    unit.lessons.forEach(lesson => {
      lesson.exercises.forEach(ex => {
        if ('audioText' in ex && ex.audioText) {
          phraseSet.add(ex.audioText.trim());
        }
        if ('audioDialogue' in ex && ex.audioDialogue) {
          phraseSet.add(ex.audioDialogue.trim());
        }
        if ('targetSentence' in ex && ex.targetSentence) {
          phraseSet.add(ex.targetSentence.trim());
        }
        if ('targetPhrase' in ex && ex.targetPhrase) {
          phraseSet.add(ex.targetPhrase.trim());
        }
        if ('pairs' in ex && Array.isArray(ex.pairs)) {
          ex.pairs.forEach(pair => {
            if (pair.lithuanian) phraseSet.add(pair.lithuanian.trim());
          });
        }
        if ('words' in ex && Array.isArray(ex.words)) {
          ex.words.forEach(w => {
            const clean = w.replace(/[.,!?]/g, '').trim();
            if (clean) phraseSet.add(clean);
          });
        }
      });
    });
  });

  return Array.from(phraseSet).filter(p => p.length > 0);
}

export interface OfflineAudioStats {
  totalPhrases: number;
  cachedCount: number;
  isFullyCached: boolean;
  supported: boolean;
}

// Check how many audio clips are currently stored in CacheStorage
export async function getOfflineAudioStats(): Promise<OfflineAudioStats> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return {
      totalPhrases: 0,
      cachedCount: 0,
      isFullyCached: false,
      supported: false,
    };
  }

  const phrases = getAllCurriculumPhrases();
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const keys = await cache.keys();
    const cachedCount = keys.length;

    return {
      totalPhrases: phrases.length,
      cachedCount,
      isFullyCached: cachedCount >= Math.min(phrases.length, 30),
      supported: true,
    };
  } catch (error) {
    console.warn('Could not read offline audio stats:', error);
    return {
      totalPhrases: phrases.length,
      cachedCount: 0,
      isFullyCached: false,
      supported: true,
    };
  }
}

// Download and cache all curriculum audio phrases for complete offline availability
export async function downloadOfflineAudioPack(
  onProgress?: (loaded: number, total: number, currentPhrase: string) => void
): Promise<{ success: boolean; count: number }> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return { success: false, count: 0 };
  }

  const phrases = getAllCurriculumPhrases();
  const cache = await caches.open(AUDIO_CACHE_NAME);
  let loaded = 0;

  for (const phrase of phrases) {
    try {
      const audioUrl = `/api/tts?text=${encodeURIComponent(phrase)}&gender=female&speed=normal&v=natural-v4`;
      const request = new Request(audioUrl, { method: 'GET' });

      // Check if already in cache
      const cached = await cache.match(request);
      if (!cached) {
        const response = await fetch(request);
        if (response.ok && response.status === 200) {
          await cache.put(request, response.clone());
        }
      }
    } catch (err) {
      console.warn(`Failed to pre-cache offline audio for: "${phrase}"`, err);
    }

    loaded++;
    if (onProgress) {
      onProgress(loaded, phrases.length, phrase);
    }
  }

  return { success: true, count: loaded };
}

// Clear offline audio cache to reclaim disk storage
export async function clearOfflineAudioPack(): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return false;
  }
  try {
    await caches.delete(AUDIO_CACHE_NAME);
    return true;
  } catch {
    return false;
  }
}
