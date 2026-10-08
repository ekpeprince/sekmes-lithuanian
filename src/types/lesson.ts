export type ExerciseType = 
  | 'multiple_choice' 
  | 'word_bank_order' 
  | 'fill_in_the_blank' 
  | 'match_pairs'
  | 'dialogue_fill'
  | 'audio_dictation'
  | 'listening_multiple_choice'
  | 'speaking_pronounce';

export interface BaseExercise {
  id: string;
  type: ExerciseType;
  prompt: string;
  subPrompt?: string; // English sub-explanation / hint directly under the prompt
  explanation?: string;
  audioText?: string; // Lithuanian text to pronounce
}

export interface MultipleChoiceExercise extends BaseExercise {
  type: 'multiple_choice';
  options: string[];
  correctAnswer: string;
}

export interface WordBankExercise extends BaseExercise {
  type: 'word_bank_order';
  words: string[]; // Shuffled word tokens
  correctSequence: string[];
}

export interface FillInBlankExercise extends BaseExercise {
  type: 'fill_in_the_blank';
  sentenceWithBlank: string; // e.g., "Aš gyvenu ___."
  options: string[];
  correctAnswer: string;
}

export interface MatchPairsExercise extends BaseExercise {
  type: 'match_pairs';
  pairs: { id: string; lithuanian: string; english: string }[];
}

export interface DialogueFillExercise extends BaseExercise {
  type: 'dialogue_fill';
  dialogue: {
    speaker: string;
    avatar?: string;
    text: string;
    isBlank?: boolean;
    blankPrefix?: string;
    blankSuffix?: string;
  }[];
  options: string[];
  correctAnswer: string;
}

export interface AudioDictationExercise extends BaseExercise {
  type: 'audio_dictation';
  targetSentence: string;
  words: string[]; // Shuffled token bank for tapping or typing
  correctSequence: string[];
  translationHint?: string;
}

export interface ListeningMultipleChoiceExercise extends BaseExercise {
  type: 'listening_multiple_choice';
  audioDialogue?: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface SpeakingPronounceExercise extends BaseExercise {
  type: 'speaking_pronounce';
  targetPhrase: string;
  phoneticHint?: string;
  translation: string;
  acceptableVariations?: string[];
}

export type Exercise = 
  | MultipleChoiceExercise 
  | WordBankExercise 
  | FillInBlankExercise 
  | MatchPairsExercise
  | DialogueFillExercise
  | AudioDictationExercise
  | ListeningMultipleChoiceExercise
  | SpeakingPronounceExercise;

export interface Lesson {
  id: string;
  unitId: string;
  title: string;
  description: string;
  subExplanation?: string; // Concise English sub-explanation summarizing the key concept
  detailedExplanation?: string; // In-depth English study notes, grammar rules, and tips
  xpReward: number;
  exercises: Exercise[];
  icon?: string;
  order: number;
}

export interface Unit {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  color: string; // e.g. '#10b981', '#3b82f6', '#f59e0b'
  accentColor: string;
  lessons: Lesson[];
}

export interface Quest {
  id: string;
  title: string;
  englishTitle?: string;
  description: string;
  englishDescription?: string;
  icon: string;
  current: number;
  target: number;
  rewardXp: number;
  rewardGems: number;
  completed: boolean;
  claimed: boolean;
}

export interface MistakeItem {
  id: string;
  exercisePrompt: string;
  correctAnswer: string;
  userAnswer?: string;
  explanation?: string;
  audioText?: string;
  timestamp: number;
}

export interface UserProgress {
  xp: number;
  hearts: number;
  maxHearts: number;
  streak: number;
  completedLessons: string[];
  lastActiveDate: string;
  soundEnabled: boolean;
  gems: number;
  voiceGender?: 'female' | 'male';
  mistakesBank?: MistakeItem[];
  quests?: Quest[];
  leagueTier?: 'Geležis' | 'Bronza' | 'Sidabras' | 'Auksas' | 'Gintaras';
  leagueRank?: number;
  speedDrillHighScore?: number;
  streakFreezes?: number;
  mysteryChestClaimedDate?: string;
}

