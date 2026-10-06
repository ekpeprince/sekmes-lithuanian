// Web Audio API Synthesizer & Speech Synthesis for Lithuanian pronunciation

class SoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  // Play crisp, cheerful success arpeggio (C5 -> E5 -> G5 -> C6)
  public playSuccess() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const startTime = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime + idx * 0.08);

        gain.gain.setValueAtTime(0.001, startTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.25, startTime + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime + idx * 0.08);
        osc.stop(startTime + idx * 0.08 + 0.28);
      });
    } catch {
      // AudioContext could be prevented by autoplay policy
    }
  }

  // Play soft, gentle error thud (F3 -> C3)
  public playError() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const startTime = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(174.61, startTime); // F3
      osc.frequency.exponentialRampToValueAtTime(130.81, startTime + 0.25); // C3

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.32);
    } catch {
      // Ignore audio error
    }
  }

  // UI button pop/click sound
  public playClick() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch {
      // Ignore
    }
  }

  // Level complete fanfare
  public playLevelComplete() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      // Happy fanfare chords
      const melody = [
        { freq: 523.25, time: 0.00, dur: 0.15 }, // C5
        { freq: 659.25, time: 0.14, dur: 0.15 }, // E5
        { freq: 783.99, time: 0.28, dur: 0.18 }, // G5
        { freq: 1046.50, time: 0.44, dur: 0.45 }, // C6
      ];

      const base = ctx.currentTime;
      melody.forEach(item => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(item.freq, base + item.time);

        gain.gain.setValueAtTime(0.001, base + item.time);
        gain.gain.exponentialRampToValueAtTime(0.3, base + item.time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, base + item.time + item.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(base + item.time);
        osc.stop(base + item.time + item.dur + 0.02);
      });
    } catch {
      // Ignore
    }
  }

  private currentAudio: HTMLAudioElement | null = null;
  private voiceGender: 'female' | 'male' = 'female';

  public setVoiceGender(gender: 'female' | 'male') {
    this.voiceGender = gender;
  }

  public getVoiceGender(): 'female' | 'male' {
    return this.voiceGender;
  }

  // Pronounce Lithuanian text with authentic native Lithuanian neural audio
  public speak(
    text: string,
    optionsOrOnEnd?: { slow?: boolean; onEnd?: () => void } | (() => void)
  ) {
    if (typeof window === 'undefined') return;
    const cleanText = text.replace(/[_]/g, '').trim();

    let slow = false;
    let onEnd: (() => void) | undefined;

    if (typeof optionsOrOnEnd === 'function') {
      onEnd = optionsOrOnEnd;
    } else if (optionsOrOnEnd && typeof optionsOrOnEnd === 'object') {
      slow = !!optionsOrOnEnd.slow;
      onEnd = optionsOrOnEnd.onEnd;
    }

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    // Stop any previous speech playback
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }

    try {
      const speed = slow ? 'slow' : 'normal';
      const audioUrl = `/api/tts?text=${encodeURIComponent(cleanText)}&gender=${this.voiceGender}&speed=${speed}&v=natural-v3`;
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      audio.onended = () => {
        this.currentAudio = null;
        if (onEnd) onEnd();
      };

      audio.onerror = () => {
        this.currentAudio = null;
        this.fallbackSpeak(cleanText, onEnd, slow);
      };

      audio.play().catch(() => {
        this.fallbackSpeak(cleanText, onEnd, slow);
      });
    } catch {
      this.fallbackSpeak(cleanText, onEnd, slow);
    }
  }

  // Browser SpeechSynthesis fallback in case network is disconnected
  private fallbackSpeak(cleanText: string, onEnd?: () => void, slow: boolean = false) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'lt-LT';
      utterance.rate = slow ? 0.7 : 0.9;
      const voices = window.speechSynthesis.getVoices();
      const ltVoice = voices.find(v => v.lang.startsWith('lt') || v.lang.includes('LT'));
      if (ltVoice) utterance.voice = ltVoice;
      utterance.onend = () => { if (onEnd) onEnd(); };
      utterance.onerror = () => { if (onEnd) onEnd(); };
      window.speechSynthesis.speak(utterance);
    } catch {
      if (onEnd) onEnd();
    }
  }
}

export const sounds = new SoundManager();
