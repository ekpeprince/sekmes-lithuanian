'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  VolumeX,
  Trophy,
  ChevronRight,
  ChevronLeft,
  Flame,
  Award,
  Info,
  HelpCircle,
} from 'lucide-react';
import { SPEAKING_DRILLS, SpeakingDrillItem } from '@/data/speakingDrills';
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

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Audio & Speech states
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
      // Award XP
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
    if (isRecording) return;
    sounds.playClick();

    const SpeechRecognition = getSpeechRecognitionClass();
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'lt-LT';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;
      recognitionRef.current = recognition;

      setIsRecording(true);
      setTranscript('');
      setScore(null);
      setMatchedWords([]);
      setTimeLeft(10);

      clearAllTimers();
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopListening();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        // Compute match details
        const details = computeMatchDetails(currentItem.phrase, currentTranscript);
        setScore(details.score);
        setMatchedWords(details.wordStatus);

        const isVariationPass = (currentItem.acceptableVariations || []).some((v) => {
          const varDetails = computeMatchDetails(v, currentTranscript);
          return varDetails.score >= 70;
        });

        const isPass = details.score >= 70 || isVariationPass;

        if (isPass) {
          sounds.playSuccess();
          recordMastered(currentItem.id);
        }

        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(
          () => {
            stopListening();
          },
          isPass ? 1600 : 3500
        );
      };

      recognition.onerror = () => {
        stopListening();
      };

      recognition.onend = () => {
        clearAllTimers();
        setIsRecording(false);
      };

      recognition.start();
    } catch {
      stopListening();
    }
  };

  const handleNext = () => {
    sounds.playClick();
    stopListening();
    setTranscript('');
    setScore(null);
    setMatchedWords([]);
    setCurrentIndex((prev) => (prev + 1) % filteredDrills.length);
  };

  const handlePrev = () => {
    sounds.playClick();
    stopListening();
    setTranscript('');
    setScore(null);
    setMatchedWords([]);
    setCurrentIndex((prev) => (prev - 1 + filteredDrills.length) % filteredDrills.length);
  };

  const handleRetry = () => {
    sounds.playClick();
    stopListening();
    setTranscript('');
    setScore(null);
    setMatchedWords([]);
    setTimeLeft(10);
  };

  const targetWords = currentItem.phrase.split(/\s+/);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Category Pills & Progress Counter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border-2 border-slate-200 shadow-xs">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: '🌟 All Phrases' },
            { id: 'greetings', label: '👋 Greetings' },
            { id: 'dining', label: '☕ Café & Food' },
            { id: 'navigation', label: '🧭 City & Directions' },
            { id: 'twisters', label: '🇱🇹 Tongue Twisters' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                sounds.playClick();
                setSelectedCategory(cat.id);
                setCurrentIndex(0);
                setTranscript('');
                setScore(null);
                setMatchedWords([]);
                stopListening();
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Mastered Counter */}
        <div className="flex items-center gap-2 self-end sm:self-auto bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-200">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-extrabold text-amber-800">
            {masteredIds.length} / {SPEAKING_DRILLS.length} Mastered
          </span>
        </div>
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
        <p className="text-base sm:text-lg font-bold text-slate-500 mb-4">
          &ldquo;{currentItem.english}&rdquo;
        </p>

        {/* Pronunciation Tip Box */}
        <div className="w-full max-w-lg mb-6 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-left flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-amber-900 leading-relaxed">
            <span className="font-extrabold">Pronunciation Tip: </span>
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

        {/* Prompt label */}
        <p className="text-xs sm:text-sm font-extrabold text-slate-500 mb-4">
          {isRecording
            ? 'Speak clearly into your microphone in Lithuanian...'
            : score !== null && score >= 70
            ? '🎉 Great job! You nailed the pronunciation!'
            : 'Tap the microphone to speak this phrase'}
        </p>

        {/* Spoken Transcript & Score Meter */}
        {transcript && (
          <div className="w-full max-w-md p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-4 text-center">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1">
              What we heard:
            </span>
            <p className="text-base font-extrabold text-slate-800 italic">
              &ldquo;{transcript}&rdquo;
            </p>

            {score !== null && (
              <div className="mt-3 flex flex-col items-center gap-1.5">
                <div className="flex items-center justify-between w-full text-xs font-black">
                  <span className={score >= 70 ? 'text-emerald-600' : 'text-amber-600'}>
                    {score >= 90
                      ? 'Tobulai! • Perfect (100%)'
                      : score >= 70
                      ? 'Puikiai! • Excellent pass'
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
            ⚠️ Live speech recognition requires Chrome, Edge, or Safari on desktop or Android. You
            can still listen to native audio models!
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
  );
};
