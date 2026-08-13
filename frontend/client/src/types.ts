export enum LessonDifficulty {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
}

export enum LessonCategory {
  ALPHABET = "alphabet",
  NUMBERS = "numbers",
  WORDS = "words",
}

export enum ProgressStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

export enum UserRole {
  STUDENT = "student",
  MENTOR = "mentor",
}

export interface Lesson {
  id: number;
  title: string;
  target_sign: string;
  description?: string;
  category?: LessonCategory | string;
  difficulty?: LessonDifficulty | string;
  xp_reward?: number;
  is_locked?: boolean;
}

export interface User {
  id: number;
  username: string;
  role: "student" | "mentor";
  xp_points: number;
  streak_days?: number;
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