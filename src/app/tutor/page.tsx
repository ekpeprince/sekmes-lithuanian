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
  ChevronDown,
  Lightbulb,
  Plus,
  History,
  Search,
} from 'lucide-react';
import { sounds } from '@/lib/audio';
import { useGame } from '@/context/GameContext';
import { useActiveTimer } from '@/hooks/useActiveTimer';
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
import {
  getSessions,
  saveSession,
  deleteSession,
  createNewSession,
  getActiveSessionId,
  setActiveSessionId,
  getSession,
  TutorMessage,
  TutorSession,
  INITIAL_AISTE_GREETING,
  INITIAL_AISTE_TRANSLATION,
} from '@/lib/tutorStorage';

import { FREE_CHAT_SCENARIO } from '@/data/scenarios';

type ScenarioType = 'free-chat' | 'cafe' | 'market' | 'directions' | 'free' | 'custom';

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
    id: 'free-chat' as ScenarioType,
    title: 'Free Conversation',
    name: 'Free Conversation',
    lithuanianName: 'Laisvas Pokalbis',
    subtitle: 'Laisvas Pokalbis • Open Talk',
    icon: Sparkles,
    color: 'from-amber-400 via-rose-400 to-indigo-500',
    greeting: 'Labas! Aš esu Aistė. Apie ką norėtum pasikalbėti šiandien?',
    greetingEn: "Hi! I'm Aistė. What would you like to talk about today?",
    tip: 'Feel free to speak about any topic! Aistė adapts to your level and gently corrects mistakes.',
    promptSystem: FREE_CHAT_SCENARIO.promptSystem,
    initialSuggestions: [
      { lt: 'Kaip sekasi?', en: 'How are you?' },
      { lt: 'Papasakok apie Lietuvą 🇱🇹', en: 'Tell me about Lithuania' },
      { lt: 'Išmokyk mane naują žodį', en: 'Teach me a new word' },
    ],
  },
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

function convertToTutorMessages(msgs: Message[], lastSuggestions?: Suggestion[]): TutorMessage[] {
  return msgs.map((m, idx) => ({
    id: m.id,
    sender: m.role === 'user' ? 'user' : 'aiste',
    text: m.textLt,
    translation: m.textEn,
    suggestions:
      idx === msgs.length - 1 && lastSuggestions && lastSuggestions.length > 0
        ? lastSuggestions.map((s) => s.lt)
        : undefined,
    timestamp: m.timestamp,
  }));
}

function convertFromTutorMessages(tMsgs: TutorMessage[]): { messages: Message[]; suggestions: Suggestion[] } {
  const loadedMessages: Message[] = tMsgs.map((tm) => ({
    id: tm.id,
    role: tm.sender === 'user' ? 'user' : 'assistant',
    textLt: tm.text,
    textEn: tm.translation,
    timestamp: tm.timestamp,
  }));

  const lastAssistantWithSuggestions = [...tMsgs]
    .reverse()
    .find((m) => m.sender === 'aiste' && m.suggestions && m.suggestions.length > 0);

  const loadedSuggestions: Suggestion[] = lastAssistantWithSuggestions?.suggestions
    ? lastAssistantWithSuggestions.suggestions.map((lt) => ({ lt, en: '' }))
    : [
        { lt: 'Kaip sekasi?', en: 'How are you?' },
        { lt: 'Papasakok apie Lietuvą 🇱🇹', en: 'Tell me about Lithuania' },
        { lt: 'Išmokyk mane naują žodį', en: 'Teach me a new word' },
      ];

  return { messages: loadedMessages, suggestions: loadedSuggestions };
}

function formatSessionDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TutorPage() {
  const { addXp } = useGame();
  useActiveTimer(true);
  const [scenario, setScenario] = useState<ScenarioType>('free-chat');
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'init-1',
      role: 'assistant',
      textLt: INITIAL_AISTE_GREETING,
      textEn: INITIAL_AISTE_TRANSLATION,
      tip: 'Feel free to speak about any topic! Aistė adapts to your level and gently corrects mistakes.',
      timestamp: '12:00',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(() => [
    { lt: 'Kaip sekasi?', en: 'How are you?' },
    { lt: 'Papasakok apie Lietuvą 🇱🇹', en: 'Tell me about Lithuania' },
    { lt: 'Išmokyk mane naują žodį', en: 'Teach me a new word' },
  ]);
  const [showEnglishMap, setShowEnglishMap] = useState<Record<string, boolean>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null);

  // Active chat session & history drawer states
  const [activeSessionId, setActiveSessionIdState] = useState<string>('');
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [sessionsList, setSessionsList] = useState<TutorSession[]>([]);

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
  const scenarioDropdownRef = useRef<HTMLDivElement>(null);

  // UI modal and dropdown states
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [scenarioDropdownOpen, setScenarioDropdownOpen] = useState(false);
  const [expandedTips, setExpandedTips] = useState<Record<string, boolean>>({});

  const toggleTip = (msgId: string) => {
    setExpandedTips((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        scenarioDropdownRef.current &&
        !scenarioDropdownRef.current.contains(event.target as Node)
      ) {
        setScenarioDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Load or create active chat session from storage
  useEffect(() => {
    const allSessions = getSessions();
    const storedActiveId = getActiveSessionId();
    let currentSession: TutorSession | null = null;

    if (storedActiveId) {
      currentSession = allSessions.find((s) => s.id === storedActiveId) || null;
    }

    if (!currentSession) {
      if (allSessions.length > 0) {
        currentSession = allSessions[0];
      } else {
        currentSession = createNewSession();
      }
    }

    setActiveSessionId(currentSession.id);
    setActiveSessionIdState(currentSession.id);
    setSessionsList(getSessions());

    if (currentSession.messages && currentSession.messages.length > 0) {
      const { messages: restoredMsgs, suggestions: restoredSuggs } = convertFromTutorMessages(
        currentSession.messages
      );
      setMessages(restoredMsgs);
      setSuggestions(restoredSuggs);
    }
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
      const reply = data.reply || data.replyLithuanian || '';
      const translation = data.translation || data.replyEnglish || '';
      const assistantMsg: Message = {
        id: createMessageId('init-custom'),
        role: 'assistant',
        textLt: reply,
        textEn: translation,
        tip: data.grammarTip,
        timestamp: getCurrentTimestamp(),
      };

      setMessages([assistantMsg]);
      const rawSuggestions = data.suggestions || data.suggestedReplies || [];
      const normalizedSuggestions: Suggestion[] = rawSuggestions.map(
        (item: string | { lt: string; en?: string }) =>
          typeof item === 'string' ? { lt: item, en: '' } : { lt: item.lt, en: item.en || '' }
      );
      if (normalizedSuggestions.length > 0) {
        setSuggestions(normalizedSuggestions);
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

    // Create and save new session for selected scenario
    const newSession = createNewSession(target.title.replace(/^✨\s*/, ''));
    newSession.messages = [
      {
        id: initialMsg.id,
        sender: 'aiste',
        text: initialMsg.textLt,
        translation: initialMsg.textEn,
        suggestions: target.initialSuggestions.map((s) => s.lt),
        timestamp: initialMsg.timestamp,
      },
    ];
    saveSession(newSession);
    setActiveSessionId(newSession.id);
    setActiveSessionIdState(newSession.id);
    setSessionsList(getSessions());

    if (autoSpeak) {
      handlePlayAudio(initialMsg.id, initialMsg.textLt);
    }
  };

  // Start new clean chat session (+ Naujas)
  const handleNewChat = () => {
    const current = activeSessionId ? getSession(activeSessionId) : null;
    const hasUserMessage = current?.messages.some((m) => m.sender === 'user');

    // If the user hasn't sent any messages in the current session, do not create a duplicate
    if (current && !hasUserMessage) {
      setIsHistoryDrawerOpen(false);
      return;
    }

    // 1. Archive active session: auto-title from first user message if still default
    if (current && (current.title === 'New Conversation' || current.title === 'Naujas pokalbis' || !current.title)) {
      const firstUser = current.messages.find((m) => m.sender === 'user');
      if (firstUser) {
        const autoTitle =
          firstUser.text.length > 30 ? `${firstUser.text.slice(0, 30)}...` : firstUser.text;
        saveSession({ ...current, title: autoTitle });
      }
    }

    // 2. Create clean session
    const newSession = createNewSession();
    setActiveSessionId(newSession.id);
    setActiveSessionIdState(newSession.id);
    setSessionsList(getSessions());

    // 3. Reset active state
    const { messages: freshMsgs, suggestions: freshSuggs } = convertFromTutorMessages(
      newSession.messages
    );
    setMessages(freshMsgs);
    setSuggestions(freshSuggs);
    setShowEnglishMap({});
    setInputText('');
    setScenario('free-chat');

    if (autoSpeak && freshMsgs[0]) {
      handlePlayAudio(freshMsgs[0].id, freshMsgs[0].textLt);
    }
  };

  // Switch to another session from history drawer
  const handleSelectSession = (targetSession: TutorSession) => {
    setActiveSessionId(targetSession.id);
    setActiveSessionIdState(targetSession.id);
    const { messages: restoredMsgs, suggestions: restoredSuggs } = convertFromTutorMessages(
      targetSession.messages
    );
    setMessages(restoredMsgs);
    setSuggestions(restoredSuggs);
    setShowEnglishMap({});
    setIsHistoryDrawerOpen(false);
  };

  // Delete a session
  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSession(id);
    const updated = getSessions();
    setSessionsList(updated);

    if (activeSessionId === id) {
      if (updated.length > 0) {
        handleSelectSession(updated[0]);
      } else {
        handleNewChat();
      }
    }
  };

  // Restart conversation
  const handleRestart = () => {
    if (scenario === 'custom') {
      initCustomScenario(customTopic, customRole);
    } else {
      handleNewChat();
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
    setSuggestions([]);

    const userMsg: Message = {
      id: createMessageId('usr'),
      role: 'user',
      textLt: text,
      timestamp: getCurrentTimestamp(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLoading(true);

    // Auto-title session if it's the first user message
    let currentSessionId = activeSessionId;
    let activeSession = currentSessionId ? getSession(currentSessionId) : null;
    if (!activeSession) {
      const fresh = createNewSession();
      currentSessionId = fresh.id;
      setActiveSessionId(fresh.id);
      setActiveSessionIdState(fresh.id);
      activeSession = fresh;
    }

    const latestStoredSession = currentSessionId ? getSession(currentSessionId) : null;
    const isDefaultTitle =
      !latestStoredSession?.title ||
      latestStoredSession.title === 'New Conversation' ||
      latestStoredSession.title === 'Naujas pokalbis';
    const sessionTitle = isDefaultTitle
      ? (text.length > 32 ? `${text.slice(0, 32)}...` : text)
      : latestStoredSession.title;

    // Save immediate user message to active session
    saveSession({
      id: currentSessionId,
      title: sessionTitle,
      createdAt: latestStoredSession?.createdAt || activeSession.createdAt || Date.now(),
      updatedAt: Date.now(),
      messages: convertToTutorMessages(newHistory),
    });
    setSessionsList(getSessions());

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
        text: m.textLt,
      }));

      const memoryPrompt = formatTutorMemoryPrompt(getTutorMemory());

      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          scenario,
          customTopic,
          customRole,
          learnerMemory: memoryPrompt,
        }),
      });

      const data = await res.json();

      const reply = data.reply || data.replyLithuanian || '';
      const translation = data.translation || data.replyEnglish || '';

      const assistantMsg: Message = {
        id: createMessageId('ast'),
        role: 'assistant',
        textLt: reply,
        textEn: translation,
        tip: data.grammarTip,
        timestamp: getCurrentTimestamp(),
      };

      const finalMessages = [...newHistory, assistantMsg];
      setMessages(finalMessages);

      // Normalize suggestions to Suggestion[] ({ lt: string, en: string })
      const rawSuggestions = data.suggestions || data.suggestedReplies || [];
      const normalizedSuggestions: Suggestion[] = rawSuggestions.map(
        (item: string | { lt: string; en?: string }) =>
          typeof item === 'string' ? { lt: item, en: '' } : { lt: item.lt, en: item.en || '' }
      );
      setSuggestions(normalizedSuggestions);

      // Save complete session with assistant reply and suggestions
      const sessionForSave = currentSessionId ? getSession(currentSessionId) : null;
      saveSession({
        id: currentSessionId,
        title: sessionForSave?.title || sessionTitle,
        createdAt: sessionForSave?.createdAt || latestStoredSession?.createdAt || activeSession.createdAt || Date.now(),
        updatedAt: Date.now(),
        messages: convertToTutorMessages(finalMessages, normalizedSuggestions),
      });
      setSessionsList(getSessions());

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

  const filteredSessions = sessionsList.filter((s) => {
    if (!historySearchQuery.trim()) return true;
    const q = historySearchQuery.toLowerCase();
    const matchTitle = (s.title || '').toLowerCase().includes(q);
    const matchMessages = (s.messages || []).some(
      (m) =>
        m.text.toLowerCase().includes(q) ||
        (m.translation && m.translation.toLowerCase().includes(q))
    );
    return matchTitle || matchMessages;
  });

  return (
    <div className="flex flex-col h-[calc(100dvh-57px)] md:h-[calc(100vh-65px)] pb-16 md:pb-0 max-w-4xl w-full mx-auto overflow-hidden bg-slate-50 relative select-none">
      {/* 1. Sub-Header Scenario Dock */}
      <header className="sticky top-0 w-full px-3 sm:px-4 py-2 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between backdrop-blur-md shadow-2xs z-30 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {/* Scenario Switcher Dropdown Trigger */}
          <div className="relative shrink-0" ref={scenarioDropdownRef}>
            <button
              type="button"
              onClick={() => setScenarioDropdownOpen((prev) => !prev)}
              className="btn-tactile bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 font-bold text-xs px-2.5 sm:px-3 py-1.5 rounded-full flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs"
              aria-expanded={scenarioDropdownOpen}
              aria-haspopup="true"
            >
              <currentScenario.icon className="w-3.5 h-3.5 text-slate-700 shrink-0" />
              <span className="truncate max-w-[105px] xs:max-w-[130px] sm:max-w-[190px]">
                {scenario === 'custom'
                  ? customTopic.split('(')[0].trim()
                  : currentScenario.title.replace(/^✨\s*/, '')}
              </span>
              <span className="text-slate-400 text-[10px] leading-none shrink-0 ml-0.5">▾</span>
            </button>

            {/* Dropdown Popover */}
            {scenarioDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-72 sm:w-80 rounded-2xl bg-white border-2 border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Choose Scenario
                </div>
                <div className="space-y-1">
                  {SCENARIOS.map((sc) => {
                    const Icon = sc.icon;
                    const isSelected = sc.id === scenario;
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => {
                          handleSelectScenario(sc.id);
                          setScenarioDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-sky-50 text-sky-900 font-bold border border-sky-200'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${sc.color} text-white flex items-center justify-center shrink-0 shadow-xs`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">{sc.title.replace(/^✨\s*/, '')}</div>
                            <div className="text-[10px] text-slate-400 truncate">{sc.subtitle}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-sky-600 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* New Chat Button (+ New Chat) */}
          <button
            type="button"
            onClick={handleNewChat}
            className="btn-tactile bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs px-2.5 sm:px-3 py-1.5 rounded-full flex items-center gap-1 transition cursor-pointer shadow-xs shrink-0"
            title="Start new chat (+ New Chat)"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden xs:inline sm:inline text-xs tracking-tight">+ New Chat</span>
          </button>
        </div>

        {/* Right side: History Drawer + Scenario Progress / Fluency Score chip + Settings gear icon */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* History Drawer Trigger */}
          <button
            type="button"
            onClick={() => {
              setSessionsList(getSessions());
              setIsHistoryDrawerOpen(true);
            }}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition active:scale-95 cursor-pointer relative"
            title="Chat History"
            aria-label="Chat History"
          >
            <History className="w-4 h-4 text-slate-600" />
            {sessionsList.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {sessionsList.length > 9 ? '9+' : sessionsList.length}
              </span>
            )}
          </button>

          {/* Scenario Progress / Fluency Score Chip */}
          <button
            type="button"
            onClick={() => setIsMemoryModalOpen(true)}
            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 font-black text-xs px-2.5 py-1 rounded-full flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-2xs"
            title="Fluency Score & Aistė's Memory"
          >
            <Brain className="w-3.5 h-3.5 text-purple-600" />
            <span>{messages.filter((m) => m.role === 'user').length * 10} pts</span>
          </button>

          {/* Settings Modal Button */}
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition active:scale-95 cursor-pointer"
            title="Tutor settings & audio controls"
          >
            <Settings className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </header>

      {/* Memory Notification Toast Banner */}
      {learnedFactToast && (
        <div className="shrink-0 px-4 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-between gap-2 shadow-xs z-20">
          <div className="flex items-center gap-2 min-w-0">
            <Brain className="w-4 h-4 text-violet-200 shrink-0 animate-pulse" />
            <span className="truncate">Aistė remembered: &ldquo;{learnedFactToast}&rdquo;</span>
          </div>
          <button
            type="button"
            onClick={() => setLearnedFactToast(null)}
            className="text-violet-200 hover:text-white p-0.5 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Custom scenario active context alert */}
      {scenario === 'custom' && (
        <div className="shrink-0 px-3.5 py-1.5 bg-rose-50 border-b border-rose-200 text-xs text-rose-800 flex items-center justify-between gap-2">
          <div className="truncate">
            <span className="font-bold">Roleplay: </span>
            <span>{customTopic}</span>
            <span className="text-slate-500 ml-1.5">({customRole})</span>
          </div>
          <button
            type="button"
            onClick={() => setIsCustomModalOpen(true)}
            className="text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-white border border-rose-200 px-2 py-0.5 rounded-lg shrink-0 cursor-pointer shadow-2xs"
          >
            Edit
          </button>
        </div>
      )}

      {/* 2. Main Chat Messages Flow */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-3 space-y-3.5 scroll-smooth">
        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';
          const isPlayingThis = audioPlayingId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
            >
              {/* Header with Avatar and Timestamp */}
              {isAssistant ? (
                <div className="flex items-center gap-1.5 mb-1 pl-1">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white text-[10px] font-black shadow-2xs">
                    A
                  </div>
                  <span className="text-xs font-bold text-slate-700">Aistė</span>
                  <span className="text-[10px] text-slate-400 font-medium">• {msg.timestamp}</span>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-1.5 mb-1 pr-1">
                  <span className="text-xs font-bold text-slate-600">You</span>
                  <span className="text-[10px] text-slate-400 font-medium">• {msg.timestamp}</span>
                </div>
              )}

              {/* Speech Bubble */}
              {isAssistant ? (
                <div className="w-full flex flex-col items-start">
                  <div className="bg-white border-2 border-slate-100 rounded-2xl rounded-tl-sm p-4 shadow-xs relative max-w-[88%] text-slate-800">
                    {/* Top: Full-width Lithuanian dialogue */}
                    <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                      {msg.textLt}
                    </p>

                    {/* Middle (conditional): Grammar Hint Callout */}
                    {msg.tip && expandedTips[msg.id] && (
                      <div className="mt-2.5 p-2.5 border border-amber-200/70 bg-amber-50/80 rounded-xl flex items-start gap-1.5 text-xs text-amber-900 animate-in fade-in">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span className="font-medium leading-snug">{msg.tip}</span>
                      </div>
                    )}

                    {/* Middle (conditional): Expanded English translation */}
                    {msg.textEn && showEnglishMap[msg.id] && (
                      <div className="bg-slate-50 text-xs text-slate-600 p-2 rounded-xl border border-slate-100 mt-2 animate-in fade-in">
                        &ldquo;{msg.textEn}&rdquo;
                      </div>
                    )}

                    {/* Bottom Action Row */}
                    <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100">
                      {/* Left: "Show translation" toggle */}
                      {msg.textEn ? (
                        <button
                          type="button"
                          onClick={() => toggleEnglish(msg.id)}
                          className="text-[11px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer transition select-none"
                        >
                          {showEnglishMap[msg.id] ? 'Hide translation' : 'Show translation'}
                        </button>
                      ) : (
                        <div />
                      )}

                      {/* Right: Action buttons (Audio & Hint) */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handlePlayAudio(msg.id, msg.textLt, false)}
                          disabled={isPlayingThis}
                          className={`w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition active:scale-95 cursor-pointer ${
                            isPlayingThis ? 'ring-2 ring-emerald-300 animate-pulse bg-emerald-100 text-emerald-700' : ''
                          }`}
                          title="Play pronunciation"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        {msg.tip && (
                          <button
                            type="button"
                            onClick={() => toggleTip(msg.id)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition active:scale-95 cursor-pointer ${
                              expandedTips[msg.id]
                                ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-200'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                            title="Toggle grammar hint"
                          >
                            <Lightbulb className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-[88%] sm:max-w-[75%] bg-emerald-600 text-white rounded-2xl rounded-tr-xs p-3.5 px-4 shadow-2xs text-left">
                  <div className="flex items-start justify-between gap-2.5">
                    <p className="text-base font-semibold leading-relaxed">
                      {msg.textLt}
                    </p>
                    <button
                      type="button"
                      onClick={() => handlePlayAudio(msg.id, msg.textLt, false)}
                      className="p-1 text-emerald-200 hover:text-white transition shrink-0 cursor-pointer"
                      title="Pronounce phrase"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center gap-2 text-slate-500 bg-white border border-slate-200 rounded-2xl p-3 w-fit shadow-2xs">
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce"></span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce delay-150"></span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce delay-300"></span>
            </div>
            <span className="text-xs font-bold text-slate-600">Aistė is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Suggested Response Chips (Quick Replies) */}
      {(() => {
        const isStarter = (lt: string) =>
          ['Kaip sekasi?', 'Papasakok apie Lietuvą 🇱🇹', 'Išmokyk mane naują žodį'].includes(lt);

        let displayedSuggestions: Suggestion[] = [];
        if (messages.length === 1) {
          displayedSuggestions =
            scenario === 'free-chat'
              ? [
                  { lt: 'Kaip sekasi?', en: 'How are you?' },
                  { lt: 'Papasakok apie Lietuvą 🇱🇹', en: 'Tell me about Lithuania' },
                  { lt: 'Išmokyk mane naują žodį', en: 'Teach me a new word' },
                ]
              : suggestions;
        } else {
          // Once conversation begins (message count > 1), hide static starters
          // and populate only with contextual follow-ups generated by the assistant
          displayedSuggestions = suggestions.filter((s) => !isStarter(s.lt));
        }

        return displayedSuggestions.length > 0 && !loading ? (
          <div className="relative shrink-0 bg-slate-50/95 border-t border-slate-100">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-3 pr-8 py-1.5 scroll-smooth">
              {displayedSuggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(s.lt)}
                  title={s.en ? `"${s.en}" (Tap to reply)` : 'Tap to reply'}
                  className="whitespace-nowrap shrink-0 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow-2xs transition active:scale-95 cursor-pointer"
                >
                  {s.lt}
                </button>
              ))}
            </div>
            {/* Subtle right-edge fade mask */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50/95 to-transparent" />
          </div>
        ) : null;
      })()}

      {/* Listening Status Indicator */}
      {isRecording && (
        <div className="shrink-0 px-4 py-1.5 bg-rose-500 text-white text-xs font-bold flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-white animate-ping" />
            <span>Listening... Speak in Lithuanian</span>
          </div>
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            className="text-white hover:underline text-[10px] uppercase tracking-wider font-black cursor-pointer"
          >
            Stop
          </button>
        </div>
      )}

      {/* 4. Sticky Bottom Interaction Input Bar */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-100 pt-2 pb-safe px-3 shrink-0">
        <div className="flex items-center gap-2 bg-slate-100 border border-slate-200/80 rounded-2xl px-2 py-1.5 focus-within:bg-white focus-within:border-emerald-500 transition-all">
          {/* Voice Button */}
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs active:scale-95 transition cursor-pointer ${
              isRecording
                ? 'bg-rose-500 hover:bg-rose-600 text-white ring-2 ring-rose-300 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
            title={isRecording ? 'Listening in Lithuanian... Click to stop' : 'Speak in Lithuanian (Microphone)'}
          >
            {isRecording ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
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
            placeholder={isRecording ? 'Listening... Speak in Lithuanian' : 'Reply in Lithuanian...'}
            className="flex-1 bg-transparent border-0 outline-none text-xs font-medium text-slate-800 placeholder:text-slate-400 min-w-0"
          />

          {/* Send / XP Pill */}
          {inputText.trim() ? (
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={loading}
              className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition shadow-xs shrink-0 active:scale-95 cursor-pointer"
              title="Send reply (+5 XP)"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          ) : (
            <div
              className="px-2.5 py-1 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-600 font-bold text-[10px] uppercase tracking-wider shrink-0 select-none flex items-center gap-1"
              title="Send a message to earn +5 XP"
            >
              <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span>+5 XP</span>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal Sheet */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border-2 border-slate-100 flex flex-col gap-4 animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Tutor Settings</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Voice, speed & conversation options</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Audio Speed */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Pronunciation Speed:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsSlowSpeed(false)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    !isSlowSpeed
                      ? 'bg-sky-50 text-sky-700 border-sky-300 shadow-2xs font-black'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>🐰 Normal (1.0x)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSlowSpeed(true)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSlowSpeed
                      ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs font-black'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>🐢 Slow (0.75x)</span>
                </button>
              </div>
            </div>

            {/* Auto-Speak Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Automatic Voice Responses:
              </label>
              <button
                type="button"
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  autoSpeak
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {autoSpeak ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                  {autoSpeak ? 'Auto-speak enabled' : 'Auto-speak muted'}
                </span>
                <span className="text-[11px] font-black">{autoSpeak ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* Tutor Memory Quick Access */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Persistent Learner Memory:
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsSettingsModalOpen(false);
                  setIsMemoryModalOpen(true);
                }}
                className="w-full py-2 px-3 rounded-xl border border-violet-200 bg-violet-50 text-violet-800 text-xs font-bold hover:bg-violet-100 transition flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-violet-600" />
                  <span>Manage Remembered Facts</span>
                </span>
                <span className="text-[11px] font-black bg-violet-200 px-2 py-0.5 rounded-full">
                  {memory.facts.length}
                </span>
              </button>
            </div>

            {/* Restart Conversation */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  handleRestart();
                  setIsSettingsModalOpen(false);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart Chat</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

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
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
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
                  className="flex-1 px-3 py-1.5 text-base font-bold border border-violet-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
                <button
                  type="button"
                  onClick={handleSaveLearnerName}
                  className="px-3 py-1.5 text-xs font-bold bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition cursor-pointer"
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
                        type="button"
                        onClick={() => handleRemoveFact(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
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
                className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Išvalyti visą atmintį</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMemoryModalOpen(false)}
                className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
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
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
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
                    className={`flex items-start gap-2.5 p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      customTopic === preset.topic
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
                  className="w-full px-4 py-2.5 text-base font-semibold border-2 border-slate-200 rounded-2xl focus:border-rose-500 focus:outline-none"
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
                  className="w-full px-4 py-2.5 text-base font-semibold border-2 border-slate-200 rounded-2xl focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Launch Button */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl cursor-pointer"
              >
                Atšaukti (Cancel)
              </button>

              <button
                type="button"
                onClick={() => handleApplyCustomScenario(customTopic, customRole)}
                disabled={!customTopic.trim()}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white rounded-2xl shadow-md transition active:translate-y-0.5 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Pradėti pokalbį • Start Chat</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Slide-over History Drawer */}
      {isHistoryDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsHistoryDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-over Sheet */}
          <aside className="relative w-full max-w-sm sm:max-w-md bg-white h-full shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shadow-xs">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800 leading-tight">Chat History</h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {sessionsList.length} {sessionsList.length === 1 ? 'chat' : 'chats'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    handleNewChat();
                    setIsHistoryDrawerOpen(false);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition active:scale-95 cursor-pointer shadow-xs"
                  title="Start new chat"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>+ New Chat</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsHistoryDrawerOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Real-time Search Input Bar */}
            <div className="p-3.5 border-b border-slate-100 bg-white">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-8 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-none transition shadow-2xs"
                />
                {historySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setHistorySearchQuery('')}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Chronological Sessions List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredSessions.length === 0 ? (
                <div className="py-14 text-center text-slate-400 px-4">
                  <MessageCircle className="w-10 h-10 mx-auto text-slate-300 mb-2 opacity-60" />
                  <p className="text-xs font-bold text-slate-700">
                    {historySearchQuery ? 'No conversations found' : 'No chat history yet'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                    {historySearchQuery
                      ? 'Try searching for another word or phrase.'
                      : 'Start chatting with Aistė — conversations are saved automatically!'}
                  </p>
                </div>
              ) : (
                filteredSessions.map((s) => {
                  const isActive = s.id === activeSessionId;
                  const messageCount = s.messages.length;
                  const lastMsg = s.messages[s.messages.length - 1];
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectSession(s)}
                      className={`group relative p-3 rounded-2xl border transition cursor-pointer flex flex-col gap-1.5 ${
                        isActive
                          ? 'bg-sky-50/70 border-sky-300 ring-1 ring-sky-300/60 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200/90 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3
                            className={`text-xs font-black truncate ${
                              isActive ? 'text-sky-950' : 'text-slate-800'
                            }`}
                          >
                            {s.title || 'New Conversation'}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {formatSessionDate(s.updatedAt || s.createdAt)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSession(e, s.id)}
                            className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition active:scale-95"
                            title="Delete conversation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {lastMsg && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                          {lastMsg.sender === 'user' ? 'You: ' : 'Aistė: '}
                          {lastMsg.text}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-0.5">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3 text-slate-400" />
                          <span>
                            {messageCount} {messageCount === 1 ? 'message' : 'messages'}
                          </span>
                        </span>
                        {isActive && (
                          <span className="text-sky-700 font-bold bg-sky-100 px-2 py-0.5 rounded-full text-[9px]">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
