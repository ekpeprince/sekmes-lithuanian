/**
 * Pronunciation Studio Hybrid Validation & Fallback Layer
 *
 * Implements:
 * 1. Guardrail 1: Infinite Loop & Gibberish Filter (repetitive syllable/word glitch detector)
 * 2. Guardrail 2: Phonetic & Keyword Similarity Validation (presence check for core keywords)
 * 3. Guardrail 3: Multi-attempt tracking and helper logic for mic failure fallbacks
 */

export interface SpeechAnomalyResult {
  hasAnomaly: boolean;
  reason?: 'repetition_loop' | 'gibberish';
  message?: string;
}

export interface HybridValidationResult {
  isValid: boolean;
  isGlitch: boolean;
  glitchMessage?: string;
  isPartial?: boolean;
  partialPrompt?: string;
  missingWords?: string[];
  similarity: number; // 0 to 100
  keywordMatchCount: number;
  keywordTotal: number;
  matchedKeywords: string[];
  wordStatus: boolean[]; // Match status per target word
  passes: boolean;
  reason?: string;
}

/**
 * Remove Lithuanian diacritics for phonetic comparison
 */
export function stripDiacritics(str: string): string {
  return str
    .replace(/[ąĄ]/g, 'a')
    .replace(/[čČ]/g, 'c')
    .replace(/[ęĘ]/g, 'e')
    .replace(/[ėĖ]/g, 'e')
    .replace(/[įĮ]/g, 'i')
    .replace(/[šŠ]/g, 's')
    .replace(/[ųŲ]/g, 'u')
    .replace(/[ūŪ]/g, 'u')
    .replace(/[žŽ]/g, 'z');
}

/**
 * Normalize text by stripping punctuation and extraneous whitespace
 */
