// frontend/client/src/types/index.ts

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
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  expiresIn: number;
}

export type ProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: AuthToken;
  user: User;
}

export enum LessonDifficulty {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
}

export enum LessonCategory {
  ALPHABET = "ALPHABET",
  NUMBERS = "NUMBERS",
  PHRASES = "PHRASES",
  CONVERSATION = "CONVERSATION",
  GRAMMAR = "GRAMMAR",
}

export interface LessonStep {
  title: string;
  description: string;
  videoUrl?: string;
  tips?: string[];
}

export interface PracticeExercise {
  id: string;
  title: string;
  type: string;
}

export interface LessonContent {
  introduction: string;
  steps: LessonStep[];
  practiceExercises: PracticeExercise[];
  summary: string;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  signLabel: string;
  videoUrl?: string;
  difficulty?: LessonDifficulty | string;
  category?: LessonCategory | string;
  order: number;
  duration?: number;
  createdAt?: string;
  content?: LessonContent;
}

export interface Progress {
  id: string;
  userId: string;
  lessonId: string;
  status: ProgressStatus;
  accuracy: number;
  updatedAt?: string;
  completedAt?: string;
  lastAccessedAt?: string;
  exercisesCompleted?: number;
  totalExercises?: number;
  lesson?: Lesson;
}

export interface LeaderboardEntry {
  id: string;
  userId?: string;
  username: string;
  userName?: string;
  xp: number;
  totalXP?: number;
  streak?: number;
  currentStreak?: number;
  avatar?: string;
  userAvatar?: string;
  rank?: number;
  lessonsCompleted?: number;
  masteredLessons?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  unlockedAt?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
  explanation?: string;
}

export interface QuizResult {
  score: number;
  total: number;
  passed: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  online?: boolean;
}

export interface Student {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  xp: number;
  streak: number;
  createdAt?: string;
  totalLessons?: number;
  completedLessons?: number;
}

export interface Conversation {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

export interface ChatUser {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
  xp?: number;
  streak?: number;
}

export interface MentorStudent {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  xp: number;
  streak: number;
  createdAt?: string;
  totalLessons?: number;
  completedLessons?: number;
}