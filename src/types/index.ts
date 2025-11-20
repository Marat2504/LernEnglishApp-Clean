// src/types/index.ts

// --- User ---
export interface User {
  id: string;
  email: string;
  username?: string;
  avatarUrl?: string;
  currentLanguageLevel: string; // e.g. "A1"
  createdAt: string; // ISO string
  updatedAt: string;
  deletedAt?: string | null;
}

// --- Card ---
export interface Card {
  id: string;
  userId: string;
  englishWord: string;
  russianTranslation: string;
  notes?: string | null;
  audioUrl?: string | null;
  isLearned: boolean;
  difficultyLevel?: string | null; // e.g. "A1", "B2"
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  cardTags?: CardTag[]; // связи с тегами
}

// DTO для создания карточки (CreateCardDto)
export interface CreateCardDto {
  englishWord: string;
  russianTranslation: string;
  notes?: string;
  audioUrl?: string;
  difficultyLevel?: string;
  isLearned?: boolean;
}

// --- Tag ---
export interface Tag {
  id: string;
  userId?: string | null; // null для предустановленных тегов
  name: string;
  isPredefined: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// DTO для создания тега
export interface CreateTagDto {
  name: string;
  isPredefined?: boolean;
}

// --- CardTag (связь многие-ко-многим) ---
export interface CardTag {
  cardId: string;
  tagId: string;
  assignedAt: string;

  tag: Tag; // вложенный тег
}

// --- CardProgress ---
export enum StudyMode {
  SPEED = 'SPEED',
  QUIZ = 'QUIZ',
  MATCHING = 'MATCHING',
  LISTENING = 'LISTENING',
  LIGHTNING = 'LIGHTNING',
  STORIES = 'STORIES',
}

export interface CardProgress {
  id: string;
  cardId: string;
  userId: string;
  mode: StudyMode;
  correctAnswers: number;
  incorrectAnswers: number;
  lastAttempt: string;
}

// --- UserStats ---
export interface UserStats {
  userId: string;
  totalXp: number;
  currentLevel: number;
  totalWords: number;
  learnedWords: number;
  wordsViewedToday: number;
  wordsLearnedToday: number;
  cardsAddedToday: number;
  timeSpentSec: number;
  timeSpentTodaySec: number;
  storiesReadToday: number;
  lastDailyReset: string;
  currentLanguageLevel: string;
}

// --- Achievement ---
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  threshold?: number | null;
  category: string;
  isSecret: boolean;
  deletedAt?: string | null;
}

// --- UserAchievement ---
export interface UserAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: string;
  progress: number;
}

// --- MissionType enum ---
export enum MissionType {
  LEARN_WORDS = 'LEARN_WORDS',
  QUIZ_MODE = 'QUIZ_MODE',
  LIGHTNING_MODE = 'LIGHTNING_MODE',
  REPEAT_TAG = 'REPEAT_TAG',
  ADD_CARDS = 'ADD_CARDS',
  READ_STORIES = 'READ_STORIES',
  ANSWER_STORY_QUESTIONS = 'ANSWER_STORY_QUESTIONS',
}

// --- Mission ---
export interface Mission {
  id: string;
  name: string;
  description: string;
  type: MissionType;
  targetValue: number;
  rewardXp: number;
  rewardBadgeId?: string | null;
  deletedAt?: string | null;
}

// --- UserMission ---
export interface UserMission {
  userId: string;
  missionId: string;
  assignedAt: string;
  completedAt?: string | null;
  progress: number;
  isCompleted: boolean;
  isSkipped: boolean;
}

// --- Quote ---
export interface Quote {
  id: string;
  englishText: string;
  russianTranslation: string;
  grammarExplanation?: string | null;
  miniChallenge?: string | null;
  author?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  displayDate?: string | null;
  deletedAt?: string | null;
}

// --- UserFavoriteQuote ---
export interface UserFavoriteQuote {
  userId: string;
  quoteId: string;
  favoritedAt: string;
}

// --- ChatDialog ---
export interface ChatDialog {
  id: string;
  userId: string;
  topic?: string | null;
  difficulty?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// --- MessageSender enum ---
export enum MessageSender {
  USER = 'USER',
  AI = 'AI',
}

// --- ChatMessage ---
export interface ChatMessage {
  id: string;
  dialogId: string;
  sender: MessageSender;
  text: string;
  audioUrl?: string | null;
  correction?: string | null;
  explanation?: string | null;
  createdAt: string;
}

// --- Story ---
export interface Story {
  id: string;
  title: string;
  englishText: string;
  imageUrl?: string | null;
  difficultyLevel: string;
  source?: string | null;
  createdAt: string;
  updatedAt: string;
  isAiGenerated: boolean;
  isApproved: boolean;
  deletedAt?: string | null;
}

// --- StoryQuestion ---
export interface StoryQuestion {
  id: string;
  storyId: string;
  questionText: string;
  correctAnswer: string;
  option1: string;
  option2: string;
  option3: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// --- UserStoryProgress ---
export interface UserStoryProgress {
  userId: string;
  storyId: string;
  lastViewedAt: string;
  isCompleted: boolean;
  correctAnswersCount: number;
  incorrectAnswersCount: number;
}

// --- Study ---
export interface CardResultDto {
  cardId: string;
  isCorrect: boolean;
  timeSpentMs?: number;
}

export interface SessionResultDto {
  mode: StudyMode;
  cardResults: CardResultDto[];
  totalTimeSpentSec: number;
}

// --- DailyMission ---
export interface DailyMission {
  id: string;
  name: string;
  description: string;
  type: string;
  targetValue: number;
  rewardXp: number;
  progress: number;
  assignedAt: string;
}
