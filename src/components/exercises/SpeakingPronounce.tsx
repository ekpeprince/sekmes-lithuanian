'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, CheckCircle2, RotateCcw, VolumeX } from 'lucide-react';
import { SpeakingPronounceExercise } from '@/types/lesson';
import { sounds } from '@/lib/audio';

interface SpeakingPronounceProps {
  exercise: SpeakingPronounceExercise;
  spokenText: string | null;
  onSpoken: (text: string, isPassing: boolean) => void;
  isChecked: boolean;
  isCorrect: boolean | null;
}

// Clean text for phonetics comparison
function normalizeLt(str: string): string {
  return str
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Compute word matching details
function computeWordMatch(target: string, actual: string) {
  const normTarget = normalizeLt(target);
  const normActual = normalizeLt(actual);

  if (!normTarget || !normActual) {
    return { similarity: 0, wordStatus: [] as boolean[] };
  }

  const targetWords = normTarget.split(' ');
  const actualWords = normActual.split(' ');

  let matches = 0;
  const wordStatus = targetWords.map((word) => {
    if (actualWords.includes(word)) {
      matches += 1;
      return true;
    }
    const hasClose = actualWords.some(
      (act) => act.startsWith(word.slice(0, -1)) || word.startsWith(act.slice(0, -1))
    );
    if (hasClose) {
      matches += 0.75;
      return true;
    }
    return false;
  });

  return {
    similarity: Math.min(1.0, matches / targetWords.length),
    wordStatus,
  };
}

function computeSimilarity(target: string, actual: string): number {
  return computeWordMatch(target, actual).similarity;
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

export const SpeakingPronounce: React.FC<SpeakingPronounceProps> = ({
  exercise,
  spokenText,
  onSpoken,
  isChecked,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingModelAudio, setIsPlayingModelAudio] = useState<'normal' | 'slow' | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [score, setScore] = useState<number | null>(null);
  const [matchedWords, setMatchedWords] = useState<boolean[]>([]);
  const [speechSupported, setSpeechSupported] = useState<boolean>(() => Boolean(getSpeechRecognitionClass()));
  const [cantSpeakNow, setCantSpeakNow] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(10);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      // Clean up any active timers and speech recognition on unmount
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const handlePlayModelAudio = (slow: boolean = false) => {
    setIsPlayingModelAudio(slow ? 'slow' : 'normal');
    sounds.speak(exercise.targetPhrase, {
      slow,
      onEnd: () => setIsPlayingModelAudio(null),
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
    if (isChecked || isRecording) return;
    sounds.playClick();

    const SpeechRecognition = getSpeechRecognitionClass();

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'lt-LT';
      // Continuous mode gives learners generous time without cutting off on pauses
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;
      recognitionRef.current = recognition;

      setIsRecording(true);
      setTranscript('');
      setScore(null);
      setTimeLeft(10);

      // 10-second comfortable countdown timer for learner breathing room
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

        // Evaluate similarity score and word-level matches
        const { similarity, wordStatus } = computeWordMatch(exercise.targetPhrase, currentTranscript);
        const currentScore = Math.round(similarity * 100);
        setScore(currentScore);
        setMatchedWords(wordStatus);

        // If >= 70% match or variation matches, register passing
        const passes = similarity >= 0.7 || (exercise.acceptableVariations || []).some(
          v => computeSimilarity(v, currentTranscript) >= 0.7
        );

        onSpoken(currentTranscript, passes);

        // Reset silence debounce: if learner pauses after speaking, give 3.5s before gently completing
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          stopListening();
        }, passes ? 1800 : 3500);
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

  const handleRetry = () => {
    sounds.playClick();
    stopListening();
    setTranscript('');
    setScore(null);
    setMatchedWords([]);
    setTimeLeft(10);
    onSpoken('', false);
  };

  const handleCantSpeak = () => {
    stopListening();
    setCantSpeakNow(true);
    onSpoken(exercise.targetPhrase, true);
  };

  const targetWords = exercise.targetPhrase.split(/\s+/);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center text-center">
      {/* Category Tag */}
      <div className="w-full text-center sm:text-left mb-2.5 sm:mb-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-black uppercase tracking-wider mb-1.5">
          <Sparkles className="w-3 h-3" />
          Pronunciation Studio • Tarimo treniruotė
        </div>
        <h2 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight">
          {exercise.prompt}
        </h2>
        {exercise.subPrompt ? (
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
            {exercise.subPrompt}
          </p>
        ) : (
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
            Tap the microphone and speak clearly in Lithuanian.
          </p>
        )}
      </div>

      {/* Target Phrase Card */}
      <div className="w-full bg-white border-2 border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 mb-2.5 sm:mb-4 shadow-sm flex flex-col items-center">
        {/* Listen Model Buttons (Normal & Slow) */}
        <div className="flex items-center gap-2 mb-2.5">
          <button
            type="button"
            onClick={() => handlePlayModelAudio(false)}
            disabled={isPlayingModelAudio !== null}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-[11px] uppercase tracking-wider transition-colors ${
              isPlayingModelAudio === 'normal'
                ? 'bg-sky-500 text-white ring-2 ring-sky-300 animate-pulse'
                : 'bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Listen (1.0x)</span>
          </button>

          <button
            type="button"
            onClick={() => handlePlayModelAudio(true)}
            disabled={isPlayingModelAudio !== null}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-[11px] uppercase tracking-wider transition-colors ${
              isPlayingModelAudio === 'slow'
                ? 'bg-amber-500 text-white ring-2 ring-amber-300 animate-pulse'
                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span>🐢 Slow (0.75x)</span>
          </button>
        </div>

        {/* Big Target Phrase */}
        <div className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-1">
          {exercise.targetPhrase}
        </div>

        {/* Syllable Stress Guide & Phonetics */}
        {(exercise.syllables || exercise.phoneticHint) && (
          <div className="flex flex-col items-center justify-center gap-1.5 my-2">
            {exercise.syllables ? (
              <div className="flex flex-wrap items-center justify-center gap-1.5 bg-amber-50/90 border border-amber-300 px-3 py-1.5 rounded-xl shadow-2xs">
                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider mr-1">
                  ⚡ Kirtis (Stress):
                </span>
                {exercise.syllables.split(' ').map((wordStr, wIdx) => (
                  <div key={wIdx} className="flex items-center gap-0.5 bg-white border border-amber-200 px-2 py-0.5 rounded-lg">
                    {wordStr.split('-').map((syl, sIdx) => {
                      const isStressed = syl === syl.toUpperCase() && /[A-ZĄČĘĖĮŠŲŪŽ]/.test(syl);
                      return (
                        <span
                          key={sIdx}
                          className={`px-1.5 py-0.5 rounded text-[11px] font-black ${
                            isStressed
                              ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-300'
                              : 'text-slate-600'
                          }`}
                        >
                          {syl}
                          {isStressed && '⚡'}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : exercise.phoneticHint ? (
              <div className="text-xs font-bold text-slate-500 font-mono tracking-wider bg-slate-100 px-3 py-1 rounded-lg">
                /{exercise.phoneticHint}/
              </div>
            ) : null}

            {exercise.stressTip && (
              <div className="text-[11px] font-semibold text-amber-900 bg-amber-50/70 border border-amber-200 px-3 py-1 rounded-xl max-w-md text-center">
                💡 {exercise.stressTip}
              </div>
            )}
          </div>
        )}

        {/* Translation */}
        <div className="text-xs sm:text-sm font-medium text-slate-500 mb-3">
          &ldquo;{exercise.translation}&rdquo;
        </div>

        {/* Word-by-Word Matching Chips */}
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {targetWords.map((word, idx) => {
            const isMatched = matchedWords[idx];
            return (
              <span
                key={idx}
                className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black border transition-all ${
                  isMatched
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-xs'
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
      </div>

      {/* Recording Feedback & Microphone Button */}
      {!cantSpeakNow ? (
        <div className="flex flex-col items-center gap-2 my-1">
          {/* Animated Sound Wave Equalizer while recording */}
          {isRecording && (
            <div className="flex items-center gap-1.5 justify-center mb-1 h-5">
              <span className="w-1.5 h-5 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-3 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-6 bg-rose-600 rounded-full animate-bounce" />
              <span className="w-1.5 h-2.5 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.2s]" />
              <span className="w-1.5 h-4 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.35s]" />
            </div>
          )}

          {/* Main Glowing Mic Button */}
          <div className="relative">
            {isRecording && (
              <span className="absolute -inset-2.5 rounded-full bg-rose-400 opacity-40 animate-ping" />
            )}
            <button
              type="button"
              onClick={isRecording ? stopListening : startListening}
              disabled={isChecked}
              className={`relative btn-3d flex items-center justify-center w-16 h-16 sm:w-22 sm:h-22 rounded-full font-black shadow-lg transition-transform active:scale-95 ${
                isRecording
                  ? 'bg-rose-500 text-white ring-4 ring-rose-200'
                  : spokenText
                  ? 'bg-emerald-500 text-white border-b-4 border-emerald-700'
                  : 'bg-sky-500 hover:bg-sky-400 text-white border-b-4 border-sky-700'
              }`}
            >
              {isRecording ? (
                <MicOff className="w-7 h-7 sm:w-9 sm:h-9 animate-bounce" />
              ) : spokenText ? (
                <CheckCircle2 className="w-7 h-7 sm:w-9 sm:h-9" />
              ) : (
                <Mic className="w-7 h-7 sm:w-9 sm:h-9" />
              )}
            </button>
          </div>

          {/* Learner Timer Progress Indicator */}
          {isRecording && (
            <div className="flex flex-col items-center gap-1.5 animate-fadeIn">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                <span>⏱️</span>
                <span>Liko: {timeLeft}s • {timeLeft}s left</span>
              </div>
              <div className="w-36 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${(timeLeft / 10) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Status Label */}
          <div className="text-sm font-black text-slate-600 text-center">
            {isRecording ? (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-rose-600 font-extrabold animate-pulse">
                  Klausausi... Sakykite ramiai savo tempu!
                </span>
                <span className="text-xs font-medium text-slate-400">
                  Listening... Tap mic when finished
                </span>
              </div>
            ) : spokenText ? (
              <span className="text-emerald-600">Frazė atpažinta! • Speech recognized!</span>
            ) : (
              <span>Spauskite mikrofoną ir kalbėkite • Tap mic and speak</span>
            )}
          </div>

          {/* Transcript Display */}
          {(transcript || spokenText) && (
            <div className="mt-1 px-5 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 font-bold text-base max-w-md w-full text-center">
              <span className="text-xs text-slate-400 block uppercase tracking-wider mb-1">
                Jūsų ištarta frazė • Your spoken phrase:
              </span>
              “{transcript || spokenText}”
              {score !== null && (
                <div className="mt-2 text-xs font-black text-sky-600">
                  Tarimo tikslumas • Accuracy: {score}%
                </div>
              )}
            </div>
          )}

          {/* Quick Retry Button */}
          {!isChecked && !isRecording && (transcript || spokenText) && (
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-300 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Bandykite dar kartą • Try Again</span>
            </button>
          )}

          {!speechSupported && (
            <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
              Balso atpažinimas šioje naršyklėje nepalaikomas • Speech recognition not supported here. Listen to native audio or tap &quot;Can&apos;t speak now&quot;.
            </div>
          )}

          {/* Can't speak right now fallback */}
          {!isChecked && (
            <button
              type="button"
              onClick={handleCantSpeak}
              className="mt-3 text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <VolumeX className="w-3.5 h-3.5" />
              Negaliu dabar kalbėti • Can&apos;t speak now
            </button>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold flex items-center gap-2">
          <span>Tylos režimas • Silent mode: read aloud in your head and tap &quot;CHECK&quot;.</span>
        </div>
      )}
    </div>
  );
};
