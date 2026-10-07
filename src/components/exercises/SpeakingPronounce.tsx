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

export const SpeakingPronounce: React.FC<SpeakingPronounceProps> = ({
  exercise,
  spokenText,
  onSpoken,
  isChecked,
  isCorrect,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingModelAudio, setIsPlayingModelAudio] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [score, setScore] = useState<number | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [cantSpeakNow, setCantSpeakNow] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  const handlePlayModelAudio = () => {
    setIsPlayingModelAudio(true);
    sounds.speak(exercise.targetPhrase, {
      slow: false,
      onEnd: () => setIsPlayingModelAudio(false),
    });
  };

  const startListening = () => {
    if (isChecked || isRecording) return;
    sounds.playClick();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Graceful fallback simulation if browser lacks API
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'lt-LT';
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;
      recognitionRef.current = recognition;

      setIsRecording(true);
      setTranscript('');

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        // Evaluate passing score
        const similarity = computeSimilarity(exercise.targetPhrase, currentTranscript);
        setScore(Math.round(similarity * 100));

        // If >= 70% match or variation matches, register passing
        const passes = similarity >= 0.7 || (exercise.acceptableVariations || []).some(
          v => computeSimilarity(v, currentTranscript) >= 0.7
        );

        onSpoken(currentTranscript, passes);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleCantSpeak = () => {
    setCantSpeakNow(true);
    // Mark as auto-passed with practice notice
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
        <div className="flex flex-col items-center gap-4 my-2">
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

          {/* Status Label */}
          <div className="text-sm font-black text-slate-600">
            {isRecording ? (
              <span className="text-rose-600 animate-pulse">Klausausi... Sakykite dabar!</span>
            ) : spokenText ? (
              <span className="text-emerald-600">Frazė atpažinta!</span>
            ) : (
              <span>Spauskite mikrofoną ir kalbėkite</span>
            )}
          </div>

          {/* Transcript Display */}
          {(transcript || spokenText) && (
            <div className="mt-2 px-5 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 font-bold text-base max-w-md">
              <span className="text-xs text-slate-400 block uppercase tracking-wider mb-1">
                Jūsų ištarta frazė:
              </span>
              “{transcript || spokenText}”
              {score !== null && (
                <div className="mt-2 text-xs font-black text-sky-600">
                  Tarimo tikslumas: {score}%
                </div>
              )}
            </div>
          )}

          {/* Can't speak right now fallback */}
          {!isChecked && (
            <button
              type="button"
              onClick={handleCantSpeak}
              className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors"
            >
              <VolumeX className="w-3.5 h-3.5" />
              Negaliu dabar kalbėti (Rehearse later)
            </button>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold flex items-center gap-2">
          <span>Tylos režimas: perskaitykite garsiai mintyse ir paspauskite „Tikrinti“.</span>
        </div>
      )}
    </div>
  );
};
