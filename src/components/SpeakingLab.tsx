'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Flame,
  Info,
  Zap,
} from 'lucide-react';
import { SPEAKING_DRILLS, SpeakingDrillItem } from '@/data/speakingDrills';
import { SYLLABLE_STRESS_DRILLS, SyllableStressItem } from '@/data/syllableStressDrills';
import { sounds } from '@/lib/audio';
import { useGame } from '@/context/GameContext';
import { evaluateHybridPronunciation } from '@/lib/speechValidation';

// Normalize Lithuanian text for lenient comparison
function normalizeLt(str: string): string {
  return str
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Compute word-level and sentence-level similarity
function computeMatchDetails(target: string, actual: string) {
  const normTarget = normalizeLt(target);
  const normActual = normalizeLt(actual);

  if (!normTarget || !normActual) {
    return { score: 0, wordStatus: [] as boolean[] };
  }

  const targetWords = normTarget.split(' ');
  const actualWords = normActual.split(' ');

  let matches = 0;
  const wordStatus = targetWords.map((word) => {
    if (actualWords.includes(word)) {
      matches += 1;
      return true;
    }
    // Partial root match
    const hasClose = actualWords.some(
      (act) => act.startsWith(word.slice(0, -1)) || word.startsWith(act.slice(0, -1))
    );
    if (hasClose) {
      matches += 0.75;
      return true;
    }
    return false;
  });

  const score = Math.min(100, Math.round((matches / targetWords.length) * 100));
  return { score, wordStatus };
}

// Parse hyphenated syllable string like "la-BA die-NA" into structured word tokens
function parseSyllables(syllablesStr?: string) {
  if (!syllablesStr) return [];
  const words = syllablesStr.split(' ');
  return words.map((w) => {
    const parts = w.split('-');
    return parts.map((part) => {
      const clean = part.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, '');
      const isStressed = clean.length > 0 && clean === clean.toUpperCase() && /[A-ZĄČĘĖĮŠŲŪŽ]/.test(clean);
      return {
        text: part,
        isStressed,
      };
    });
  });
}

