'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Send,
  RotateCcw,
  Coffee,
  ShoppingBag,
  Compass,
  MessageCircle,
  HelpCircle,
  Zap,
  Sliders,
  Settings,
  X,
  Brain,
  Trash2,
  User,
  Check,
  Flame,
  Info,
} from 'lucide-react';
import { sounds } from '@/lib/audio';
import { useGame } from '@/context/GameContext';
import {
  getTutorMemory,
  saveTutorMemory,
  recordNewSession,
  addLearnerFact,
  setLearnerName,
  formatTutorMemoryPrompt,
  clearTutorMemory,
  TutorMemory,
} from '@/lib/tutorMemory';

type ScenarioType = 'cafe' | 'market' | 'directions' | 'free' | 'custom';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  textLt: string;
  textEn?: string;
  tip?: string;
  timestamp: string;
}

interface Suggestion {
  lt: string;
  en: string;
}

let tutorMsgCounter = 0;
function createMessageId(prefix: string): string {
  tutorMsgCounter += 1;
  return `${prefix}-${tutorMsgCounter}`;
}

function getCurrentTimestamp(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: unknown) => void) | null;
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

const PRESET_CUSTOM_TOPICS = [
  {
    topic: 'Buto nuoma Vilniuje (Apartment Rental)',
    role: 'Nuomotojas (Landlord)',
    icon: '🏠',
    description: 'Ask about monthly rent, utility bills (komunalka), pets, and arrange a viewing.',
  },
  {
    topic: 'Pas gydytoją (Doctor Visit)',
    role: 'Gydytojas (Doctor)',
    icon: '🏥',
    description: 'Explain symptoms (headache, fever, sore throat) and ask for advice or medicine.',
  },
  {
    topic: 'Darbo pokalbis (Job Interview)',
    role: 'Darbdavys / Vadovas (Interviewer / Manager)',
    icon: '💼',
    description: 'Introduce your career background, skills, and discuss working in Lithuania.',
  },
  {
    topic: 'Vilniaus oro uoste (Vilnius Airport)',
    role: 'Registracijos darbuotojas (Airport Agent)',
    icon: '✈️',
    description: 'Check in baggage, ask for boarding gate numbers, and show your passport.',
  },
  {
    topic: 'Viešbutyje (Hotel Check-in)',
    role: 'Viešbučio administratorius (Hotel Receptionist)',
    icon: '🏨',
    description: 'Check in with booking reservation, ask about breakfast times and Wi-Fi password.',
  },
  {
    topic: 'Trakų pilyje (Visiting Trakai Island Castle)',
    role: 'Ekskursijų gidas (Tour Guide)',
    icon: '🏰',
    description: 'Buy entrance tickets, ask about historical legends, and try traditional kibinai.',
  },
];

