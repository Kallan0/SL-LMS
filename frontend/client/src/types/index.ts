// frontend/client/src/types/index.ts


export type role = "STUDENT" | "MENTOR"

export enum ProgressStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export interface User {
  id: string;
  email?: string;
  username: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  role: string;
  xp?: number;
  streak?: number;
  totalXP?: number;
  currentStreak?: number;
  longestStreak?: number;
  joinedDate?: string;
  createdAt?: string;
  preferences?: {
    theme?: string;
    language?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
      lessonsReminder?: boolean;
    };
    accessibility?: {
      captions?: boolean;
      highContrast?: boolean;
      textSize?: string;
    };
  };
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  expiresIn: number;
  
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface LoginResponse {
  user: User;
  token: AuthToken;
}

export interface Progress {
  id?: string;
  userId: string;
  lessonId: string;
  status: ProgressStatus;
  accuracy?: number;
  startedAt?: string;
  completedAt?: string;
  lastAccessedAt?: string;
  xpEarned?: number;
  exercisesCompleted?: number;
  totalExercises?: number;
  notes?: string;
  updatedAt?: string;
}

export enum LessonDifficulty {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
}

export enum LessonCategory {
  ALPHABET = "alphabet",
  NUMBERS = "numbers",
  WORDS = "words",
  PHRASES = "phrases",
  CONVERSATION = "conversation",
  GRAMMAR = "grammar",
}


export enum UserRole {
  STUDENT = "student",
  MENTOR = "mentor",
}

export interface Lesson {
  id: string;
  title: string;
  target_sign?: string;
  description?: string;
  category?: LessonCategory | string;
  difficulty?: LessonDifficulty | string;
  xp_reward?: number;
  is_locked?: boolean;
  signLabel?: string;
  order?: number;
  duration?: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  estimatedCompletionTime?: number;
  prerequisites?: string[];
  createdAt?: string;
  updatedAt?: string;
  content?: {
    introduction?: string;
    steps?: {
      id: string;
      title: string;
      description: string;
      videoUrl?: string;
      tips?: string[];
      order: number;
    }[];
    practiceExercises?: {
      id: string;
      title: string;
      description: string;
      type: string;
      difficulty?: LessonDifficulty | string;
      instructions?: string;
    }[];
    summary?: string;
  };
}


export interface UserProgress {
  id: number;
  user_id: number;
  lesson_id: number;
  is_passed: boolean;
  completed_at?: string;
}

export interface GestureSubmission {
  lesson_id: number;
  features: number[];
}

export interface GestureResponse {
  target_sign: string;
  ai_prediction: string;
  confidence: number;
  is_correct: boolean;
  message: string;
  xp_awarded: number;
} 

export interface LeaderboardEntry {
  id: string;
  username: string;
  xp: number;
  streak: number;
  avatar?: string | null;
  // Fields used by Leaderboard.tsx
  userId?: string;
  rank?: number;
  userName?: string;
  userAvatar?: string;
  totalXP?: number;
  lessonsCompleted?: number;
  currentStreak?: number;
  masteredLessons?: number;
}

// --- QUIZ & ACHIEVEMENTS ---
export interface Achievement {
  id: string;
  title?: string;
  name?: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  rarity?: string;
}

export interface QuizQuestion {
  id: string;
  lessonId: string;
  question: string;
  options: string[] | { id: string; text: string }[];
  correctAnswer?: string;
  correctAnswerId?: string;
  explanation?: string;
  type?: string;
  difficulty?: LessonDifficulty | string;
}

export interface QuizResult {
  score: number;
  total: number;
  passed: boolean;
}