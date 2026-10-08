'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Trophy,
  ChevronRight,
  ChevronLeft,
  Flame,
  Award,
  Info,
  Zap,
  BookOpen,
  VolumeX,
} from 'lucide-react';
import { SPEAKING_DRILLS, SpeakingDrillItem } from '@/data/speakingDrills';
import { SYLLABLE_STRESS_DRILLS, SyllableStressItem } from '@/data/syllableStressDrills';
import { sounds } from '@/lib/audio';
import { useGame } from '@/context/GameContext';

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

export const SpeakingLab: React.FC = () => {
  const { addXp } = useGame();

  // Mode: Full phrase speech recognition studio VS Syllable stress trainer
  const [labMode, setLabMode] = useState<'phrases' | 'syllables'>('phrases');

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
    setTimeLeft(10);
    setIsRecording(true);

    try {
      const rec = new Ctor();
      recognitionRef.current = rec;
      rec.lang = 'lt-LT';
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 3;

      rec.onresult = (event: SpeechRecognitionEventLike) => {
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          finalTranscript += event.results[i][0].transcript;
        }

        setTranscript(finalTranscript);

        let bestScore = 0;
        let bestWords: boolean[] = [];

        const targetPhraseList = [
          currentItem.phrase,
          ...(currentItem.acceptableVariations || []),
        ];

        targetPhraseList.forEach((target) => {
          const { score: testScore, wordStatus } = computeMatchDetails(target, finalTranscript);
          if (testScore > bestScore) {
            bestScore = testScore;
            bestWords = wordStatus;
          }
        });

        setScore(bestScore);
        setMatchedWords(bestWords);

        if (bestScore >= 70) {
          sounds.playSuccess();
          recordMastered(currentItem.id);
          stopListening();
        }
      };

      rec.onerror = () => {
        stopListening();
      };

      rec.onend = () => {
        setIsRecording(false);
        clearAllTimers();
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
    setCurrentIndex((prev) => (prev + 1) % filteredDrills.length);
  };

  const handlePrev = () => {
    stopListening();
    setTranscript('');
    setScore(null);
    setMatchedWords([]);
    setCurrentIndex((prev) => (prev - 1 + filteredDrills.length) % filteredDrills.length);
  };

  const handleRetry = () => {
    setTranscript('');
    setScore(null);
    setMatchedWords([]);
    startListening();
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
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in">
      {/* Top Section Mode Switcher Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-3xl border-2 border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setLabMode('phrases');
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
              labMode === 'phrases'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Mic className="h-4 w-4" />
            <span>Frazės & Tarimas • Voice Studio</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setLabMode('syllables');
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
              labMode === 'syllables'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Zap className="h-4 w-4 fill-current" />
            <span>Skiemenų Kirtis • Syllable Stress</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-black">
              Nauja!
            </span>
          </button>
        </div>

        {/* Mastered Counter */}
        <div className="flex items-center gap-2 self-end sm:self-auto bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-200">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-extrabold text-amber-800">
            {labMode === 'phrases'
              ? `${masteredIds.length} / ${SPEAKING_DRILLS.length} Mastered`
              : `${stressMasteredIds.length} / ${SYLLABLE_STRESS_DRILLS.length} Mastered`}
          </span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODE 1: PHRASE PRONUNCIATION & VOICE RECOGNITION STUDIO              */}
      {/* ==================================================================== */}
      {labMode === 'phrases' && (
        <div className="flex flex-col gap-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'Visi • All' },
              { id: 'greetings', label: 'Pasisveikinimai • Greetings' },
              { id: 'dining', label: 'Kavinė & Maistas • Café' },
              { id: 'navigation', label: 'Kryptys • Navigation' },
              { id: 'twisters', label: 'Liežuvio laužymai • Twisters' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setCurrentIndex(0);
                  stopListening();
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Main Pronunciation Studio Card */}
          <div className="relative w-full bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col items-center text-center">
            {/* Header Badges */}
            <div className="w-full flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[11px] font-black uppercase tracking-wider">
                  {currentItem.categoryLabel}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  #{currentIndex + 1} of {filteredDrills.length}
                </span>
              </div>

              {isMastered ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mastered (+15 XP)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
                  <span>+15 XP on passing</span>
                </div>
              )}
            </div>

            {/* Celebration Banner */}
            {showCelebration && (
              <div className="w-full mb-4 p-3 rounded-2xl bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 animate-bounce shadow-md">
                <Sparkles className="w-5 h-5" />
                <span>Puikus tarimas! +15 XP earned!</span>
              </div>
            )}

            {/* Audio Listen Buttons */}
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => handlePlayModelAudio(false)}
                disabled={isPlayingAudio !== null}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs transition-all ${
                  isPlayingAudio === 'normal'
                    ? 'bg-sky-500 text-white ring-2 ring-sky-300 animate-pulse'
                    : 'bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>Listen Normal (1.0x)</span>
              </button>

              <button
                type="button"
                onClick={() => handlePlayModelAudio(true)}
                disabled={isPlayingAudio !== null}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full font-bold text-xs transition-all ${
                  isPlayingAudio === 'slow'
                    ? 'bg-amber-500 text-white ring-2 ring-amber-300 animate-pulse'
                    : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <span>🐢</span>
                <span>Slow (0.75x)</span>
              </button>
            </div>

            {/* Large Lithuanian Target Phrase */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2">
              {currentItem.phrase}
            </h2>

            {/* Phonetic Pronunciation Guide */}
            <div className="inline-block px-3 py-1 rounded-lg bg-slate-100 text-slate-600 font-mono text-xs sm:text-sm font-bold tracking-wider mb-2">
              /{currentItem.phonetic}/
            </div>

            {/* English Translation */}
            <p className="text-base sm:text-lg font-bold text-slate-500 mb-3">
              &ldquo;{currentItem.english}&rdquo;
            </p>

            {/* STRESSED SYLLABLES BREAKDOWN (Skiemenų Kirtis) */}
            <div className="w-full max-w-lg mb-5 p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-200 text-center shadow-2xs">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-900">
                  <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                  <span>Stressed Syllables • Skiemenų Kirtis:</span>
                </div>
                {currentItem.accentedPhrase && (
                  <span className="text-[11px] font-black text-amber-950 bg-white px-2 py-0.5 rounded-full border border-amber-300">
                    Kirtis: {currentItem.accentedPhrase}
                  </span>
                )}
              </div>

              {/* Syllable Chips with Stressed Syllable Highlight */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                {syllableGroups.map((wordSyllables, wIdx) => (
                  <div
                    key={wIdx}
                    className="flex items-center gap-1 bg-white border border-amber-300 px-2.5 py-1.5 rounded-xl shadow-2xs"
                  >
                    {wordSyllables.map((syl, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => sounds.speak(syl.text)}
                        title={`Syllable: ${syl.text} ${
                          syl.isStressed ? '(Stressed syllable - tap to pronounce)' : '(Unstressed)'
                        }`}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          syl.isStressed
                            ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 ring-2 ring-amber-300 shadow-xs scale-105'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span>{syl.text}</span>
                        {syl.isStressed && <span className="ml-1 text-[10px]">⚡</span>}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              {/* Stress Placement Rule */}
              {currentItem.stressRule && (
                <div className="text-[11px] font-semibold text-amber-950 mt-2 text-left bg-white/80 p-2.5 rounded-xl border border-amber-200">
                  <span className="font-extrabold text-amber-800">💡 Stress Rule: </span>
                  {currentItem.stressRule}
                </div>
              )}
            </div>

            {/* Pronunciation Tip Box */}
            <div className="w-full max-w-lg mb-6 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left flex items-start gap-3">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                <span className="font-extrabold text-slate-900">Mouth & Tongue Tip: </span>
                {currentItem.tip}
              </p>
            </div>

            {/* Word-by-Word Matching Chips (Live Feedback) */}
            <div className="w-full max-w-lg mb-6 flex flex-wrap items-center justify-center gap-2">
              {targetWords.map((word, idx) => {
                const isMatched = matchedWords[idx];
                return (
                  <span
                    key={idx}
                    className={`px-3 py-1.5 rounded-xl text-sm font-black border transition-all ${
                      isMatched
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-xs'
                        : isRecording
                        ? 'bg-slate-100 text-slate-500 border-slate-200'
                        : transcript
                        ? 'bg-rose-50 text-rose-600 border-rose-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {isMatched ? '✓ ' : ''}
                    {word}
                  </span>
                );
              })}
            </div>

            {/* Live Audio Equalizer Waveform while recording */}
            {isRecording && (
              <div className="flex items-center gap-1.5 justify-center mb-4 h-6">
                <span className="w-1.5 h-6 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-4 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-7 bg-rose-600 rounded-full animate-bounce" />
                <span className="w-1.5 h-3 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.2s]" />
                <span className="w-1.5 h-5 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.35s]" />
              </div>
            )}

            {/* Big Glowing Microphone Button */}
            <div className="relative mb-3">
              {isRecording && (
                <span className="absolute -inset-3 rounded-full bg-rose-400 opacity-40 animate-ping" />
              )}
              <button
                type="button"
                onClick={isRecording ? stopListening : startListening}
                className={`relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full font-black shadow-xl transition-all active:scale-95 cursor-pointer ${
                  isRecording
                    ? 'bg-rose-500 text-white ring-4 ring-rose-200 shadow-rose-200'
                    : score !== null && score >= 70
                    ? 'bg-emerald-500 text-white border-b-4 border-emerald-700 shadow-emerald-200'
                    : 'bg-sky-500 hover:bg-sky-400 text-white border-b-4 border-sky-700 shadow-sky-200'
                }`}
              >
                {isRecording ? (
                  <MicOff className="w-9 h-9 animate-bounce" />
                ) : score !== null && score >= 70 ? (
                  <CheckCircle2 className="w-10 h-10" />
                ) : (
                  <Mic className="w-9 h-9" />
                )}
              </button>
            </div>

            {/* Timer countdown when recording */}
            {isRecording && (
              <div className="flex flex-col items-center gap-1 mb-3">
                <span className="text-xs font-black text-rose-600">
                  ⏱️ Klausausi... {timeLeft}s remaining
                </span>
                <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${(timeLeft / 10) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4">
              {isRecording
                ? 'Speak in Lithuanian now...'
                : score !== null && score >= 70
                ? 'Great job! Tap mic to repeat'
                : 'Tap to speak into microphone'}
            </p>

            {/* Real-Time Transcript Display */}
            {transcript && (
              <div className="w-full max-w-lg mb-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left animate-in fade-in">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    What we heard you say:
                  </span>
                  {score !== null && (
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-full ${
                        score >= 70
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {score}% Accuracy
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-slate-800">&ldquo;{transcript}&rdquo;</p>

                {score !== null && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className={score >= 70 ? 'text-emerald-700' : 'text-amber-700'}>
                        {score >= 70
                          ? '🎉 Puikiai atlikta! (Passed)'
                          : 'Geras bandymas • Try again for 70%+'}
                      </span>
                      <span className="text-slate-500">{score}% match</span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          score >= 70 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Retry Button */}
            {transcript && !isRecording && (
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-xs mb-6 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again • Kartoti</span>
              </button>
            )}

            {/* Speech Recognition Not Supported Notice */}
            {!speechSupported && (
              <div className="w-full max-w-md p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold mb-4">
                ⚠️ Live speech recognition requires Chrome, Edge, or Safari on desktop or Android.
                You can still listen to native audio models!
              </div>
            )}

            {/* Navigation Arrows */}
            <div className="w-full flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1 px-4 py-2 rounded-2xl border-2 border-slate-200 text-xs font-extrabold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="btn-3d btn-green-3d flex items-center gap-1 px-5 py-2.5 text-xs cursor-pointer"
              >
                <span>Next Phrase</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODE 2: INTERACTIVE SYLLABLE STRESS TRAINER (KIRTIS CHALLENGE)       */}
      {/* ==================================================================== */}
      {labMode === 'syllables' && (
        <div className="flex flex-col gap-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'Visi • All Words' },
              { id: 'basics', label: 'Pagrindai • Basics' },
              { id: 'food', label: 'Maistas • Food' },
              { id: 'places', label: 'Miestai & Vietos • Places' },
              { id: 'people', label: 'Žmonės • People' },
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
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  stressCategory === cat.id
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Syllable Stress Challenge Card */}
          <div className="relative w-full bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col items-center text-center">
            {/* Top Bar: Category & Streak */}
            <div className="w-full flex items-center justify-between mb-4">
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black uppercase tracking-wider">
                {currentStressItem.categoryLabel} • #{stressIndex + 1} of{' '}
                {filteredStressDrills.length}
              </span>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-black">
                <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                <span>Streak: {stressStreak}🔥</span>
              </div>
            </div>

            {/* Audio Listen Buttons */}
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => handlePlayStressAudio(false)}
                disabled={isPlayingStressAudio !== null}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs transition-all ${
                  isPlayingStressAudio === 'normal'
                    ? 'bg-sky-500 text-white ring-2 ring-sky-300 animate-pulse'
                    : 'bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>Listen Word (1.0x)</span>
              </button>

              <button
                type="button"
                onClick={() => handlePlayStressAudio(true)}
                disabled={isPlayingStressAudio !== null}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full font-bold text-xs transition-all ${
                  isPlayingStressAudio === 'slow'
                    ? 'bg-amber-500 text-white ring-2 ring-amber-300 animate-pulse'
                    : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <span>🐢 Slow (0.75x)</span>
              </button>
            </div>

            {/* Target Word */}
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-1">
              {currentStressItem.word}
            </h2>

            {/* English Meaning */}
            <p className="text-base sm:text-lg font-bold text-slate-500 mb-6">
              &ldquo;{currentStressItem.english}&rdquo;
            </p>

            {/* Challenge Question Banner */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-black uppercase tracking-wider mb-5">
              <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
              <span>Kuris skiemuo yra kirčiuotas? • Which syllable is stressed?</span>
            </div>

            {/* Interactive Clickable Syllables */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6 max-w-lg">
              {currentStressItem.syllables.map((syl, sIdx) => {
                const isSelected = selectedSyllableIdx === sIdx;
                const isTargetStressed = sIdx === currentStressItem.stressedIndex;

                let buttonStyles =
                  'bg-white border-2 border-slate-300 text-slate-800 hover:border-amber-400 hover:scale-105 shadow-xs';

                if (stressAnswerStatus === 'correct') {
                  if (isTargetStressed) {
                    buttonStyles =
                      'bg-emerald-500 border-2 border-emerald-600 text-white shadow-md ring-4 ring-emerald-200 scale-110 animate-bounce';
                  } else {
                    buttonStyles = 'bg-slate-100 border-2 border-slate-200 text-slate-400 opacity-60';
                  }
                } else if (stressAnswerStatus === 'incorrect' && isSelected) {
                  buttonStyles =
                    'bg-rose-50 border-2 border-rose-400 text-rose-700 ring-2 ring-rose-200 shake';
                }

                return (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => handleSelectStressSyllable(sIdx)}
                    disabled={stressAnswerStatus === 'correct'}
                    className={`px-5 py-3.5 rounded-2xl font-black text-lg sm:text-xl transition-all cursor-pointer flex flex-col items-center gap-0.5 ${buttonStyles}`}
                  >
                    <span>{syl}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                      #{sIdx + 1}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Feedback & Rule Explanation Box */}
            {stressAnswerStatus === 'correct' && (
              <div className="w-full max-w-lg mb-6 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-left animate-in zoom-in-95">
                <div className="flex items-center gap-2 text-emerald-800 font-black text-sm mb-1.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Teisingai! +10 XP • Correct Stressed Syllable!</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-600">Accented Lithuanian form:</span>
                  <span className="text-sm font-black text-emerald-900 bg-white px-2.5 py-0.5 rounded-md border border-emerald-200 font-mono">
                    {currentStressItem.accentedWord}
                  </span>
                  <span className="text-xs font-mono text-slate-500">/{currentStressItem.phonetic}/</span>
                </div>
                <p className="text-xs font-semibold text-emerald-950 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-emerald-200">
                  <span className="font-extrabold text-emerald-800">💡 Stress Rule: </span>
                  {currentStressItem.stressRule}
                </p>
              </div>
            )}

            {stressAnswerStatus === 'incorrect' && (
              <div className="w-full max-w-lg mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between">
                <span>❌ Ne šis skiemuo. Paklausykite garso dar kartą ir pabandykite!</span>
                <button
                  type="button"
                  onClick={() => handlePlayStressAudio(true)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-rose-300 text-rose-700 font-black hover:bg-rose-100"
                >
                  Listen 🐢
                </button>
              </div>
            )}

            {/* Next Word / Navigation */}
            <div className="w-full flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setSelectedSyllableIdx(null);
                  setStressAnswerStatus('idle');
                  setStressIndex((prev) => (prev - 1 + filteredStressDrills.length) % filteredStressDrills.length);
                }}
                className="flex items-center gap-1 px-4 py-2 rounded-2xl border-2 border-slate-200 text-xs font-extrabold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={handleNextStressItem}
                className="btn-3d btn-green-3d flex items-center gap-1 px-6 py-2.5 text-xs font-black cursor-pointer shadow-md"
              >
                <span>{stressAnswerStatus === 'correct' ? 'Next Word • Kitas →' : 'Skip • Kitas'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