const SCENARIOS = [
  {
    id: 'cafe' as ScenarioType,
    title: 'Kavinėje',
    subtitle: 'Vilnius Old Town Café',
    icon: Coffee,
    color: 'from-amber-500 to-orange-600',
    greeting: 'Laba diena! Sveiki atvykę į mūsų senamiesčio kavinę. Ką šiandien norėtumėte užsisakyti?',
    greetingEn: 'Good day! Welcome to our Old Town café. What would you like to order today?',
    tip: '„Norėčiau...“ (I would like...) is the polite way to order coffee or pastries.',
    initialSuggestions: [
      { lt: 'Norėčiau juodos kavos ir šakočio, prašom.', en: 'I would like black coffee and šakotis, please.' },
      { lt: 'Kavos su pienu ir vandens, prašau.', en: 'Coffee with milk and water, please.' },
      { lt: 'Kiek kainuoja kapučinas?', en: 'How much does a cappuccino cost?' },
    ],
  },
  {
    id: 'market' as ScenarioType,
    title: 'Halės Turgus',
    subtitle: 'Historic Market Hall',
    icon: ShoppingBag,
    color: 'from-emerald-500 to-teal-600',
    greeting: 'Laba diena! Žiūrėkite, kokios šviežios braškės ir kaimiškas varškės sūris! Kuo galiu padėti?',
    greetingEn: 'Good day! Look at these fresh strawberries and farmer cheese! How can I help you?',
    tip: 'Ask prices with „Kiek kainuoja...?“ (How much does ... cost?).',
    initialSuggestions: [
      { lt: 'Kiek kainuoja braškės?', en: 'How much do strawberries cost?' },
      { lt: 'Norėčiau vieno kilogramo šilauogių.', en: 'I would like one kilogram of blueberries.' },
      { lt: 'Ar galima paragauti šio sūrio?', en: 'May I taste this cheese?' },
    ],
  },
  {
    id: 'directions' as ScenarioType,
    title: 'Klausiant kelio',
    subtitle: 'Vilnius City Center',
    icon: Compass,
    color: 'from-blue-500 to-indigo-600',
    greeting: 'Laba diena! Ar jūs pasiklydote? Kur norite nueiti Vilniuje?',
    greetingEn: 'Good day! Are you lost? Where do you want to go in Vilnius?',
    tip: 'Directions: „tiesiai“ (straight), „į kairę“ (left), „į dešinę“ (right).',
    initialSuggestions: [
      { lt: 'Atsiprašau, kur yra Katedros aikštė?', en: 'Excuse me, where is Cathedral Square?' },
      { lt: 'Kaip nueiti iki Gedimino pilies?', en: 'How do I walk to Gediminas Castle?' },
      { lt: 'Ar čia toli nuo geležinkelio stoties?', en: 'Is it far from the railway station?' },
    ],
  },
  {
    id: 'free' as ScenarioType,
    title: 'Draugiškas pokalbis',
    subtitle: 'Conversational Tutor',
    icon: MessageCircle,
    color: 'from-purple-500 to-pink-600',
    greeting: 'Labas! Labai džiaugiuosi tave matydama. Kaip šiandien sekasi mokytis lietuvių kalbos?',
    greetingEn: 'Hello! Very glad to see you. How is learning Lithuanian going today?',
    tip: 'Reply with „Puikiai!“ (Great!), „Gerai“ (Good), or „Šiaip sau“ (So-so).',
    initialSuggestions: [
      { lt: 'Labas! Sekasi labai gerai, ačiū!', en: 'Hello! Going very well, thank you!' },
      { lt: 'Lietuvių kalba labai graži, bet nelengva!', en: 'Lithuanian is very beautiful, but not easy!' },
      { lt: 'Aš esu studentas ir gyvenu Vilniuje.', en: 'I am a student and I live in Vilnius.' },
    ],
  },
  {
    id: 'custom' as ScenarioType,
    title: 'Tinkinta tema',
    subtitle: 'Custom Roleplay & Scenarios',
    icon: Sliders,
    color: 'from-rose-500 to-red-600',
    greeting: 'Sveiki! Aš esu pasiruošusi kalbėtis bet kokia jūsų pasirinkta tema. Apie ką norėtumėte pasikalbėti?',
    greetingEn: 'Hello! I am ready to talk on any topic of your choice. What would you like to discuss?',
    tip: 'You can customize the situation, topic, and AI roleplay partner anytime!',
    initialSuggestions: [
      { lt: 'Norėčiau išsinuomoti butą Vilniuje.', en: 'I would like to rent an apartment in Vilnius.' },
      { lt: 'Noriu pasikalbėti apie apsilankymą pas gydytoją.', en: 'I want to talk about visiting a doctor.' },
      { lt: 'Praktikuokime darbo pokalbį lietuviškai.', en: 'Let us practice a job interview in Lithuanian.' },
    ],
  },
];

