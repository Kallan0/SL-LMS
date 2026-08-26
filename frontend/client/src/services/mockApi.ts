/**
 * MockApiService — Development-only mock backend.
 *
 * Returns realistic fake data so the frontend can be developed and tested
 * without a running backend server. All mutations are local-only (no persistence).
 *
 * Activate by setting VITE_USE_MOCK=true in the .env file, or it will be
 * used automatically when the production backend is unreachable.
 */

import type {
  User,
  Lesson,
  Progress,
  LeaderboardEntry,
  Achievement,
  QuizQuestion,
  QuizResult,
  LoginResponse,
  ProgressStatus,
  Conversation,
  Message,
  ChatUser,
  MentorStudent,
} from "@/types/index";
import type { IApiService } from "./api";

// ─── Fake Data ──────────────────────────────────────────────────────────────

const MOCK_USERS: Record<string, { password: string; user: User }> = {
  "student@example.com": {
    password: "password",
    user: {
      id: "user-1",
      email: "student@example.com",
      username: "alice_signs",
      firstName: "Alice",
      lastName: "Johnson",
      bio: "Learning Indian Sign Language for 3 months",
      avatar: "https://ui-avatars.com/api/?name=Alice+Johnson&background=6366f1&color=fff",
      role: "STUDENT",
      xp: 2450,
      streak: 12,
    },
  },
  "mentor@example.com": {
    password: "password",
    user: {
      id: "user-2",
      email: "mentor@example.com",
      username: "bob_mentor",
      firstName: "Bob",
      lastName: "Smith",
      bio: "Certified ISL instructor with 5 years of experience",
      avatar: "https://ui-avatars.com/api/?name=Bob+Smith&background=22c55e&color=fff",
      role: "MENTOR",
      xp: 15200,
      streak: 45,
    },
  },
};

const MOCK_LESSONS: Lesson[] = [
  {
    id: "l-1",
    title: "Introduction to ISL",
    description: "Learn the basics of Indian Sign Language alphabet — the foundation of all ISL communication.",
    signLabel: "A",
    videoUrl: "https://www.youtube.com/embed/kIHz7002YKA",
    difficulty: "BEGINNER",
    category: "ALPHABET",
    order: 1,
    duration: 12,
  },
  {
    id: "l-2",
    title: "Alphabet A–E",
    description: "Master the first five letters of the ISL alphabet with clear demonstrations.",
    signLabel: "B",
    videoUrl: "https://www.youtube.com/embed/qcdivQfA41Y",
    difficulty: "BEGINNER",
    category: "ALPHABET",
    order: 2,
    duration: 15,
  },
  {
    id: "l-3",
    title: "Alphabet F–J",
    description: "Continue building your alphabet knowledge with F through J.",
    signLabel: "C",
    videoUrl: "https://www.youtube.com/embed/ExBuk-V5kN8",
    difficulty: "BEGINNER",
    category: "ALPHABET",
    order: 3,
    duration: 12,
  },
  {
    id: "l-4",
    title: "Numbers 1–10",
    description: "Learn to count from one to ten in Indian Sign Language.",
    signLabel: "1",
    videoUrl: "https://www.youtube.com/embed/ilpGSy6JdNA",
    difficulty: "BEGINNER",
    category: "NUMBERS",
    order: 4,
    duration: 10,
  },
  {
    id: "l-5",
    title: "Common Greetings",
    description: "Say hello, goodbye, thank you, and other essential greetings in ISL.",
    signLabel: "Hi",
    videoUrl: "https://www.youtube.com/embed/5vHmvYA8Z6Q",
    difficulty: "BEGINNER",
    category: "PHRASES",
    order: 5,
    duration: 14,
  },
  {
    id: "l-6",
    title: "Self Introduction",
    description: "Learn to introduce yourself — your name, where you're from, and what you do.",
    signLabel: "Me",
    videoUrl: "https://www.youtube.com/embed/mc_NxVJlhi8",
    difficulty: "INTERMEDIATE",
    category: "PHRASES",
    order: 6,
    duration: 18,
  },
  {
    id: "l-7",
    title: "Asking Questions",
    description: "Learn how to ask who, what, where, when, and how in ISL.",
    signLabel: "?",
    videoUrl: "https://www.youtube.com/embed/VtbYvVDItvg",
    difficulty: "INTERMEDIATE",
    category: "GRAMMAR",
    order: 7,
    duration: 16,
  },
  {
    id: "l-8",
    title: "Daily Conversations",
    description: "Practice everyday conversations — ordering food, asking directions, and more.",
    signLabel: "Talk",
    videoUrl: "https://www.youtube.com/embed/aOL-yBRQHmM",
    difficulty: "INTERMEDIATE",
    category: "CONVERSATION",
    order: 8,
    duration: 22,
  },
  {
    id: "l-9",
    title: "Advanced Grammar",
    description: "Complex sentence structures, topic-comment order, and facial expressions in ISL.",
    signLabel: "G",
    videoUrl: "https://www.youtube.com/embed/LpLM-8Uj1Bc",
    difficulty: "ADVANCED",
    category: "GRAMMAR",
    order: 9,
    duration: 25,
  },
  {
    id: "l-10",
    title: "Storytelling in ISL",
    description: "Tell stories fluently using ISL — learn narrative techniques and role-shifting.",
    signLabel: "📖",
    videoUrl: "https://www.youtube.com/embed/ElWbxBtNOeY",
    difficulty: "ADVANCED",
    category: "CONVERSATION",
    order: 10,
    duration: 30,
  },
];

