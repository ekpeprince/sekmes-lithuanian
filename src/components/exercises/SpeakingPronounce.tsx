'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, CheckCircle2, RotateCcw, VolumeX, Loader2 } from 'lucide-react';
import { SpeakingPronounceExercise } from '@/types/lesson';
import { sounds } from '@/lib/audio';
import { evaluateHybridPronunciation, normalizeLt } from '@/lib/speechValidation';
import { logEvent } from '@/lib/telemetry';

interface SpeakingPronounceProps {
  exercise: SpeakingPronounceExercise;
  spokenText: string | null;
  onSpoken: (text: string, isPassing: boolean) => void;
  isChecked: boolean;
  isCorrect: boolean | null;
}

export const SpeakingPronounce: React.FC<SpeakingPronounceProps> = ({
  exercise,
  spokenText,
  onSpoken,
  isChecked,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isPlayingModelAudio, setIsPlayingModelAudio] = useState<'normal' | 'slow' | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [score, setScore] = useState<number | null>(null);
  const [matchedWords, setMatchedWords] = useState<boolean[]>([]);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [cantSpeakNow, setCantSpeakNow] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [partialNotice, setPartialNotice] = useState<string | null>(null);
  const [, setMissingWordList] = useState<string[]>([]);

  // Hybrid Validation & Guardrail states
  const [glitchMessage, setGlitchMessage] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [fallbackMode, setFallbackMode] = useState<'voice' | 'tap_words' | 'text_verify'>('voice');
  const [assembledWordTiles, setAssembledWordTiles] = useState<string[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasSpokenRef = useRef<boolean>(false);
  const isRecordingRef = useRef<boolean>(false);

  // Scrambled word tiles for Guardrail 3 interactive tap order
  const scrambledWordTiles = React.useMemo(() => {
    const rawWords = exercise.targetPhrase.split(/\s+/).filter(Boolean);
    const tiles = rawWords.map((word, i) => ({ id: `${word}-${i}`, word }));
    return tiles.slice().reverse();
  }, [exercise.targetPhrase]);

  // Reset tracking when exercise changes
  useEffect(() => {
    setFailedAttempts(0);
    setGlitchMessage(null);
    setPartialNotice(null);
    setMissingWordList([]);
    setFallbackMode('voice');
    setAssembledWordTiles([]);
  }, [exercise.id]);

  useEffect(() => {
    return () => {
      // Clean up active timers, media stream, audio context, and recorder on unmount
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
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

  const handleBypassRound = () => {
    sounds.playSuccess();
    setFailedAttempts(0);
    setGlitchMessage(null);
    setPartialNotice(null);
    setMissingWordList([]);
    setFallbackMode('voice');
    setAssembledWordTiles([]);
    onSpoken(exercise.targetPhrase, true);
  };

  const clearAllTimers = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const stopListening = () => {
    isRecordingRef.current = false;
    clearAllTimers();
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
    setAudioLevel(0);
  };

  const startListening = async () => {
    if (isChecked || isRecording || isTranscribing) return;
    sounds.playClick();

    logEvent({
      eventType: 'PRONUNCIATION_CLICK',
      metadata: {
        targetPhrase: exercise.targetPhrase,
        exerciseId: exercise.id,
        context: 'lesson_exercise',
      },
    });

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setSpeechSupported(false);
      return;
    }

    setTranscript('');
    setScore(null);
    setMatchedWords([]);
    setGlitchMessage(null);
    setPartialNotice(null);
    setMissingWordList([]);
    setTimeLeft(15);
    setIsRecording(true);
    isRecordingRef.current = true;
    hasSpokenRef.current = false;
    setIsTranscribing(false);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Initialize Web Audio API Analyser for real-time waveform & pause threshold
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const monitorAudio = () => {
            if (!isRecordingRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            const level = Math.min(100, Math.round((average / 128) * 100));
            setAudioLevel(level);

            // Voice activity detection threshold
            if (average > 10) {
              hasSpokenRef.current = true;
              // Reset pause / silence timer while speech is active
              if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
              }
            } else if (hasSpokenRef.current && !silenceTimerRef.current) {
              // User has spoken words and paused: allow a generous 2.8 second pause before auto-stopping
              silenceTimerRef.current = setTimeout(() => {
                if (isRecordingRef.current) {
                  stopListening();
                }
              }, 2800);
            }

            animFrameRef.current = requestAnimationFrame(monitorAudio);
          };
          animFrameRef.current = requestAnimationFrame(monitorAudio);
        }
      } catch (audioErr) {
        console.warn('Web Audio Analyser initialization notice:', audioErr);
      }

      let mimeType = 'audio/webm;codecs=opus';
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : '';
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        isRecordingRef.current = false;
        setAudioLevel(0);
        clearAllTimers();
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          try {
            audioContextRef.current.close();
          } catch {}
          audioContextRef.current = null;
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        if (audioChunksRef.current.length === 0) return;

        setIsTranscribing(true);
        try {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mimeType || 'audio/webm',
          });
          const formData = new FormData();
          formData.append('audio', audioBlob);

          const res = await fetch('/api/stt', {
            method: 'POST',
            body: formData,
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Speech recognition failed');
          }

          const finalTranscript = data.transcript || '';
          setTranscript(finalTranscript);

          // Guardrail 1 & 2: Strict Sentence Completion & Hybrid Evaluation
          const validation = evaluateHybridPronunciation(
            exercise.targetPhrase,
            finalTranscript,
            exercise.acceptableVariations || []
          );

          // Guardrail 1: Catch repetitive speech loops
          if (validation.isGlitch) {
            setGlitchMessage(
              validation.glitchMessage ||
                "The microphone caught some interference. Let's try saying it one more time clearly!"
            );
            setPartialNotice(null);
            setScore(0);
            setMatchedWords([]);
            setFailedAttempts((prev) => prev + 1);
            onSpoken(finalTranscript, false);
            return;
          }

          setGlitchMessage(null);
          setScore(validation.similarity);
          setMatchedWords(validation.wordStatus);
          setMissingWordList(validation.missingWords || []);

          // Guardrail: Partial sentence spoken (e.g. only "Man taip pat" of full sentence)
          if (validation.isPartial) {
            setPartialNotice(
              validation.partialPrompt ||
                'Keep going! Say the full sentence to complete the exercise.'
            );
            setFailedAttempts((prev) => prev + 1);
            onSpoken(finalTranscript, false);
            return;
          }

          setPartialNotice(null);

          // Full complete phrase passing check
          if (validation.passes) {
            setFailedAttempts(0);
            onSpoken(finalTranscript, true);
            logEvent({
              eventType: 'PRONUNCIATION_SUCCESS',
              metadata: {
                targetPhrase: exercise.targetPhrase,
                exerciseId: exercise.id,
                score: validation.similarity,
                context: 'lesson_exercise',
              },
            });
          } else {
            setFailedAttempts((prev) => prev + 1);
            onSpoken(finalTranscript, false);
          }
        } catch (err) {
          console.error('Speaking validation error:', err);
          setGlitchMessage("We couldn't connect to speech recognition. Please try again or use the options below.");
          setFailedAttempts((prev) => prev + 1);
          onSpoken('', false);
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start();

      // Extended 15-second countdown timer for full sentences
      clearAllTimers();
      let remainingSeconds = 15;
      timerIntervalRef.current = setInterval(() => {
        remainingSeconds -= 1;
        if (remainingSeconds <= 0) {
          stopListening();
          setTimeLeft(0);
        } else {
          setTimeLeft(remainingSeconds);
        }
      }, 1000);
    } catch (err) {
      console.error('Mic access error:', err);
      stopListening();
      setSpeechSupported(false);
    }
  };

  const handleRetry = () => {
    sounds.playClick();
    stopListening();
    setTranscript('');
    setScore(null);
    setMatchedWords([]);
    setGlitchMessage(null);
    setPartialNotice(null);
    setMissingWordList([]);
    setTimeLeft(15);
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
      <div className="w-full text-center sm:text-left mb-2 sm:mb-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-black uppercase tracking-wider mb-1">
          <Sparkles className="w-3 h-3" />
          Pronunciation Studio
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer ${
              isPlayingModelAudio === 'normal'
                ? 'bg-sky-500 text-white ring-2 ring-sky-300 animate-pulse'
                : 'bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Normal (1.0x)</span>
          </button>

          <button
            type="button"
            onClick={() => handlePlayModelAudio(true)}
            disabled={isPlayingModelAudio !== null}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer ${
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

        {/* Phonetic Hint */}
        {exercise.phoneticHint && (
          <div className="text-xs font-mono font-bold text-slate-400 tracking-wider mb-2">
            /{exercise.phoneticHint}/
          </div>
        )}

        {/* Translation */}
        <div className="text-xs sm:text-sm font-medium text-slate-500 mb-3">
          &ldquo;{exercise.translation}&rdquo;
        </div>

        {/* Syllable Stress Guide (Streamlined single card) */}
        {exercise.syllables && (
          <div className="w-full max-w-sm bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 sm:p-3.5 text-center shadow-2xs mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1">
                <span>⚡</span>
                Syllable Stress:
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 my-1">
              {exercise.syllables.split(' ').map((wordStr, wIdx) => {
                const parts = wordStr.split('-');
                return (
                  <div key={wIdx} className="flex items-center gap-1 bg-white border border-amber-300/80 px-2.5 py-1 rounded-xl shadow-2xs">
                    {parts.map((syl, sIdx) => {
                      const isStressed = syl === syl.toUpperCase() && /[A-ZĄČĘĖĮŠŲŪŽ]/.test(syl);
                      return (
                        <React.Fragment key={sIdx}>
                          {sIdx > 0 && <span className="text-amber-400 font-bold text-xs select-none">·</span>}
                          <span
                            className={`px-1.5 py-0.5 rounded text-xs font-black ${
                              isStressed
                                ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-300'
                                : 'text-slate-600'
                            }`}
                          >
                            {syl}
                          </span>
                        </React.Fragment>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-amber-900/80 font-medium mt-1 leading-snug">
              {exercise.stressTip || 'Initial stress with falling tone on both words'}
            </p>
          </div>
        )}

        {/* Word-by-Word Matching Chips */}
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {targetWords.map((word, idx) => {
            const isMatched = matchedWords[idx];
            const isMissingAfterPartial = !isMatched && Boolean(partialNotice);
            return (
              <span
                key={idx}
                className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black border transition-all ${
                  isMatched
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-xs'
                    : isMissingAfterPartial
                    ? 'bg-amber-50 text-amber-900 border-2 border-dashed border-amber-400 animate-pulse'
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
          {/* Animated Dynamic Sound Wave Equalizer while recording */}
          {isRecording && (
            <div className="flex items-center gap-1.5 justify-center mb-1 h-6">
              <span
                className="w-1.5 rounded-full bg-rose-500 transition-all duration-75"
                style={{ height: `${Math.max(6, Math.min(24, 6 + audioLevel * 0.45))}px` }}
              />
              <span
                className="w-1.5 rounded-full bg-rose-400 transition-all duration-75"
                style={{ height: `${Math.max(8, Math.min(24, 8 + audioLevel * 0.7))}px` }}
              />
              <span
                className="w-1.5 rounded-full bg-rose-600 transition-all duration-75"
                style={{ height: `${Math.max(10, Math.min(24, 10 + audioLevel * 0.95))}px` }}
              />
              <span
                className="w-1.5 rounded-full bg-rose-400 transition-all duration-75"
                style={{ height: `${Math.max(8, Math.min(24, 8 + audioLevel * 0.65))}px` }}
              />
              <span
                className="w-1.5 rounded-full bg-rose-500 transition-all duration-75"
                style={{ height: `${Math.max(6, Math.min(24, 6 + audioLevel * 0.4))}px` }}
              />
            </div>
          )}

          {/* Active Processing Indicator while transcribing */}
          {isTranscribing && (
            <div className="flex items-center gap-1.5 justify-center mb-1 h-6">
              <span className="w-1.5 h-3.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="w-1.5 h-5 rounded-full bg-amber-600 animate-pulse [animation-delay:-0.15s]" />
              <span className="w-1.5 h-6 rounded-full bg-amber-500 animate-pulse [animation-delay:-0.3s]" />
              <span className="w-1.5 h-5 rounded-full bg-amber-600 animate-pulse [animation-delay:-0.15s]" />
              <span className="w-1.5 h-3.5 rounded-full bg-amber-500 animate-pulse" />
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
              disabled={isChecked || isTranscribing}
              className={`relative btn-tactile flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full font-black shadow-lg transition-transform active:scale-95 cursor-pointer ${
                isTranscribing
                  ? 'bg-amber-500 text-white border-b-4 border-amber-700'
                  : isRecording
                  ? 'bg-rose-500 text-white ring-4 ring-rose-200 border-b-4 border-rose-700'
                  : spokenText
                  ? 'bg-emerald-500 text-white border-b-4 border-emerald-700'
                  : 'bg-sky-500 hover:bg-sky-400 text-white border-b-4 border-sky-700'
              }`}
            >
              {isTranscribing ? (
                <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-7 h-7 sm:w-8 sm:h-8 animate-bounce" />
              ) : spokenText ? (
                <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
              ) : (
                <Mic className="w-7 h-7 sm:w-8 sm:h-8" />
              )}
            </button>
          </div>

          {/* Learner Timer Progress Indicator */}
          {isRecording && (
            <div className="flex flex-col items-center gap-1.5 animate-fadeIn">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                <span>⏱️</span>
                <span>{timeLeft}s left</span>
              </div>
              <div className="w-36 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${(timeLeft / 15) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Status Label */}
          <div className="text-sm font-bold text-slate-600 text-center">
            {isTranscribing ? (
              <span className="text-amber-600 font-extrabold flex items-center justify-center gap-1.5 animate-pulse">
                <Sparkles className="w-4 h-4 animate-spin text-amber-500" />
                Analyzing full phrase...
              </span>
            ) : isRecording ? (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-rose-600 font-extrabold animate-pulse">
                  Listening... Speak at your own pace
                </span>
                <span className="text-xs font-medium text-slate-400">
                  Natural pauses allowed • Tap mic when finished
                </span>
              </div>
            ) : partialNotice ? (
              <span className="text-amber-700 font-extrabold">Sentence incomplete • Say full phrase</span>
            ) : glitchMessage ? (
              <span className="text-amber-700 font-extrabold">Interference detected • Try again clearly</span>
            ) : spokenText ? (
              <span className="text-emerald-600 font-bold">Phrase recognized!</span>
            ) : (
              <span>Tap mic and speak clearly</span>
            )}
          </div>

          {/* Partial utterance prompt */}
          {partialNotice && !isRecording && !isTranscribing && (
            <div className="mt-2 w-full max-w-md p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn shadow-2xs text-left">
              <span className="text-lg shrink-0">⏳</span>
              <div className="flex-1">
                <span className="font-black text-amber-950 block mb-0.5">Sentence incomplete</span>
                <span className="leading-snug text-amber-900/90">{partialNotice}</span>
              </div>
            </div>
          )}

          {/* Guardrail 1: Soft retry banner on speech engine glitch */}
          {glitchMessage && (
            <div className="mt-2 w-full max-w-md p-3 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-2 animate-fadeIn shadow-2xs text-left">
              <span className="text-base shrink-0">⚠️</span>
              <span className="leading-snug">{glitchMessage}</span>
            </div>
          )}

          {/* Transcript Display */}
          {(transcript || spokenText) && (
            <div className="mt-1 px-4 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 font-bold text-sm max-w-md w-full text-center">
              <span className="text-[11px] text-slate-400 block uppercase tracking-wider mb-0.5">
                Your spoken phrase:
              </span>
              “{transcript || spokenText}”
              {score !== null && (
                <div className="mt-1.5 text-xs font-black text-sky-600">
                  Accuracy: {score}%
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
              <span>Try Again</span>
            </button>
          )}

          {/* Guardrail 3: Intelligent Fallback UI after 2 consecutive failed attempts */}
          {failedAttempts >= 2 && !spokenText && !isChecked && (
            <div className="mt-3 w-full max-w-md p-4 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 text-left shadow-xs animate-pop">
              <div className="flex items-start gap-2.5 mb-2">
                <span className="text-xl shrink-0">🎙️</span>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-amber-950">
                    Having microphone trouble?
                  </h4>
                  <p className="text-xs text-amber-900/80 leading-snug mt-0.5">
                    Browser audio input can encounter noise loops or accent friction. Use an escape hatch below so you&apos;re never blocked:
                  </p>
                </div>
              </div>

              {fallbackMode === 'tap_words' ? (
                <div className="mt-2 pt-2 border-t border-amber-200/80">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 block mb-1.5">
                    🧩 Tap words in correct order:
                  </span>

                  {/* Assembled slots */}
                  <div className="min-h-10 p-2 rounded-2xl bg-white border-2 border-amber-300 flex flex-wrap gap-1.5 mb-2">
                    {assembledWordTiles.length === 0 ? (
                      <span className="text-xs text-slate-400 italic px-1 self-center">
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
                            className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-2xs active:scale-95 cursor-pointer"
                          >
                            {tile.word}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Available word tiles */}
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
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
                              const targetWords = exercise.targetPhrase.split(/\s+/).filter(Boolean);
                              const isCorrect =
                                normalizeLt(assembledWords.join(' ')) ===
                                normalizeLt(targetWords.join(' '));
                              if (isCorrect) {
                                sounds.playSuccess();
                                setFailedAttempts(0);
                                setFallbackMode('voice');
                                onSpoken(exercise.targetPhrase, true);
                              } else {
                                sounds.playError();
                              }
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-amber-400 font-bold text-xs text-slate-800 shadow-2xs active:scale-95 cursor-pointer"
                        >
                          {tile.word}
                        </button>
                      ))}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setFallbackMode('voice');
                        setAssembledWordTiles([]);
                      }}
                      className="text-amber-800 font-bold hover:underline cursor-pointer"
                    >
                      ← Back to Mic
                    </button>
                    <button
                      type="button"
                      onClick={handleBypassRound}
                      className="text-amber-950 font-black hover:underline cursor-pointer"
                    >
                      Bypass Round →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setFallbackMode('tap_words');
                      setAssembledWordTiles([]);
                    }}
                    className="btn-tactile w-full py-2.5 px-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                  >
                    <span>🧩 Tap words to order</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleBypassRound}
                    className="w-full py-2 px-3 rounded-2xl bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 transition"
                  >
                    <span>✓ Continue via text verification</span>
                  </button>
                </div>
              )}
            </div>
          )}


          {!speechSupported && (
            <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
              Speech recognition is not supported in this browser. Listen to native audio or tap &quot;Can&apos;t speak right now&quot;.
            </div>
          )}

          {/* Can't speak right now fallback */}
          {!isChecked && (
            <button
              type="button"
              onClick={handleCantSpeak}
              className="mt-2 text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <VolumeX className="w-3.5 h-3.5" />
              Can&apos;t speak right now
            </button>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold flex items-center gap-2">
          <span>Silent mode: read aloud in your head and tap &quot;CHECK&quot;.</span>
        </div>
      )}
    </div>
  );
};