export default function TutorPage() {
  const { addXp } = useGame();
  const [scenario, setScenario] = useState<ScenarioType>('cafe');
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'init-1',
      role: 'assistant',
      textLt: SCENARIOS[0].greeting,
      textEn: SCENARIOS[0].greetingEn,
      tip: SCENARIOS[0].tip,
      timestamp: '12:00',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(() => SCENARIOS[0].initialSuggestions);
  const [showEnglishMap, setShowEnglishMap] = useState<Record<string, boolean>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null);

  // Auto-speak voice mode
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isSlowSpeed, setIsSlowSpeed] = useState(false);

  // Long-term tutor memory
  const [memory, setMemory] = useState<TutorMemory>(() => getTutorMemory());
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [editingLearnerName, setEditingLearnerName] = useState('');
  const [learnedFactToast, setLearnedFactToast] = useState<string | null>(null);

  // Custom scenario settings
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customTopic, setCustomTopic] = useState('Buto nuoma Vilniuje (Apartment Rental)');
  const [customRole, setCustomRole] = useState('Nuomotojas (Landlord)');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const currentScenario = SCENARIOS.find((s) => s.id === scenario) || SCENARIOS[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Record session in tutor memory on mount
  useEffect(() => {
    const updated = recordNewSession(currentScenario.title);
    setMemory(updated);
    setEditingLearnerName(updated.learnerName || '');
  }, []);

  // Clear toast after 4s
  useEffect(() => {
    if (!learnedFactToast) return;
    const timer = setTimeout(() => {
      setLearnedFactToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [learnedFactToast]);

  // Audio Playout
  const handlePlayAudio = (msgId: string, text: string, slowOverride?: boolean) => {
    try {
      setAudioPlayingId(msgId);
      const slow = slowOverride !== undefined ? slowOverride : isSlowSpeed;
      sounds.speak(text, {
        slow,
        onEnd: () => {
          setAudioPlayingId(null);
        },
      });
    } catch (err) {
      console.warn('Audio play error:', err);
      setAudioPlayingId(null);
    }
  };

  // Toggle English translation visibility
  const toggleEnglish = (id: string) => {
    setShowEnglishMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Initialize custom scenario via API with long-term memory
  const initCustomScenario = async (topic: string, role: string) => {
    setLoading(true);
    setShowEnglishMap({});
    try {
      const memoryPrompt = formatTutorMemoryPrompt(getTutorMemory());
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: 'custom',
          customTopic: topic,
          customRole: role,
          isInitial: true,
          learnerMemory: memoryPrompt,
        }),
      });

      const data = await res.json();
      const assistantMsg: Message = {
        id: createMessageId('init-custom'),
        role: 'assistant',
        textLt: data.replyLithuanian,
        textEn: data.replyEnglish,
        tip: data.grammarTip,
        timestamp: getCurrentTimestamp(),
      };

      setMessages([assistantMsg]);
      if (data.suggestedReplies && data.suggestedReplies.length > 0) {
        setSuggestions(data.suggestedReplies);
      }

      if (autoSpeak) {
        handlePlayAudio(assistantMsg.id, assistantMsg.textLt);
      }
    } catch (err) {
      console.error('Error starting custom scenario:', err);
      const fallbackMsg: Message = {
        id: createMessageId('init-custom-fallback'),
        role: 'assistant',
        textLt: `Laba diena! Esu pasiruošusi kalbėtis tema: ${topic}. Kuo galiu jums padėti?`,
        textEn: `Good day! I am ready to converse about: ${topic}. How can I help you?`,
        tip: '„Kuo galiu padėti?“ means "How can I help you?".',
        timestamp: getCurrentTimestamp(),
      };
      setMessages([fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Apply custom setup from modal
  const handleApplyCustomScenario = (topic: string, role: string) => {
    setCustomTopic(topic);
    setCustomRole(role);
    setIsCustomModalOpen(false);
    setScenario('custom');
    initCustomScenario(topic, role);
  };

  // Select a scenario
  const handleSelectScenario = (scId: ScenarioType) => {
    if (scId === 'custom') {
      setIsCustomModalOpen(true);
      return;
    }
    setScenario(scId);
    const target = SCENARIOS.find((s) => s.id === scId) || SCENARIOS[0];
    const initialMsg: Message = {
      id: createMessageId(`init-${scId}`),
      role: 'assistant',
      textLt: target.greeting,
      textEn: target.greetingEn,
      tip: target.tip,
      timestamp: getCurrentTimestamp(),
    };
    setMessages([initialMsg]);
    setSuggestions(target.initialSuggestions);
    setShowEnglishMap({});
    recordNewSession(target.title);

    if (autoSpeak) {
      handlePlayAudio(initialMsg.id, initialMsg.textLt);
    }
  };

  // Restart conversation
  const handleRestart = () => {
    if (scenario === 'custom') {
      initCustomScenario(customTopic, customRole);
    } else {
      const initialMsg: Message = {
        id: createMessageId(`init-${scenario}`),
        role: 'assistant',
        textLt: currentScenario.greeting,
        textEn: currentScenario.greetingEn,
        tip: currentScenario.tip,
        timestamp: getCurrentTimestamp(),
      };
      setMessages([initialMsg]);
      setSuggestions(currentScenario.initialSuggestions);
      setShowEnglishMap({});

      if (autoSpeak) {
        handlePlayAudio(initialMsg.id, initialMsg.textLt);
      }
    }
  };

  // Speech Recognition
  const toggleSpeechRecognition = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = getSpeechRecognitionClass();

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'lt-LT';
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (e: unknown) => {
        console.warn('Speech error:', e);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition initiation error:', err);
      setIsRecording(false);
    }
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    setInputText('');

    const userMsg: Message = {
      id: createMessageId('usr'),
      role: 'user',
      textLt: text,
      timestamp: getCurrentTimestamp(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLoading(true);

    try {
      const apiMessages = newHistory.map((m) => ({
        role: m.role,
        content: m.textLt,
      }));

      const memoryPrompt = formatTutorMemoryPrompt(getTutorMemory());

      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          customTopic,
          customRole,
          messages: apiMessages,
          userText: text,
          learnerMemory: memoryPrompt,
        }),
      });

      const data = await res.json();

      const assistantMsg: Message = {
        id: createMessageId('ast'),
        role: 'assistant',
        textLt: data.replyLithuanian,
        textEn: data.replyEnglish,
        tip: data.grammarTip,
        timestamp: getCurrentTimestamp(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (data.suggestedReplies && data.suggestedReplies.length > 0) {
        setSuggestions(data.suggestedReplies);
      }

      // Automatically speak the response if autoSpeak is on
      if (autoSpeak) {
        handlePlayAudio(assistantMsg.id, assistantMsg.textLt);
      }

      // Memory Extraction Update
      if (data.extractedFact) {
        const updated = addLearnerFact(data.extractedFact);
        setMemory(updated);
        setLearnedFactToast(data.extractedFact);
      }
      if (data.extractedName) {
        const updated = setLearnerName(data.extractedName);
        setMemory(updated);
        setEditingLearnerName(updated.learnerName || '');
      }

      // Reward XP for active practice!
      addXp(5);
    } catch (err) {
      console.error('Error fetching tutor response:', err);
    } finally {
      setLoading(false);
    }
  };

  // Remove a single memory fact
  const handleRemoveFact = (factIndex: number) => {
    const updatedFacts = memory.facts.filter((_, i) => i !== factIndex);
    const updated = { ...memory, facts: updatedFacts };
    saveTutorMemory(updated);
    setMemory(updated);
  };

  // Save student name from memory modal
  const handleSaveLearnerName = () => {
    const updated = setLearnerName(editingLearnerName);
    setMemory(updated);
  };

  // Clear memory
  const handleResetMemory = () => {
    if (confirm('Ar tikrai norite išvalyti visą mokytojos atmintį? (Reset all tutor memory?)')) {
      const reset = clearTutorMemory();
      setMemory(reset);
      setEditingLearnerName('');
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] bg-slate-50 pb-20 md:pb-6">
      {/* Top Banner */}
      <header className="bg-white border-b-2 border-slate-200 px-4 py-4 md:px-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl bg-gradient-to-br ${currentScenario.color} text-white shadow-md`}>
              <currentScenario.icon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-slate-800">
                  Pokalbis su Aiste • AI Tutor
                </h1>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-300">
                  Aistė • Vilnius
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 font-medium">
                {scenario === 'custom'
                  ? `Custom Roleplay: ${customTopic} • Role: ${customRole}`
                  : 'Real-time spoken Lithuanian practice with persistent memory and voice responses.'}
              </p>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            {/* Memory Modal Pill */}
            <button
              onClick={() => setIsMemoryModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl transition shadow-2xs"
              title="Aistė's Memory: What she remembers about you"
            >
              <Brain className="h-3.5 w-3.5 text-violet-600" />
              <span>
                Atmintis ({memory.facts.length + (memory.learnerName ? 1 : 0)})
              </span>
            </button>

            {/* Auto-Speak Toggle */}
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition shadow-2xs ${
                autoSpeak
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
              }`}
              title={autoSpeak ? 'Auto-Speak Responses is ON' : 'Auto-Speak Responses is OFF'}
            >
              {autoSpeak ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              <span>{autoSpeak ? 'Balsas ĮJ' : 'Balsas IŠJ'}</span>
            </button>

            {/* Audio Speed Toggle */}
            <button
              onClick={() => setIsSlowSpeed(!isSlowSpeed)}
              className={`px-2.5 py-2 text-xs font-bold rounded-xl border transition shadow-2xs ${
                isSlowSpeed
                  ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
              title={isSlowSpeed ? 'Slow pronunciation (0.75x)' : 'Normal speed (1.0x)'}
            >
              {isSlowSpeed ? '🐢 0.75x' : '🐰 1.0x'}
            </button>

            {scenario === 'custom' && (
              <button
                onClick={() => setIsCustomModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition shadow-2xs"
                title="Edit custom topic and role"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Keisti temą</span>
              </button>
            )}

            <button
              onClick={handleRestart}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition shadow-2xs"
              title="Restart conversation"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Iš naujo</span>
            </button>
          </div>
        </div>

        {/* Memory Notification Toast Banner */}
        {learnedFactToast && (
          <div className="max-w-4xl mx-auto mt-3 animate-in fade-in slide-in-from-top duration-300">
            <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-2xl shadow-md text-xs font-bold">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 shrink-0 text-violet-200 animate-pulse" />
                <span>Aistė įsiminė apie tave: „{learnedFactToast}“</span>
              </div>
              <button
                onClick={() => setLearnedFactToast(null)}
                className="text-violet-200 hover:text-white p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Scenario Selection Cards */}
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-4">
          {SCENARIOS.map((sc) => {
            const Icon = sc.icon;
            const isSelected = sc.id === scenario;
            return (
              <button
                key={sc.id}
                onClick={() => handleSelectScenario(sc.id)}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border-2 transition-all text-left ${isSelected
                    ? 'border-sky-500 bg-sky-50/80 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${sc.color} text-white shadow-xs`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <div className={`text-xs font-black truncate ${isSelected ? 'text-sky-900' : 'text-slate-800'}`}>
                    {sc.title}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 truncate">{sc.subtitle}</div>
                </div>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Chat Flow */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col">
        {/* Custom topic active banner */}
        {scenario === 'custom' && (
          <div className="mb-4 bg-gradient-to-r from-rose-50 to-pink-50 border-2 border-rose-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✨</span>
              <div>
                <span className="text-xs font-black uppercase text-rose-800 block">Aktyvus scenarijus • Active Scenario:</span>
                <span className="text-sm font-bold text-slate-800">{customTopic}</span>
                <span className="text-xs text-slate-500 ml-2 font-medium">• Rolė • Role: {customRole}</span>
              </div>
            </div>
            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="text-xs font-bold text-rose-700 hover:text-rose-900 bg-white border border-rose-200 px-3 py-1.5 rounded-xl shadow-2xs shrink-0"
            >
              Keisti temą • Change
            </button>
          </div>
        )}

        <div className="flex-1 space-y-4 mb-4 overflow-y-auto">
          {messages.map((msg) => {
            const isAssistant = msg.role === 'assistant';
            const isPlayingThis = audioPlayingId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[88%] md:max-w-[75%] rounded-3xl p-4 shadow-xs transition-all ${isAssistant
                      ? 'bg-white border-2 border-slate-200 rounded-tl-sm text-slate-800'
                      : 'bg-emerald-600 text-white rounded-tr-sm'
                    }`}
                >
                  {/* Lithuanian Text */}
                  <div className="flex items-start justify-between gap-3">
                    <p className={`text-base md:text-lg font-bold leading-relaxed ${isAssistant ? 'text-slate-900' : 'text-white'}`}>
                      {msg.textLt}
                    </p>

                    {isAssistant && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handlePlayAudio(msg.id, msg.textLt, false)}
                          disabled={isPlayingThis}
                          className={`p-2 rounded-xl transition ${isPlayingThis
                              ? 'bg-emerald-100 text-emerald-700 animate-pulse'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          title="Listen at normal speed (1.0x)"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handlePlayAudio(msg.id, msg.textLt, true)}
                          disabled={isPlayingThis}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 text-[11px] font-bold"
                          title="Listen slowly (0.75x)"
                        >
                          🐢
                        </button>
                      </div>
                    )}
                  </div>

                  {/* English Subtitle (Always visible) */}
                  {isAssistant && msg.textEn && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block mb-0.5">
                        English Subtitle:
                      </span>
                      <p className="text-xs md:text-sm font-medium text-slate-600 italic bg-slate-50/90 p-2.5 rounded-xl border border-slate-100">
                        {msg.textEn}
                      </p>
                    </div>
                  )}

                  {/* Grammar Tip */}
                  {isAssistant && msg.tip && (
                    <div className="mt-2.5 flex items-start gap-1.5 bg-amber-50/80 border border-amber-200 text-amber-900 text-xs font-medium p-2.5 rounded-xl">
                      <HelpCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{msg.tip}</span>
                    </div>
                  )}

                  <div className={`mt-1.5 text-[10px] font-bold ${isAssistant ? 'text-slate-400' : 'text-emerald-200'} text-right`}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading indicator */}
          {loading && (
            <div className="flex items-center gap-2 text-slate-500 bg-white border border-slate-200 rounded-2xl p-3 w-fit">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-violet-500 animate-bounce"></span>
                <span className="h-2 w-2 rounded-full bg-violet-500 animate-bounce delay-150"></span>
                <span className="h-2 w-2 rounded-full bg-violet-500 animate-bounce delay-300"></span>
              </div>
              <span className="text-xs font-bold">Aistė galvoja atsakymą... • Aistė is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Replies Chips */}
        {suggestions.length > 0 && !loading && (
          <div className="mb-3">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
              Patarimai atsakymui • Tap to reply:
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(s.lt)}
                  className="group flex flex-col text-left px-3.5 py-2 rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all shadow-xs"
                >
                  <span className="text-xs font-extrabold text-slate-800 group-hover:text-emerald-800">
                    {s.lt}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 group-hover:text-emerald-600">
                    {s.en}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Listening Status Indicator */}
        {isRecording && (
          <div className="mb-2 flex items-center justify-between bg-red-500 text-white px-4 py-2 rounded-2xl text-xs font-bold animate-pulse shadow-md">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping" />
              <span>Klausausi... Kalbėkite lietuviškai dabar (Listening...)</span>
            </div>
            <button
              onClick={toggleSpeechRecognition}
              className="text-white hover:underline uppercase text-[10px] tracking-wider"
            >
              Baigti (Stop)
            </button>
          </div>
        )}

        {/* Input Controls Bar */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-2 shadow-sm flex items-center gap-2">
          {/* Voice Input Button */}
          <button
            onClick={toggleSpeechRecognition}
            className={`p-3 rounded-2xl transition-all flex items-center justify-center ${isRecording
                ? 'bg-red-500 text-white animate-pulse shadow-md ring-4 ring-red-200'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            title={isRecording ? 'Listening in Lithuanian... Click to stop' : 'Speak in Lithuanian (Microphone)'}
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              isRecording
                ? 'Klausausi... Kalbėkite lietuviškai...'
                : 'Atsakykite lietuviškai... (Type or use mic)'
            }
            className="flex-1 px-3 py-2 text-sm md:text-base font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || loading}
            className={`p-3 rounded-2xl font-bold transition-all flex items-center justify-center ${inputText.trim() && !loading
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md active:translate-y-0.5'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        {/* Practice Reward Footer */}
        <div className="mt-2 text-center flex items-center justify-center gap-2 text-xs font-bold text-amber-700">
          <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
          <span>Earn +5 XP for each completed conversation turn!</span>
        </div>
      </main>

      {/* Tutor Memory Drawer / Modal */}
      {isMemoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border-2 border-slate-100 max-h-[85vh] overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-violet-100 text-violet-700">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Aistės Atmintis • Tutor Memory
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    What Aistė remembers about you across sessions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMemoryModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Learner Name Input */}
            <div className="bg-violet-50/70 border border-violet-200 rounded-2xl p-3 flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-violet-800 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span>Tavo Vardas • Your Name:</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editingLearnerName}
                  onChange={(e) => setEditingLearnerName(e.target.value)}
                  placeholder="pvz.: Jonas, Laura, Alex..."
                  className="flex-1 px-3 py-1.5 text-xs font-bold border border-violet-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
                <button
                  type="button"
                  onClick={handleSaveLearnerName}
                  className="px-3 py-1.5 text-xs font-bold bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition"
                >
                  Išsaugoti
                </button>
              </div>
            </div>

            {/* Session Stats */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">
                  Pamokų skaičius:
                </span>
                <span className="text-sm font-black text-slate-800">
                  {memory.totalSessions} {memory.totalSessions === 1 ? 'kartas' : 'kartai'}
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">
                  Paskutinis susitikimas:
                </span>
                <span className="text-sm font-black text-slate-800 truncate block">
                  {memory.lastSessionDate || 'Šiandien'}
                </span>
              </div>
            </div>

            {/* Remembered Facts */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Įsiminti faktai apie tave ({memory.facts.length}):
                </span>
              </div>

              {memory.facts.length === 0 ? (
                <div className="p-3 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400 italic">
                  Aistė dar mokosi apie tave! Kalbėkite apie savo pomėgius, darbą ar gyvenimą, ir ji viską įsimins natūraliai.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {memory.facts.map((fact, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium"
                    >
                      <span>• {fact}</span>
                      <button
                        onClick={() => handleRemoveFact(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                        title="Ištrinti faktą"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Topics */}
            {memory.recentTopics.length > 0 && (
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 block mb-1.5">
                  Neseniai aptartos temos:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {memory.recentTopics.map((topic, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Clear Memory Button */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetMemory}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Išvalyti visą atmintį</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMemoryModalOpen(false)}
                className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition"
              >
                Uždaryti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Scenario Builder Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-pop">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border-2 border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Sukurti savo temą • Custom Roleplay
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Choose a realistic Lithuanian scenario or enter any custom topic!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="mb-4">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                Populiarios temos • Popular Scenarios:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_CUSTOM_TOPICS.map((preset) => (
                  <button
                    key={preset.topic}
                    type="button"
                    onClick={() => {
                      setCustomTopic(preset.topic);
                      setCustomRole(preset.role);
                    }}
                    className={`flex items-start gap-2.5 p-3 rounded-2xl border-2 text-left transition-all ${customTopic === preset.topic
                        ? 'border-rose-500 bg-rose-50/70 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{preset.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-800 leading-tight">
                        {preset.topic}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium mt-1 leading-snug">
                        {preset.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input Fields */}
            <div className="space-y-3.5 mb-6">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                  Tema ar situacija (Topic / Situation):
                </label>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="e.g. Buto nuoma, pas gydytoją, restoranas, draugystė..."
                  className="w-full px-4 py-2.5 text-sm font-semibold border-2 border-slate-200 rounded-2xl focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                  DI partnerio rolė (AI Role):
                </label>
                <input
                  type="text"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="e.g. Nuomotojas, Gydytojas, Vadovas, Viešbučio registratorius..."
                  className="w-full px-4 py-2.5 text-sm font-semibold border-2 border-slate-200 rounded-2xl focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Launch Button */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl"
              >
                Atšaukti (Cancel)
              </button>

              <button
                type="button"
                onClick={() => handleApplyCustomScenario(customTopic, customRole)}
                disabled={!customTopic.trim()}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white rounded-2xl shadow-md transition active:translate-y-0.5 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>Pradėti pokalbį • Start Chat</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