const MOCK_PROGRESS: Progress[] = [
  { id: "p-1", userId: "user-1", lessonId: "l-1", status: "COMPLETED", accuracy: 95, updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(), completedAt: new Date(Date.now() - 6 * 86400000).toISOString() },
  { id: "p-2", userId: "user-1", lessonId: "l-2", status: "COMPLETED", accuracy: 88, updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(), completedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: "p-3", userId: "user-1", lessonId: "l-3", status: "IN_PROGRESS", accuracy: 60, updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(), lastAccessedAt: new Date(Date.now() - 2 * 86400000).toISOString(), exercisesCompleted: 2, totalExercises: 5 },
  { id: "p-4", userId: "user-1", lessonId: "l-4", status: "COMPLETED", accuracy: 100, updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(), completedAt: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: "p-5", userId: "user-1", lessonId: "l-5", status: "NOT_STARTED", accuracy: 0, updatedAt: new Date(Date.now() - 86400000).toISOString() },
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: "user-3", userId: "user-3", username: "charlie_pro", userName: "Charlie Davis", xp: 12500, totalXP: 12500, streak: 30, currentStreak: 30, rank: 1, avatar: "https://ui-avatars.com/api/?name=Charlie+Davis&background=f59e0b&color=fff", userAvatar: "https://ui-avatars.com/api/?name=Charlie+Davis&background=f59e0b&color=fff", lessonsCompleted: 24, masteredLessons: 18 },
  { id: "user-2", userId: "user-2", username: "bob_mentor", userName: "Bob Smith", xp: 15200, totalXP: 15200, streak: 45, currentStreak: 45, rank: 2, avatar: "https://ui-avatars.com/api/?name=Bob+Smith&background=22c55e&color=fff", userAvatar: "https://ui-avatars.com/api/?name=Bob+Smith&background=22c55e&color=fff", lessonsCompleted: 28, masteredLessons: 22 },
  { id: "user-1", userId: "user-1", username: "alice_signs", userName: "Alice Johnson", xp: 2450, totalXP: 2450, streak: 12, currentStreak: 12, rank: 3, avatar: "https://ui-avatars.com/api/?name=Alice+Johnson&background=6366f1&color=fff", userAvatar: "https://ui-avatars.com/api/?name=Alice+Johnson&background=6366f1&color=fff", lessonsCompleted: 4, masteredLessons: 3 },
  { id: "user-4", userId: "user-4", username: "diana_learner", userName: "Diana Lee", xp: 1800, totalXP: 1800, streak: 8, currentStreak: 8, rank: 4, avatar: "https://ui-avatars.com/api/?name=Diana+Lee&background=ef4444&color=fff", userAvatar: "https://ui-avatars.com/api/?name=Diana+Lee&background=ef4444&color=fff", lessonsCompleted: 3, masteredLessons: 2 },
  { id: "user-5", userId: "user-5", username: "eric_newbie", userName: "Eric Zhang", xp: 600, totalXP: 600, streak: 3, currentStreak: 3, rank: 5, avatar: "https://ui-avatars.com/api/?name=Eric+Zhang&background=8b5cf6&color=fff", userAvatar: "https://ui-avatars.com/api/?name=Eric+Zhang&background=8b5cf6&color=fff", lessonsCompleted: 1, masteredLessons: 0 },
];