interface SpeechRecognitionEventLike {
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionClass(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

const STORAGE_KEY_MASTERED = 'sekmes_speaking_mastered_ids';

export interface SpeakingLabProps {
  onBack?: () => void;
  initialMode?: 'phrases' | 'syllables';
}

export const SpeakingLab: React.FC<SpeakingLabProps> = ({
  onBack,
  initialMode = 'phrases',
}) => {
  const { addXp } = useGame();

  // Mode: Full phrase speech recognition studio VS Syllable stress trainer
  const [labMode, setLabMode] = useState<'phrases' | 'syllables'>(initialMode);

  // --- PHRASE STUDIO STATE ---
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<'normal' | 'slow' | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [score, setScore] = useState<number | null>(null);
  const [matchedWords, setMatchedWords] = useState<boolean[]>([]);
  const [speechSupported, setSpeechSupported] = useState<boolean>(() =>
    Boolean(getSpeechRecognitionClass())
  );
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [showCelebration, setShowCelebration] = useState(false);

  // Hybrid Validation & Escape Hatch States
  const [glitchMessage, setGlitchMessage] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [fallbackMode, setFallbackMode] = useState<'voice' | 'tap_words' | 'text_verify'>('voice');
  const [assembledWordTiles, setAssembledWordTiles] = useState<string[]>([]);

  // --- SYLLABLE STRESS TRAINER STATE ---
  const [stressCategory, setStressCategory] = useState<string>('all');
  const [stressIndex, setStressIndex] = useState(0);
  const [selectedSyllableIdx, setSelectedSyllableIdx] = useState<number | null>(null);
  const [stressAnswerStatus, setStressAnswerStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [stressStreak, setStressStreak] = useState(0);
  const [stressMasteredIds, setStressMasteredIds] = useState<string[]>([]);
  const [isPlayingStressAudio, setIsPlayingStressAudio] = useState<'normal' | 'slow' | null>(null);

  // Mastered phrase IDs saved in localStorage
  const [masteredIds, setMasteredIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MASTERED);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Filtered drills based on category
  const filteredDrills = React.useMemo(() => {
    if (selectedCategory === 'all') return SPEAKING_DRILLS;
    return SPEAKING_DRILLS.filter((d) => d.category === selectedCategory);
  }, [selectedCategory]);

  const currentItem: SpeakingDrillItem = filteredDrills[currentIndex] || SPEAKING_DRILLS[0];
  const isMastered = masteredIds.includes(currentItem.id);

  // Scrambled word tiles for Guardrail 3 fallback interactive ordering
  const scrambledWordTiles = React.useMemo(() => {
    const rawWords = currentItem.phrase.split(/\s+/).filter(Boolean);
    const tiles = rawWords.map((word, i) => ({ id: `${word}-${i}`, word }));
    return tiles.slice().reverse();
  }, [currentItem.phrase]);

  const handleBypassRound = () => {
    sounds.playSuccess();
    recordMastered(currentItem.id);
    setFailedAttempts(0);
    setGlitchMessage(null);
    setFallbackMode('voice');
    setAssembledWordTiles([]);
  };

  // Filtered syllable stress items
  const filteredStressDrills = React.useMemo(() => {
    if (stressCategory === 'all') return SYLLABLE_STRESS_DRILLS;
    return SYLLABLE_STRESS_DRILLS.filter((d) => d.category === stressCategory);
  }, [stressCategory]);

  const currentStressItem: SyllableStressItem =
    filteredStressDrills[stressIndex] || SYLLABLE_STRESS_DRILLS[0];

  // Clean up timers & recognition
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  // Save mastered IDs to localStorage
  const recordMastered = (id: string) => {
    if (!masteredIds.includes(id)) {
      const updated = [...masteredIds, id];
      setMasteredIds(updated);
      try {
        localStorage.setItem(STORAGE_KEY_MASTERED, JSON.stringify(updated));
      } catch {}
      addXp(15);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  };

  const handlePlayModelAudio = (slow: boolean = false) => {
    setIsPlayingAudio(slow ? 'slow' : 'normal');
    sounds.speak(currentItem.phrase, {
      slow,
      onEnd: () => setIsPlayingAudio(null),
    });
  };

  const handlePlayStressAudio = (slow: boolean = false) => {
    setIsPlayingStressAudio(slow ? 'slow' : 'normal');
    sounds.speak(currentStressItem.audioText, {
      slow,
      onEnd: () => setIsPlayingStressAudio(null),
    });
  };

  const clearAllTimers = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const stopListening = () => {
    clearAllTimers();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
  };

  const startListening = () => {
    const Ctor = getSpeechRecognitionClass();
    if (!Ctor) {
      setSpeechSupported(false);
      return;
    }

    setTranscript('');
    setScore(null);
    setMatchedWords([]);
    setGlitchMessage(null);
    setTimeLeft(10);
    setIsRecording(true);

    try {
      const rec = new Ctor();
      recognitionRef.current = rec;
      rec.lang = 'lt-LT';
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 3;

      let passedThisSession = false;
      let glitchCaught = false;

      rec.onresult = (event: SpeechRecognitionEventLike) => {
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          finalTranscript += event.results[i][0].transcript;
        }

        setTranscript(finalTranscript);

        // Hybrid Validation: Guardrail 1 & 2
        const validation = evaluateHybridPronunciation(
          currentItem.phrase,
          finalTranscript,
          currentItem.acceptableVariations || []
        );

        // Guardrail 1: Catch repetitive browser speech loops
        if (validation.isGlitch) {
          glitchCaught = true;
          setGlitchMessage(
            validation.glitchMessage ||
              "The microphone caught some interference. Let's try saying it one more time clearly!"
          );
          setScore(0);
          setMatchedWords([]);
          setFailedAttempts((prev) => prev + 1);
          stopListening();
          return;
        }

        setGlitchMessage(null);
        setScore(validation.similarity);
        setMatchedWords(validation.wordStatus);

        // Guardrail 2: Accepts high match (>=70%) or moderate (50–70%) with core keywords
        if (validation.passes) {
          passedThisSession = true;
          sounds.playSuccess();
          recordMastered(currentItem.id);
          setFailedAttempts(0);
          setFallbackMode('voice');
          stopListening();
        }
      };

      rec.onerror = () => {
        stopListening();
      };

      rec.onend = () => {
        setIsRecording(false);
        clearAllTimers();
        if (!passedThisSession && !glitchCaught && !isMastered) {
          setFailedAttempts((prev) => prev + 1);
        }
      };

      rec.start();

      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopListening();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setIsRecording(false);
    }
  };

  const handleNext = () => {
    stopListening();
    setTranscript('');
    setScore(null);
    setMatchedWords([]);
    setGlitchMessage(null);
    setFailedAttempts(0);
    setFallbackMode('voice');
    setAssembledWordTiles([]);
    setCurrentIndex((prev) => (prev + 1) % filteredDrills.length);
  };

  const handlePrev = () => {
    stopListening();
    setTranscript('');
    setScore(null);
    setMatchedWords([]);
    setGlitchMessage(null);
    setFailedAttempts(0);
    setFallbackMode('voice');
    setAssembledWordTiles([]);
    setCurrentIndex((prev) => (prev - 1 + filteredDrills.length) % filteredDrills.length);
  };


  // --- SYLLABLE STRESS TRAINER HANDLERS ---
  const handleSelectStressSyllable = (idx: number) => {
    if (stressAnswerStatus === 'correct') return;

    setSelectedSyllableIdx(idx);
    const isCorrect = idx === currentStressItem.stressedIndex;

    if (isCorrect) {
      setStressAnswerStatus('correct');
      sounds.playSuccess();
      setStressStreak((prev) => prev + 1);
      if (!stressMasteredIds.includes(currentStressItem.id)) {
        setStressMasteredIds((prev) => [...prev, currentStressItem.id]);
        addXp(10);
      }
    } else {
      setStressAnswerStatus('incorrect');
      sounds.playError();
      setStressStreak(0);
    }
  };

  const handleNextStressItem = () => {
    setSelectedSyllableIdx(null);
    setStressAnswerStatus('idle');
    setStressIndex((prev) => (prev + 1) % filteredStressDrills.length);
  };

  const targetWords = currentItem.phrase.split(' ');
  const syllableGroups = parseSyllables(currentItem.syllables);

  return (
    <div className="w-full max-w-xl mx-auto h-[100dvh] max-h-[100dvh] flex flex-col justify-between overflow-hidden bg-slate-50 select-none">
      {/* 1. Compact Header + Progress Bar */}
      <header className="shrink-0 px-4 py-2.5 sm:py-3 border-b border-slate-200/80 bg-white/90 backdrop-blur-md flex items-center justify-between gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition py-1 px-2 -ml-2 rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Practice</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Mic className="w-4 h-4 text-rose-500" />
            <span>Practice Gym</span>
          </div>
        )}

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setLabMode('phrases');
            }}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              labMode === 'phrases'
                ? 'bg-white text-rose-600 shadow-2xs font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Phrases
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setLabMode('syllables');
            }}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              labMode === 'syllables'
                ? 'bg-white text-amber-600 shadow-2xs font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Syllables
          </button>
        </div>

        {/* Compact Progress Bar [==== 1/22 ====] */}
        <div className="flex items-center gap-2">
          <div className="w-16 sm:w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{
                width:
                  labMode === 'phrases'
                    ? `${((currentIndex + 1) / filteredDrills.length) * 100}%`
                    : `${((stressIndex + 1) / filteredStressDrills.length) * 100}%`,
              }}
            />
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-500">
            {labMode === 'phrases'
              ? `${currentIndex + 1}/${filteredDrills.length}`
              : `${stressIndex + 1}/${filteredStressDrills.length}`}
          </span>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* MODE 1: PHRASE PRONUNCIATION & VOICE RECOGNITION STUDIO              */}
      {/* ==================================================================== */}
      {labMode === 'phrases' ? (
        <>
          {/* Sub-bar: Category Filter Pills (Clean English) */}
          <div className="shrink-0 px-4 py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none border-b border-slate-100 bg-white/50">
            {[
              { id: 'all', label: 'All' },
              { id: 'greetings', label: 'Greetings' },
              { id: 'dining', label: 'Café & Food' },
              { id: 'navigation', label: 'Navigation' },
              { id: 'twisters', label: 'Tongue Twisters' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setCurrentIndex(0);
                  setFailedAttempts(0);
                  setGlitchMessage(null);
                  setFallbackMode('voice');
                  setAssembledWordTiles([]);
                  stopListening();
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-rose-500 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Main Middle Exercise Area (Fitted inside 100dvh without scroll) */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col items-center justify-around text-center gap-2">
            {/* Celebration or Mastered badge */}
            {showCelebration ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold animate-bounce shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Great pronunciation! +15 XP</span>
              </div>
            ) : isMastered ? (
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                <span>Mastered</span>
              </div>
            ) : null}

            {/* Target Lithuanian Phrase (Bold 28px) */}
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight leading-tight">
                {currentItem.phrase}
              </h2>
              {/* Muted Phonetics */}
              <div className="text-xs sm:text-sm font-mono font-bold text-slate-400">
                /{currentItem.phonetic}/
              </div>
              {/* Slate-500 Translation */}
              <p className="text-sm font-medium text-slate-500 italic">
                &ldquo;{currentItem.english}&rdquo;
              </p>
            </div>

            {/* Clean Tactile Audio Pills */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handlePlayModelAudio(false)}
                disabled={isPlayingAudio !== null}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                  isPlayingAudio === 'normal'
                    ? 'bg-sky-500 text-white ring-2 ring-sky-300 animate-pulse'
                    : 'bg-white text-sky-700 border border-slate-200 hover:bg-sky-50 shadow-2xs'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5 text-sky-600" />
                <span>Normal (1.0x)</span>
              </button>

              <button
                type="button"
                onClick={() => handlePlayModelAudio(true)}
                disabled={isPlayingAudio !== null}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                  isPlayingAudio === 'slow'
                    ? 'bg-amber-500 text-white ring-2 ring-amber-300 animate-pulse'
                    : 'bg-white text-amber-800 border border-slate-200 hover:bg-amber-50 shadow-2xs'
                }`}
              >
                <span>🐢 Slow (0.75x)</span>
              </button>
            </div>

            {/* Streamlined Syllable Stress Card (Single subtle card) */}
            <div className="w-full max-w-sm bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 sm:p-3.5 text-center shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                  Syllable Stress:
                </span>
                {currentItem.accentedPhrase && (
                  <span className="text-[10px] font-bold text-amber-950 bg-amber-200/60 px-2 py-0.5 rounded-full">
                    {currentItem.accentedPhrase}
                  </span>
                )}
              </div>

              {/* Syllables as clean interactive chips: [ LÁ · bas ] [ RÝ · tas ] */}
              <div className="flex flex-wrap items-center justify-center gap-2 my-1">
                {syllableGroups.map((wordSyllables, wIdx) => (
                  <div
                    key={wIdx}
                    className="flex items-center gap-1 bg-white border border-amber-300/80 px-2.5 py-1 rounded-xl shadow-2xs"
                  >
                    {wordSyllables.map((syl, sIdx) => (
                      <React.Fragment key={sIdx}>
                        {sIdx > 0 && (
                          <span className="text-amber-400 font-bold text-xs select-none">·</span>
                        )}
                        <button
                          type="button"
                          onClick={() => sounds.speak(syl.text)}
                          className={`px-2 py-0.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            syl.isStressed
                              ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-300'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                          title={syl.isStressed ? 'Stressed syllable - tap to pronounce' : 'Unstressed'}
                        >
                          {syl.text}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                ))}
              </div>

              {/* Concise sub-caption */}
              <p className="text-[11px] text-amber-900/80 font-medium mt-1 leading-snug">
                {currentItem.stressRule || 'Initial stress with falling tone on both words'}
              </p>
            </div>

            {/* Mouth & Tongue Tip (Compact 1-line callout) */}
            {currentItem.tip && (
              <div className="text-xs text-slate-600 flex items-center justify-center gap-1.5 max-w-sm px-2 text-center">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate" title={currentItem.tip}>
                  {currentItem.tip}
                </span>
              </div>
            )}

            {/* Word-by-Word Matching Chips */}
            {targetWords.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-sm">
                {targetWords.map((word, idx) => {
                  const isMatched = matchedWords[idx];
                  return (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition-all ${
                        isMatched
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs'
                          : isRecording
                          ? 'bg-slate-100 text-slate-500 border-slate-200'
                          : transcript
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {isMatched ? '✓ ' : ''}
                      {word}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Elevated 3D Mic Button & Feedback */}
            <div className="flex flex-col items-center gap-1.5 my-1">
              <div className="relative">
                {isRecording && (
                  <span className="absolute -inset-2.5 rounded-full bg-rose-400 opacity-40 animate-ping" />
                )}
                <button
                  type="button"
                  onClick={isRecording ? stopListening : startListening}
                  className={`relative btn-tactile flex items-center justify-center w-16 h-16 sm:w-18 sm:h-18 rounded-full font-black shadow-lg transition-transform active:scale-95 cursor-pointer ${
                    isRecording
                      ? 'bg-rose-500 text-white ring-4 ring-rose-200 border-b-4 border-rose-700'
                      : score !== null && score >= 70
                      ? 'bg-emerald-500 text-white border-b-4 border-emerald-700'
                      : 'bg-sky-500 hover:bg-sky-400 text-white border-b-4 border-sky-700'
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="w-7 h-7 sm:w-8 sm:h-8 animate-bounce" />
                  ) : score !== null && score >= 70 ? (
                    <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9" />
                  ) : (
                    <Mic className="w-7 h-7 sm:w-8 sm:h-8" />
                  )}
                </button>
              </div>

              {/* Status Caption */}
              <p className="text-xs font-semibold text-slate-500">
                {!speechSupported
                  ? 'Speech recognition not supported in this browser'
                  : isRecording
                  ? `Listening... (${timeLeft}s left)`
                  : glitchMessage
                  ? "Interference caught • Let's try again"
                  : score !== null && score >= 70
                  ? `Great pronunciation! (${score}% accuracy)`
                  : transcript
                  ? `${score}% accuracy • Tap mic to retry`
                  : 'Tap to check pronunciation'}
              </p>
            </div>

            {/* Guardrail 1: Soft retry banner on speech engine glitch */}
            {glitchMessage && (
              <div className="w-full max-w-sm px-3.5 py-2.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-2 animate-fadeIn shadow-2xs">
                <span className="text-base shrink-0">⚠️</span>
                <span className="leading-snug">{glitchMessage}</span>
              </div>
            )}

            {/* Transcript if spoken */}
            {transcript && (
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium max-w-xs">
                &ldquo;{transcript}&rdquo;
              </div>
            )}

            {/* Guardrail 3: Mic Failure Fallback / Escape Hatch after 2 consecutive failed attempts */}
            {failedAttempts >= 2 && !isMastered && (
              <div className="w-full max-w-sm my-2 p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 text-left shadow-xs animate-pop">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-lg shrink-0">🎙️</span>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
                      Having microphone trouble?
                    </h4>
                    <p className="text-[11px] text-amber-900/80 leading-snug mt-0.5">
                      Speech recognition can mishear accents or device inputs. Choose an escape hatch below so you&apos;re never stuck:
                    </p>
                  </div>
                </div>

                {fallbackMode === 'tap_words' ? (
                  <div className="mt-2 pt-2 border-t border-amber-200/80">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block mb-1.5">
                      🧩 Tap words in correct order:
                    </span>

                    {/* Assembled slots */}
                    <div className="min-h-9 p-1.5 rounded-xl bg-white border border-amber-300 flex flex-wrap gap-1.5 mb-2">
                      {assembledWordTiles.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic px-1 self-center">
                          Tap words below in order...
                        </span>
                      ) : (
                        assembledWordTiles.map((tileId) => {
                          const tile = scrambledWordTiles.find((t) => t.id === tileId);
                          if (!tile) return null;
                          return (
                            <button
                              key={tile.id}
                              type="button"
                              onClick={() => {
                                sounds.playClick();
                                setAssembledWordTiles((prev) => prev.filter((id) => id !== tile.id));
                              }}
                              className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-2xs active:scale-95 cursor-pointer"
                            >
                              {tile.word}
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* Available word tiles */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {scrambledWordTiles
                        .filter((tile) => !assembledWordTiles.includes(tile.id))
                        .map((tile) => (
                          <button
                            key={tile.id}
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              const nextAssembled = [...assembledWordTiles, tile.id];
                              setAssembledWordTiles(nextAssembled);
                              if (nextAssembled.length === scrambledWordTiles.length) {
                                const assembledWords = nextAssembled.map(
                                  (id) => scrambledWordTiles.find((t) => t.id === id)?.word || ''
                                );
                                const targetWords = currentItem.phrase.split(/\s+/).filter(Boolean);
                                const isCorrect =
                                  normalizeLt(assembledWords.join(' ')) ===
                                  normalizeLt(targetWords.join(' '));
                                if (isCorrect) {
                                  sounds.playSuccess();
                                  recordMastered(currentItem.id);
                                  setFailedAttempts(0);
                                  setFallbackMode('voice');
                                } else {
                                  sounds.playError();
                                }
                              }
                            }}
                            className="px-2.5 py-1 rounded-xl bg-white border border-slate-300 hover:border-amber-400 font-bold text-xs text-slate-800 shadow-2xs active:scale-95 cursor-pointer"
                          >
                            {tile.word}
                          </button>
                        ))}
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFallbackMode('voice');
                          setAssembledWordTiles([]);
                        }}
                        className="text-amber-800 font-bold hover:underline cursor-pointer"
                      >
                        ← Back to Microphone
                      </button>
                      <button
                        type="button"
                        onClick={handleBypassRound}
                        className="text-amber-900 font-extrabold hover:underline cursor-pointer"
                      >
                        Bypass Round →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setFallbackMode('tap_words');
                        setAssembledWordTiles([]);
                      }}
                      className="btn-tactile w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                    >
                      <span>🧩 Tap words to order</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleBypassRound}
                      className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 transition"
                    >
                      <span>✓ Continue via text verification</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky Bottom Action Bar */}
          <footer className="shrink-0 p-4 bg-white/90 backdrop-blur border-t border-slate-100 flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrev}
              className="px-4 py-3 rounded-2xl border-2 border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="btn-tactile bg-emerald-600 border-b-4 border-emerald-700 active:border-b-0 text-white font-bold py-3 w-full rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer flex-1"
            >
              <span>Next Phrase</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </footer>
        </>
      ) : (
        /* ==================================================================== */
        /* MODE 2: INTERACTIVE SYLLABLE STRESS TRAINER                          */
        /* ==================================================================== */
        <>
          {/* Sub-bar: Category Filter Pills */}
          <div className="shrink-0 px-4 py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none border-b border-slate-100 bg-white/50">
            {[
              { id: 'all', label: 'All Words' },
              { id: 'basics', label: 'Basics' },
              { id: 'food', label: 'Food' },
              { id: 'places', label: 'Places' },
              { id: 'people', label: 'People' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setStressCategory(cat.id);
                  setStressIndex(0);
                  setSelectedSyllableIdx(null);
                  setStressAnswerStatus('idle');
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  stressCategory === cat.id
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Main Middle Syllable Challenge Area */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col items-center justify-around text-center gap-3">
            {/* Top streak indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>Streak: {stressStreak}🔥</span>
            </div>

            {/* Target Word & Translation */}
            <div className="space-y-1">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {currentStressItem.word}
              </h2>
              <p className="text-sm font-medium text-slate-500 italic">
                &ldquo;{currentStressItem.english}&rdquo;
              </p>
            </div>

            {/* Audio Listen Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePlayStressAudio(false)}
                disabled={isPlayingStressAudio !== null}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                  isPlayingStressAudio === 'normal'
                    ? 'bg-sky-500 text-white ring-2 ring-sky-300 animate-pulse'
                    : 'bg-white text-sky-700 border border-slate-200 hover:bg-sky-50 shadow-2xs'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5 text-sky-600" />
                <span>Normal (1.0x)</span>
              </button>

              <button
                type="button"
                onClick={() => handlePlayStressAudio(true)}
                disabled={isPlayingStressAudio !== null}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                  isPlayingStressAudio === 'slow'
                    ? 'bg-amber-500 text-white ring-2 ring-amber-300 animate-pulse'
                    : 'bg-white text-amber-800 border border-slate-200 hover:bg-amber-50 shadow-2xs'
                }`}
              >
                <span>🐢 Slow (0.75x)</span>
              </button>
            </div>

            {/* Question Banner */}
            <div className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
              <span>Which syllable is stressed?</span>
            </div>

            {/* Interactive Syllable Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-sm">
              {currentStressItem.syllables.map((syl, sIdx) => {
                const isSelected = selectedSyllableIdx === sIdx;
                const isTargetStressed = sIdx === currentStressItem.stressedIndex;

                let btnClass =
                  'bg-white border-2 border-slate-300 text-slate-800 hover:border-amber-400 hover:scale-105 shadow-2xs';

                if (stressAnswerStatus === 'correct') {
                  if (isTargetStressed) {
                    btnClass =
                      'bg-emerald-500 border-2 border-emerald-600 text-white shadow-md ring-4 ring-emerald-200 scale-105 animate-bounce';
                  } else {
                    btnClass = 'bg-slate-100 border-2 border-slate-200 text-slate-400 opacity-60';
                  }
                } else if (stressAnswerStatus === 'incorrect' && isSelected) {
                  btnClass =
                    'bg-rose-50 border-2 border-rose-400 text-rose-700 ring-2 ring-rose-200 shake';
                }

                return (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => handleSelectStressSyllable(sIdx)}
                    disabled={stressAnswerStatus === 'correct'}
                    className={`px-4 py-2.5 rounded-2xl font-black text-base sm:text-lg transition-all cursor-pointer flex flex-col items-center gap-0.5 ${btnClass}`}
                  >
                    <span>{syl}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">
                      #{sIdx + 1}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Feedback / Stress Rule Box */}
            {stressAnswerStatus === 'correct' && (
              <div className="w-full max-w-sm p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-left animate-in zoom-in-95">
                <div className="flex items-center gap-1.5 text-emerald-800 font-black text-xs mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Correct! +10 XP</span>
                </div>
                <p className="text-[11px] text-emerald-950 leading-snug">
                  <span className="font-bold">Stress Rule: </span>
                  {currentStressItem.stressRule}
                </p>
              </div>
            )}

            {stressAnswerStatus === 'incorrect' && (
              <div className="w-full max-w-sm p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
                <span>❌ Not this syllable. Listen and try again!</span>
                <button
                  type="button"
                  onClick={() => handlePlayStressAudio(true)}
                  className="px-2 py-0.5 rounded-lg bg-white border border-rose-300 text-rose-700 text-xs font-bold cursor-pointer"
                >
                  Listen 🐢
                </button>
              </div>
            )}
          </div>

          {/* Sticky Bottom Action Bar */}
          <footer className="shrink-0 p-4 bg-white/90 backdrop-blur border-t border-slate-100 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedSyllableIdx(null);
                setStressAnswerStatus('idle');
                setStressIndex((prev) => (prev - 1 + filteredStressDrills.length) % filteredStressDrills.length);
              }}
              className="px-4 py-3 rounded-2xl border-2 border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={handleNextStressItem}
              className="btn-tactile bg-emerald-600 border-b-4 border-emerald-700 active:border-b-0 text-white font-bold py-3 w-full rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer flex-1"
            >
              <span>{stressAnswerStatus === 'correct' ? 'Next Word →' : 'Skip →'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </footer>
        </>
      )}
    </div>
  );
};