export function normalizeLt(str: string): string {
  return str
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Guardrail 1: The "Infinite Loop" & Gibberish Filter
 * Catches repetitive browser speech-to-text glitches (e.g. "kava kava kava", "kavakavakava", "la la la")
 */
export function detectSpeechAnomaly(transcript: string): SpeechAnomalyResult {
  if (!transcript || !transcript.trim()) {
    return { hasAnomaly: false };
  }

  const raw = transcript.trim();
  const normalized = normalizeLt(raw);
  const words = normalized.split(/\s+/).filter(Boolean);

  // 1. Consecutive word/syllable repetition (3 or more times consecutively)
  // e.g. "kava kava kava", "la la la", "labas labas labas"
  for (let i = 0; i < words.length - 2; i++) {
    if (words[i].length >= 1 && words[i] === words[i + 1] && words[i] === words[i + 2]) {
      return {
        hasAnomaly: true,
        reason: 'repetition_loop',
        message: "The microphone caught some interference. Let's try saying it one more time clearly!",
      };
    }
  }

  // 2. Unspaced repetition loops (e.g. "kavakavakava", "lalala", "labaslabaslabas")
  // Matches any sequence of 2-12 characters repeating 3 or more times continuously
  const unspacedLoopRegex = /([a-ząčęėįšųūž]{2,12})\1\1+/i;
  if (unspacedLoopRegex.test(raw)) {
    return {
      hasAnomaly: true,
      reason: 'repetition_loop',
      message: "The microphone caught some interference. Let's try saying it one more time clearly!",
    };
  }

  // 3. Multi-word phrase repetition loop (e.g. "kava prašom kava prašom kava prašom")
  if (words.length >= 6) {
    for (let i = 0; i <= words.length - 6; i++) {
      const p1 = `${words[i]} ${words[i + 1]}`;
      const p2 = `${words[i + 2]} ${words[i + 3]}`;
      const p3 = `${words[i + 4]} ${words[i + 5]}`;
      if (p1 === p2 && p2 === p3) {
        return {
          hasAnomaly: true,
          reason: 'repetition_loop',
          message: "The microphone caught some interference. Let's try saying it one more time clearly!",
        };
      }
    }
  }

  return { hasAnomaly: false };
}

/**
 * Check if a candidate token matches a target keyword with Lithuanian phonetic tolerance
 */
export function isTokenMatch(kw: string, candidate: string): boolean {
  const normKw = normalizeLt(kw);
  const normCand = normalizeLt(candidate);
  if (!normKw || !normCand) return false;

  // Exact match
  if (normKw === normCand) return true;

  // Diacritic-free match (e.g. "prasom" matches "prašom")
  const plainKw = stripDiacritics(normKw);
  const plainCand = stripDiacritics(normCand);
  if (plainKw === plainCand) return true;

  // Length difference guard: words varying by more than 2 characters cannot be the same root/stem
  const lenDiff = Math.abs(plainKw.length - plainCand.length);
  if (lenDiff > 2) return false;

  const minLen = Math.min(plainKw.length, plainCand.length);

  // Lithuanian root / stem match (e.g. "kavos"/"kavą" -> "kava"; "prašau" -> "prašom")
  if (minLen >= 4) {
    const commonPrefixLen = Math.min(4, minLen - 1);
    if (plainKw.slice(0, commonPrefixLen) === plainCand.slice(0, commonPrefixLen)) {
      return true;
    }
  }

  // Short 3-letter tokens: must match 2 leading characters and have equal length (e.g. "jau" / "jau")
  if (minLen === 3 && lenDiff <= 1) {
    if (plainKw.slice(0, 2) === plainCand.slice(0, 2) && plainKw.length === plainCand.length) {
      return true;
    }
  }

  return false;
}

/**
 * Extract core keywords from target phrase (excluding common grammatical noise words)
 */
export function extractCoreKeywords(targetPhrase: string): string[] {
  const normTarget = normalizeLt(targetPhrase);
  const words = normTarget.split(/\s+/).filter(Boolean);

  const STOP_WORDS = new Set(['ir', 'ar', 'o', 'su', 'be', 'po', 'į', 'iš', 'tai', 'yra', 'ne']);
  const filtered = words.filter(w => words.length <= 2 || !STOP_WORDS.has(w));
  return filtered.length > 0 ? filtered : words;
}

/**
 * Guardrail 2: Phonetic / Keyword Similarity Validation & Strict Sentence Completion
 * Evaluates speech transcript against target phrase using hybrid accuracy, keyword presence,
 * and strict utterance completion checks (preventing premature passes on partial phrases).
 */
export function evaluateHybridPronunciation(
  targetPhrase: string,
  transcript: string,
  acceptableVariations: string[] = []
): HybridValidationResult {
  // Check Guardrail 1 first
  const anomaly = detectSpeechAnomaly(transcript);
  if (anomaly.hasAnomaly) {
    return {
      isValid: false,
      isGlitch: true,
      glitchMessage: anomaly.message,
      similarity: 0,
      keywordMatchCount: 0,
      keywordTotal: 0,
      matchedKeywords: [],
      wordStatus: [],
      passes: false,
      isPartial: false,
      missingWords: [],
      reason: 'glitch',
    };
  }

  const normActual = normalizeLt(transcript);
  const actualWords = normActual.split(/\s+/).filter(Boolean);

  const defaultWords = normalizeLt(targetPhrase).split(/\s+/).filter(Boolean);
  if (actualWords.length === 0 || defaultWords.length === 0) {
    return {
      isValid: true,
      isGlitch: false,
      similarity: 0,
      keywordMatchCount: 0,
      keywordTotal: defaultWords.length,
      matchedKeywords: [],
      wordStatus: defaultWords.map(() => false),
      passes: false,
      isPartial: false,
      missingWords: defaultWords,
    };
  }

  // Evaluate candidate target list (target phrase + acceptable variations)
  const candidateTargets = [targetPhrase, ...acceptableVariations];
  let bestResult: HybridValidationResult | null = null;

  for (const target of candidateTargets) {
    const normTarget = normalizeLt(target);
    const targetWords = normTarget.split(/\s+/).filter(Boolean);
    if (targetWords.length === 0) continue;

    const coreKeywords = extractCoreKeywords(target);
    const keywordTotal = coreKeywords.length;

    // Track 1-to-1 token consumption so a single spoken word cannot match multiple target words
    const usedActualIndices = new Set<number>();
    let matches = 0;
    const wordStatus = targetWords.map((tw) => {
      const foundIdx = actualWords.findIndex(
        (act, idx) => !usedActualIndices.has(idx) && isTokenMatch(tw, act)
      );
      if (foundIdx !== -1) {
        usedActualIndices.add(foundIdx);
        matches += 1;
        return true;
      }
      return false;
    });

    const usedActualForKw = new Set<number>();
    const matchedKeywords: string[] = [];
    coreKeywords.forEach((kw) => {
      const foundIdx = actualWords.findIndex(
        (act, idx) => !usedActualForKw.has(idx) && isTokenMatch(kw, act)
      );
      if (foundIdx !== -1) {
        usedActualForKw.add(foundIdx);
        matchedKeywords.push(kw);
      }
    });

    const keywordMatchCount = matchedKeywords.length;
    const baseSimilarity = Math.round((matches / targetWords.length) * 100);

    // Identify which words were missed
    const missingWords: string[] = [];
    targetWords.forEach((tw, idx) => {
      if (!wordStatus[idx]) missingWords.push(tw);
    });

    // Detect partial / incomplete utterances:
    // User spoke some words, but missed subsequent keywords or the sentence ending
    const isEndingMissing = targetWords.length > 2 && !wordStatus[targetWords.length - 1];
    const isLengthShort = actualWords.length < targetWords.length;
    const isPartial =
      matches > 0 &&
      missingWords.length > 0 &&
      (isEndingMissing || isLengthShort || keywordMatchCount < keywordTotal);

    let partialPrompt: string | undefined = undefined;
    if (isPartial) {
      const missingSnippet = missingWords.slice(0, 3).join(' ');
      const spokenSnippet = actualWords.join(' ');
      partialPrompt = `Keep going! You said: "${spokenSnippet}..." — complete the phrase: "...${missingSnippet}"`;
    }

    // Strict pass requirements:
    // 1. Must NOT be an incomplete partial utterance
    // 2. Base similarity must be at least 75%
    // 3. Keyword requirement: all core keywords required for <= 4 words, at least (keywordTotal - 1) for >= 5 words
    const minRequiredKeywords = keywordTotal >= 5 ? keywordTotal - 1 : keywordTotal;
    const meetsKeywordRequirement = keywordMatchCount >= minRequiredKeywords;

    const passes = !isPartial && baseSimilarity >= 75 && meetsKeywordRequirement;

    // Accuracy score: on partial sentences, cap score proportionally without false 100% inflation
    const finalScore = isPartial ? Math.min(baseSimilarity, 65) : baseSimilarity;

    const candidateResult: HybridValidationResult = {
      isValid: true,
      isGlitch: false,
      similarity: finalScore,
      keywordMatchCount,
      keywordTotal,
      matchedKeywords,
      wordStatus,
      passes,
      isPartial,
      partialPrompt,
      missingWords,
    };

    if (
      !bestResult ||
      (candidateResult.passes && !bestResult.passes) ||
      (!bestResult.passes && candidateResult.similarity > bestResult.similarity)
    ) {
      bestResult = candidateResult;
    }
  }

  return (
    bestResult || {
      isValid: true,
      isGlitch: false,
      similarity: 0,
      keywordMatchCount: 0,
      keywordTotal: defaultWords.length,
      matchedKeywords: [],
      wordStatus: defaultWords.map(() => false),
      passes: false,
      isPartial: false,
      missingWords: defaultWords,
    }
  );
}