const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: "a-1", name: "First Steps", description: "Complete your first lesson", icon: "🎯", unlockedAt: new Date(Date.now() - 6 * 86400000).toISOString() },
  { id: "a-2", name: "Alphabet Master", description: "Complete all alphabet lessons", icon: "🔤" },
  { id: "a-3", name: "Week Warrior", description: "Maintain a 7-day streak", icon: "🔥", unlockedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: "a-4", name: "Perfect Score", description: "Get 100% accuracy on a quiz", icon: "💯" },
  { id: "a-5", name: "Social Butterfly", description: "Send your first message", icon: "🦋" },
];

const MOCK_QUIZ: QuizQuestion[] = [
  { id: "q-1", question: "What does the ISL sign for 'A' look like?", options: [{ id: "o-1", text: "Open palm facing forward" }, { id: "o-2", text: "Closed fist with thumb up" }, { id: "o-3", text: "Flat hand with fingers together" }], correctAnswer: "o-1", explanation: "In ISL, the letter A is signed with an open palm facing forward, fingers together." },
  { id: "q-2", question: "How do you sign 'Thank you' in ISL?", options: [{ id: "o-4", text: "Wave hand" }, { id: "o-5", text: "Touch chin and move hand forward" }, { id: "o-6", text: "Cross arms over chest" }], correctAnswer: "o-5", explanation: "Thank you is signed by touching the fingertips to the chin and moving the hand forward and down." },
  { id: "q-3", question: "What is the sign for the number '5'?", options: [{ id: "o-7", text: "Five fingers spread wide" }, { id: "o-8", text: "Closed fist" }, { id: "o-9", text: "Index finger pointing up" }], correctAnswer: "o-7", explanation: "The number 5 is signed by holding up the hand with all five fingers spread wide." },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let tokenCounter = 0;
function generateToken(): string {
  tokenCounter++;
  return `mock-jwt-${Date.now()}-${tokenCounter}`;
}

const JWT_STORAGE_KEY = import.meta.env.VITE_JWT_STORAGE_KEY ?? "sign_language_lms_token";

function storeToken(token: string): void {
  try { localStorage.setItem(JWT_STORAGE_KEY, token); } catch { /* ignore */ }
}

function clearStoredToken(): void {
  try { localStorage.removeItem(JWT_STORAGE_KEY); } catch { /* ignore */ }
}

const AVATAR_STORAGE_PREFIX = "isl_user_avatar_";

function storeAvatar(userId: string, avatar: string): void {
  try { localStorage.setItem(AVATAR_STORAGE_PREFIX + userId, avatar); } catch { /* ignore */ }
}

function getStoredAvatar(userId: string): string | undefined {
  try { return localStorage.getItem(AVATAR_STORAGE_PREFIX + userId) || undefined; } catch { return undefined; }
}

// ─── MockApiService ─────────────────────────────────────────────────────────

export class MockApiService implements IApiService {
  private currentUserId: string | null = null;

  // ── Auth ──────────────────────────────────────────────────────────────

  async login(email: string, _password: string): Promise<LoginResponse> {
    await delay(400);
    const entry = MOCK_USERS[email];
    if (!entry) throw new Error("Invalid credentials");
    this.currentUserId = entry.user.id;
    const token = generateToken();
    storeToken(token);
    return {
      token: { access_token: token, token_type: "bearer", expiresIn: 86400 },
      user: entry.user,
    };
  }

  async register(email: string, username: string, _password: string, role: string, firstName: string, lastName: string): Promise<any> {
    await delay(400);
    const id = `user-${Date.now()}`;
    const user: User = {
      id,
      email,
      username,
      firstName,
      lastName,
      role: role === "mentor" ? "MENTOR" : "STUDENT",
      xp: 0,
      streak: 0,
    };
    this.currentUserId = id;
    const token = generateToken();
    storeToken(token);
    return { user, token: { access_token: token, token_type: "bearer", expiresIn: 86400 } };
  }

  async logout(): Promise<{ success: boolean }> {
    await delay(200);
    this.currentUserId = null;
    clearStoredToken();
    return { success: true };
  }

  async getCurrentUser(): Promise<User> {
    await delay(300);
    // Support both in-memory and localStorage-based auth
    if (!this.currentUserId) {
      // Check if there's a stored token (from a previous session)
      const stored = localStorage.getItem(JWT_STORAGE_KEY);
      if (!stored) throw new Error("Not authenticated");
      // Find the first mock user as a fallback for mock tokens
      const entry = Object.values(MOCK_USERS).find((e) => e.user.id === this.currentUserId);
      if (entry) {
        const avatar = getStoredAvatar(entry.user.id);
        return avatar ? { ...entry.user, avatar } : entry.user;
      }
      // For any mock token, return the student user
      this.currentUserId = MOCK_USERS["student@example.com"].user.id;
      const studentAvatar = getStoredAvatar(this.currentUserId);
      return studentAvatar ? { ...MOCK_USERS["student@example.com"].user, avatar: studentAvatar } : MOCK_USERS["student@example.com"].user;
    }
    const entry = Object.values(MOCK_USERS).find((e) => e.user.id === this.currentUserId);
    if (!entry) throw new Error("User not found");
    const avatar = getStoredAvatar(this.currentUserId);
    return avatar ? { ...entry.user, avatar } : entry.user;
  }

  // ── Lessons ───────────────────────────────────────────────────────────

  async getLessons(): Promise<Lesson[]> {
    await delay(300);
    return MOCK_LESSONS;
  }

  async getLesson(id: string): Promise<Lesson> {
    await delay(200);
    const lesson = MOCK_LESSONS.find((l) => l.id === id);
    if (!lesson) throw new Error("Lesson not found");
    return {
      ...lesson,
      content: {
        introduction: `Welcome to "${lesson.title}". In this lesson you will learn key concepts and practice with interactive exercises.`,
        steps: [
          { title: "Watch & Observe", description: "Watch the instructor demonstrate the signs carefully.", tips: ["Focus on hand shape", "Notice the movement direction"] },
          { title: "Practice Along", description: "Try copying the signs shown in the video.", tips: ["Use a mirror to check your form", "Go slow at first"] },
          { title: "Test Yourself", description: "Complete the exercises to test your understanding." },
        ],
        practiceExercises: [
          { id: "ex-1", title: "Sign Recognition", type: "video" },
          { id: "ex-2", title: "Letter Matching", type: "matching" },
          { id: "ex-3", title: "Free Practice", type: "webcam" },
        ],
        summary: `Great job completing "${lesson.title}"! Keep practicing to build muscle memory.`,
      },
    };
  }

  // ── Progress ──────────────────────────────────────────────────────────

  async getProgress(): Promise<Progress[]> {
    await delay(300);
    return MOCK_PROGRESS.filter((p) => p.userId === this.currentUserId);
  }

  async getLessonProgress(lessonId: string): Promise<Progress> {
    await delay(200);
    const progress = MOCK_PROGRESS.find((p) => p.lessonId === lessonId && p.userId === this.currentUserId);
    if (!progress) throw new Error("No progress found");
    return progress;
  }

  async updateProgress(lessonId: string, status: ProgressStatus, accuracy?: number): Promise<Progress> {
    await delay(300);
    const existing = MOCK_PROGRESS.find((p) => p.lessonId === lessonId && p.userId === this.currentUserId);
    if (existing) {
      existing.status = status;
      if (accuracy !== undefined) existing.accuracy = accuracy;
      existing.updatedAt = new Date().toISOString();
      return existing;
    }
    const newProgress: Progress = {
      id: `p-${Date.now()}`,
      userId: this.currentUserId || "",
      lessonId,
      status,
      accuracy: accuracy ?? 0,
      updatedAt: new Date().toISOString(),
    };
    MOCK_PROGRESS.push(newProgress);
    return newProgress;
  }

  // ── Leaderboard ───────────────────────────────────────────────────────

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    await delay(400);
    return MOCK_LEADERBOARD;
  }

  // ── Achievements ──────────────────────────────────────────────────────

  async getAchievements(): Promise<Achievement[]> {
    await delay(300);
    return MOCK_ACHIEVEMENTS;
  }

  // ── Quiz ──────────────────────────────────────────────────────────────

  async getQuizQuestions(_lessonId: string): Promise<QuizQuestion[]> {
    await delay(300);
    return MOCK_QUIZ;
  }

  async submitQuiz(_lessonId: string, _answers: Record<string, string>): Promise<QuizResult> {
    await delay(400);
    const correct = MOCK_QUIZ.filter((q) => q.correctAnswer === (_answers[q.id] || "")).length;
    return {
      score: Math.round((correct / MOCK_QUIZ.length) * 100),
      total: MOCK_QUIZ.length,
      passed: correct / MOCK_QUIZ.length >= 0.7,
    };
  }

  // ── Profile ───────────────────────────────────────────────────────────

  async updateProfile(updates: Partial<User>): Promise<User> {
    await delay(300);
    const entry = Object.values(MOCK_USERS).find((e) => e.user.id === this.currentUserId);
    if (!entry) throw new Error("Not authenticated");
    Object.assign(entry.user, updates);
    // Persist avatar to localStorage so it survives page reloads and re-logins
    if (updates.avatar !== undefined && this.currentUserId) {
      storeAvatar(this.currentUserId, updates.avatar);
    }
    const storedAvatar = this.currentUserId ? getStoredAvatar(this.currentUserId) : undefined;
    return { ...entry.user, avatar: storedAvatar || entry.user.avatar };
  }

  // ── Lesson CRUD (mentor) ─────────────────────────────────────────────

  async createLesson(lesson: Partial<Lesson>): Promise<Lesson> {
    await delay(300);
    const newLesson: Lesson = {
      id: `l-${Date.now()}`,
      title: lesson.title || "Untitled Lesson",
      description: lesson.description || undefined,
      signLabel: lesson.signLabel || "",
      videoUrl: lesson.videoUrl || undefined,
      difficulty: lesson.difficulty || undefined,
      category: lesson.category || undefined,
      order: lesson.order ?? MOCK_LESSONS.length + 1,
      duration: lesson.duration || 10,
    };
    MOCK_LESSONS.push(newLesson);
    return newLesson;
  }

  async updateLesson(id: string, updates: Partial<Lesson>): Promise<Lesson> {
    await delay(300);
    const idx = MOCK_LESSONS.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error("Lesson not found");
    Object.assign(MOCK_LESSONS[idx], updates);
    return MOCK_LESSONS[idx];
  }

  async deleteLesson(id: string): Promise<{ success: boolean }> {
    await delay(300);
    const idx = MOCK_LESSONS.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error("Lesson not found");
    MOCK_LESSONS.splice(idx, 1);
    return { success: true };
  }

  // ── Mentor endpoints ─────────────────────────────────────────────────

  async getMentorStudents(): Promise<MentorStudent[]> {
    await delay(300);
    // Return all non-mentor users with progress stats
    return Object.values(MOCK_USERS)
      .filter((e) => e.user.role !== "MENTOR")
      .map((e) => {
        const userProgress = MOCK_PROGRESS.filter((p) => p.userId === e.user.id);
        const completed = userProgress.filter((p) => p.status === "COMPLETED").length;
        return {
          id: e.user.id,
          email: e.user.email || "",
          username: e.user.username,
          firstName: e.user.firstName || "",
          lastName: e.user.lastName || "",
          xp: e.user.xp || 0,
          streak: e.user.streak || 0,
          totalLessons: MOCK_LESSONS.length,
          completedLessons: completed,
        };
      });
  }

  async getStudentProgress(studentId: string): Promise<{ student: MentorStudent; progress: any[] }> {
    await delay(300);
    const entry = Object.values(MOCK_USERS).find((e) => e.user.id === studentId);
    if (!entry) throw new Error("Student not found");
    const userProgress = MOCK_PROGRESS.filter((p) => p.userId === studentId).map((p) => {
      const lesson = MOCK_LESSONS.find((l) => l.id === p.lessonId);
      return { ...p, lesson };
    });
    const completed = userProgress.filter((p) => p.status === "COMPLETED").length;
    return {
      student: {
        id: entry.user.id,
        email: entry.user.email || "",
        username: entry.user.username,
        firstName: entry.user.firstName || "",
        lastName: entry.user.lastName || "",
        xp: entry.user.xp || 0,
        streak: entry.user.streak || 0,
        totalLessons: MOCK_LESSONS.length,
        completedLessons: completed,
      },
      progress: userProgress,
    };
  }

  // ── Chat ──────────────────────────────────────────────────────────────

  private mockMessages: Message[] = [
    { id: "m-1", senderId: "user-1", receiverId: "user-2", content: "Hi! I have a question about the alphabet lesson.", read: true, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: "m-2", senderId: "user-2", receiverId: "user-1", content: "Sure, Alice! What do you need help with?", read: true, createdAt: new Date(Date.now() - 3500000).toISOString() },
    { id: "m-3", senderId: "user-1", receiverId: "user-2", content: "I'm struggling with the difference between K and V signs.", read: true, createdAt: new Date(Date.now() - 3400000).toISOString() },
    { id: "m-4", senderId: "user-2", receiverId: "user-1", content: "Great question! For K, the index and middle fingers point up with the thumb between them. For V, they spread apart wider. Try practicing in front of a mirror.", read: false, createdAt: new Date(Date.now() - 3300000).toISOString() },
    { id: "m-5", senderId: "user-1", receiverId: "user-2", content: "Thank you so much! That really helps. 🙏", read: true, createdAt: new Date(Date.now() - 3200000).toISOString() },
    { id: "m-6", senderId: "user-3", receiverId: "user-1", content: "Hey Alice, congrats on your 12-day streak!", read: false, createdAt: new Date(Date.now() - 1800000).toISOString() },
  ];

  async getConversations(): Promise<Conversation[]> {
    await delay(200);
    const userId = this.currentUserId;
    if (!userId) return [];

    // Find all unique chat partners
    const partnerIdSet = new Set<string>();
    for (const msg of this.mockMessages) {
      if (msg.senderId === userId) partnerIdSet.add(msg.receiverId);
      if (msg.receiverId === userId) partnerIdSet.add(msg.senderId);
    }
    const partnerIds = Array.from(partnerIdSet);

    const conversations: Conversation[] = [];
    for (const partnerId of partnerIds) {
      const partner = Object.values(MOCK_USERS).find((e) => e.user.id === partnerId);
      if (!partner) continue;
      const msgs = this.mockMessages.filter(
        (m) => (m.senderId === userId && m.receiverId === partnerId) || (m.senderId === partnerId && m.receiverId === userId)
      ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const lastMsg = msgs[msgs.length - 1];
      const unread = msgs.filter((m) => m.receiverId === userId && !m.read).length;
      conversations.push({
        id: partner.user.id,
        username: partner.user.username,
        firstName: partner.user.firstName || undefined,
        lastName: partner.user.lastName || undefined,
        role: partner.user.role,
        lastMessage: lastMsg?.content || undefined,
        lastMessageAt: lastMsg?.createdAt || undefined,
        unreadCount: unread,
      });
    }
    return conversations.sort((a, b) => {
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });
  }

  async getMessages(userId: string): Promise<Message[]> {
    await delay(150);
    const myId = this.currentUserId;
    if (!myId) return [];
    // Mark messages from this user as read
    for (const msg of this.mockMessages) {
      if (msg.senderId === userId && msg.receiverId === myId && !msg.read) {
        msg.read = true;
      }
    }
    return this.mockMessages
      .filter(
        (m) => (m.senderId === myId && m.receiverId === userId) || (m.senderId === userId && m.receiverId === myId)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async sendMessage(receiverId: string, content: string): Promise<Message> {
    await delay(100);
    const myId = this.currentUserId;
    if (!myId) throw new Error("Not authenticated");
    const msg: Message = {
      id: `m-${Date.now()}`,
      senderId: myId,
      receiverId,
      content,
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.mockMessages.push(msg);
    return msg;
  }

  async getAllUsers(): Promise<ChatUser[]> {
    await delay(200);
    const myId = this.currentUserId;
    return Object.values(MOCK_USERS)
      .filter((e) => e.user.id !== myId)
      .map((e) => ({
        id: e.user.id,
        username: e.user.username,
        firstName: e.user.firstName,
        lastName: e.user.lastName,
        role: e.user.role,
        xp: e.user.xp,
        streak: e.user.streak,
      }));
  }

  async sendHeartbeat(): Promise<void> {
    await delay(50);
    // No-op in mock mode
  }
}
