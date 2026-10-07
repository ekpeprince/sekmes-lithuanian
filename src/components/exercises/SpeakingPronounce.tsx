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

// Compute string similarity (0.0 to 1.0)
function computeSimilarity(target: string, actual: string): number {
  const normTarget = normalizeLt(target);
  const normActual = normalizeLt(actual);

  if (normTarget === normActual) return 1.0;
  if (!normTarget || !normActual) return 0.0;

  // Word set matching
  const targetWords = normTarget.split(' ');
  const actualWords = normActual.split(' ');

  let matches = 0;
  targetWords.forEach(word => {
    if (actualWords.includes(word)) {
      matches += 1;
    } else {
      // Check partial match (e.g. endings)
      const hasClose = actualWords.some(act => act.startsWith(word.slice(0, -1)) || word.startsWith(act.slice(0, -1)));
      if (hasClose) matches += 0.75;
    }
  });

  return Math.min(1.0, matches / targetWords.length);
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
  const [isPlayingModelAudio, setIsPlayingModelAudio] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [score, setScore] = useState<number | null>(null);
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

  const handlePlayModelAudio = () => {
    setIsPlayingModelAudio(true);
    sounds.speak(exercise.targetPhrase, {
      slow: false,
      onEnd: () => setIsPlayingModelAudio(false),
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

        // Evaluate similarity score
        const similarity = computeSimilarity(exercise.targetPhrase, currentTranscript);
        const currentScore = Math.round(similarity * 100);
        setScore(currentScore);

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
    setTimeLeft(10);
    onSpoken('', false);
  };

  const handleCantSpeak = () => {
    stopListening();
    setCantSpeakNow(true);
    onSpoken(exercise.targetPhrase, true);
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center text-center">
      {/* Category Tag */}
      <div className="w-full text-center sm:text-left mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-black uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Pronunciation Studio • Tarimo treniruotė
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
          {exercise.prompt}
        </h2>
        {exercise.subPrompt ? (
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
            {exercise.subPrompt}
          </p>
        ) : (
          <p className="text-sm font-medium text-slate-500 mt-1">
            Tap the microphone and speak clearly in Lithuanian.
          </p>
        )}
      </div>

      {/* Target Phrase Card */}
      <div className="w-full bg-white border-2 border-slate-200 rounded-3xl p-6 mb-6 shadow-sm flex flex-col items-center">
        {/* Listen Model Button */}
        <button
          type="button"
          onClick={handlePlayModelAudio}
          disabled={isPlayingModelAudio}
          className={`flex items-center gap-2 px-4 py-2 rounded-full bg-sky-50 text-sky-600 border border-sky-200 font-bold text-xs uppercase tracking-wider hover:bg-sky-100 transition-colors mb-4 ${
            isPlayingModelAudio ? 'animate-pulse' : ''
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span>Listen to native pronunciation</span>
        </button>

        {/* Big Target Phrase */}
        <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
          {exercise.targetPhrase}
        </div>

        {/* Phonetic Pronunciation Hint */}
        {exercise.phoneticHint && (
          <div className="text-xs font-bold text-slate-400 font-mono tracking-wider mb-2">
            /{exercise.phoneticHint}/
          </div>
        )}

        {/* Translation */}
        <div className="text-sm font-medium text-slate-500">
          “{exercise.translation}”
        </div>
      </div>

      {/* Recording Feedback & Microphone Button */}
      {!cantSpeakNow ? (
        <div className="flex flex-col items-center gap-3 my-2">
          {/* Main Glowing Mic Button */}
          <div className="relative">
            {isRecording && (
              <span className="absolute -inset-3 rounded-full bg-rose-400 opacity-40 animate-ping" />
            )}
            <button
              type="button"
              onClick={isRecording ? stopListening : startListening}
              disabled={isChecked}
              className={`relative btn-3d flex items-center justify-center w-24 h-24 rounded-full font-black shadow-lg transition-transform active:scale-95 ${
                isRecording
                  ? 'bg-rose-500 text-white ring-4 ring-rose-200'
                  : spokenText
                  ? 'bg-emerald-500 text-white border-b-4 border-emerald-700'
                  : 'bg-sky-500 hover:bg-sky-400 text-white border-b-4 border-sky-700'
              }`}
            >
              {isRecording ? (
                <MicOff className="w-10 h-10 animate-bounce" />
              ) : spokenText ? (
                <CheckCircle2 className="w-10 h-10" />
              ) : (
                <Mic className="w-10 h-10" />
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
