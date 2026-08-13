/**
 * Mock Data Service
 * 
 * Provides realistic mock data for the Sign Language LMS application.
 * This service can be easily swapped for real API calls by replacing
 * the implementation without changing the UI components.
 */

import {
  User,
  Lesson,
  Progress,
  LeaderboardEntry,
  QuizQuestion,
  Achievement,
  UserRole,
  LessonDifficulty,
  LessonCategory,
  ProgressStatus,
} from "@/types";

/**
 * Mock user data - Student
 */
export const mockStudentUser: User = {
  id: "user_001",
  email: "john.doe@example.com",
  firstName: "John",
  lastName: "Doe",
  role: UserRole.STUDENT,
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
  bio: "Passionate about learning sign language!",
  joinedDate: "2024-01-15T10:30:00Z",
  totalXP: 4850,
  currentStreak: 12,
  longestStreak: 28,
  preferences: {
    theme: "dark",
    language: "en",
    notifications: {
      email: true,
      push: true,
      lessonsReminder: true,
    },
    accessibility: {
      captions: true,
      highContrast: false,
      textSize: "normal",
    },
  },
};

/**
 * Mock user data - Mentor
 */
export const mockMentorUser: User = {
  id: "user_002",
  email: "sarah.mentor@example.com",
  firstName: "Sarah",
  lastName: "Johnson",
  role: UserRole.MENTOR,
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  bio: "Certified sign language instructor with 10+ years of experience",
  joinedDate: "2023-06-01T08:00:00Z",
  totalXP: 15420,
  currentStreak: 45,
  longestStreak: 120,
  preferences: {
    theme: "dark",
    language: "en",
    notifications: {
      email: true,
      push: true,
      lessonsReminder: true,
    },
    accessibility: {
      captions: true,
      highContrast: false,
      textSize: "normal",
    },
  },
};

/**
 * Mock lessons data
 */
export const mockLessons: Lesson[] = [
  {
    id: "lesson_001",
    title: "ASL Alphabet Basics",
    description: "Learn the fundamentals of American Sign Language alphabet with hand shapes and positions.",
    category: LessonCategory.ALPHABET,
    difficulty: LessonDifficulty.BEGINNER,
    duration: 15,
    videoUrl: "https://example.com/videos/asl-alphabet.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1599839236571-2a4eae2c9a25?w=400&h=300&fit=crop",
    content: {
      introduction: "In this lesson, you'll learn the complete ASL alphabet from A to Z.",
      steps: [
        {
          id: "step_001",
          title: "Hand Shape Fundamentals",
          description: "Understanding the basic hand shapes used in ASL",
          videoUrl: "https://example.com/videos/hand-shapes.mp4",
          tips: ["Keep your wrist straight", "Position your hand at chest level"],
          order: 1,
        },
        {
          id: "step_002",
          title: "Letter A-E",
          description: "Practice the first five letters of the alphabet",
          videoUrl: "https://example.com/videos/letters-a-e.mp4",
          tips: ["Start with A - closed fist", "E - fingers together, palm facing you"],
          order: 2,
        },
        {
          id: "step_003",
          title: "Letter F-J",
          description: "Continue with letters F through J",
          videoUrl: "https://example.com/videos/letters-f-j.mp4",
          order: 3,
        },
      ],
      practiceExercises: [
        {
          id: "ex_001",
          title: "Alphabet Recognition",
          description: "Watch videos and identify the letters",
          type: "video_comparison",
          difficulty: LessonDifficulty.BEGINNER,
          instructions: "Watch each video and select the correct letter from the options",
        },
        {
          id: "ex_002",
          title: "Letter Spelling Quiz",
          description: "Spell words using sign language",
          type: "quiz",
          difficulty: LessonDifficulty.BEGINNER,
          instructions: "Answer questions about letter formation",
        },
      ],
      summary: "You've learned the ASL alphabet! Practice regularly to improve your speed and accuracy.",
    },
    estimatedCompletionTime: 20,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-01T00:00:00Z",
  },
  {
    id: "lesson_002",
    title: "Numbers 1-10",
    description: "Master counting and number formation in American Sign Language.",
    category: LessonCategory.NUMBERS,
    difficulty: LessonDifficulty.BEGINNER,
    duration: 12,
    videoUrl: "https://example.com/videos/numbers-1-10.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1516321318423-f06f70674b6e?w=400&h=300&fit=crop",
    content: {
      introduction: "Learn how to sign numbers 1 through 10 in ASL.",
      steps: [
        {
          id: "step_004",
          title: "Number Formation",
          description: "Basic hand positions for numbers",
          order: 1,
        },
        {
          id: "step_005",
          title: "Practice Counting",
          description: "Count from 1 to 10 repeatedly",
          order: 2,
        },
      ],
      practiceExercises: [
        {
          id: "ex_003",
          title: "Number Matching",
          description: "Match signed numbers to written digits",
          type: "matching",
          difficulty: LessonDifficulty.BEGINNER,
          instructions: "Watch the video and select the correct number",
        },
      ],
      summary: "Great job! You can now sign numbers 1-10 fluently.",
    },
    estimatedCompletionTime: 15,
    createdAt: "2024-01-05T00:00:00Z",
    updatedAt: "2024-08-01T00:00:00Z",
  },
  {
    id: "lesson_003",
    title: "Common Phrases",
    description: "Learn essential everyday phrases for basic communication.",
    category: LessonCategory.PHRASES,
    difficulty: LessonDifficulty.BEGINNER,
    duration: 18,
    videoUrl: "https://example.com/videos/common-phrases.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop",
    content: {
      introduction: "Master common phrases like 'Hello', 'Thank you', and 'How are you?'",
      steps: [
        {
          id: "step_006",
          title: "Greetings",
          description: "Learn how to greet people",
          order: 1,
        },
        {
          id: "step_007",
          title: "Polite Expressions",
          description: "Essential polite phrases",
          order: 2,
        },
      ],
      practiceExercises: [
        {
          id: "ex_004",
          title: "Phrase Recognition",
          description: "Identify signed phrases",
          type: "video_comparison",
          difficulty: LessonDifficulty.BEGINNER,
          instructions: "Watch and identify the phrase being signed",
        },
      ],
      summary: "You're ready to have basic conversations!",
    },
    estimatedCompletionTime: 20,
    createdAt: "2024-01-10T00:00:00Z",
    updatedAt: "2024-08-01T00:00:00Z",
  },
  {
    id: "lesson_004",
    title: "Facial Expressions & Non-Manual Markers",
    description: "Understand the importance of facial expressions in ASL communication.",
    category: LessonCategory.GRAMMAR,
    difficulty: LessonDifficulty.INTERMEDIATE,
    duration: 20,
    videoUrl: "https://example.com/videos/facial-expressions.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
    prerequisites: ["lesson_001"],
    content: {
      introduction: "Facial expressions are crucial in ASL. Learn how they change meaning.",
      steps: [
        {
          id: "step_008",
          title: "Expression Types",
          description: "Different types of facial expressions",
          order: 1,
        },
      ],
      practiceExercises: [
        {
          id: "ex_005",
          title: "Expression Identification",
          description: "Identify expressions in videos",
          type: "video_comparison",
          difficulty: LessonDifficulty.INTERMEDIATE,
          instructions: "Watch and identify the expression",
        },
      ],
      summary: "Facial expressions are essential for fluent ASL!",
    },
    estimatedCompletionTime: 25,
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-08-01T00:00:00Z",
  },
  {
    id: "lesson_005",
    title: "Conversation Practice: Ordering Food",
    description: "Practice real-world conversation skills in a restaurant setting.",
    category: LessonCategory.CONVERSATION,
    difficulty: LessonDifficulty.INTERMEDIATE,
    duration: 25,
    videoUrl: "https://example.com/videos/ordering-food.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop",
    prerequisites: ["lesson_003"],
    content: {
      introduction: "Learn how to order food at a restaurant using ASL.",
      steps: [
        {
          id: "step_009",
          title: "Food Vocabulary",
          description: "Learn food-related signs",
          order: 1,
        },
        {
          id: "step_010",
          title: "Ordering Dialogue",
          description: "Practice a complete ordering conversation",
          order: 2,
        },
      ],
      practiceExercises: [
        {
          id: "ex_006",
          title: "Dialogue Practice",
          description: "Record yourself ordering food",
          type: "recording",
          difficulty: LessonDifficulty.INTERMEDIATE,
          instructions: "Record a video of yourself ordering a meal",
        },
      ],
      summary: "You can now order food confidently in ASL!",
    },
    estimatedCompletionTime: 30,
    createdAt: "2024-01-20T00:00:00Z",
    updatedAt: "2024-08-01T00:00:00Z",
  },
];

/**
 * Mock progress data
 */
export const mockProgress: Progress[] = [
  {
    id: "progress_001",
    userId: "user_001",
    lessonId: "lesson_001",
    status: ProgressStatus.COMPLETED,
    startedAt: "2024-08-01T10:00:00Z",
    completedAt: "2024-08-01T10:45:00Z",
    lastAccessedAt: "2024-08-03T14:30:00Z",
    xpEarned: 150,
    exercisesCompleted: 2,
    totalExercises: 2,
    accuracy: 95,
    notes: "Great progress! Keep practicing.",
  },
  {
    id: "progress_002",
    userId: "user_001",
    lessonId: "lesson_002",
    status: ProgressStatus.COMPLETED,
    startedAt: "2024-08-02T09:00:00Z",
    completedAt: "2024-08-02T09:30:00Z",
    lastAccessedAt: "2024-08-03T14:30:00Z",
    xpEarned: 120,
    exercisesCompleted: 1,
    totalExercises: 1,
    accuracy: 88,
  },
  {
    id: "progress_003",
    userId: "user_001",
    lessonId: "lesson_003",
    status: ProgressStatus.IN_PROGRESS,
    startedAt: "2024-08-03T11:00:00Z",
    lastAccessedAt: "2024-08-04T15:20:00Z",
    xpEarned: 50,
    exercisesCompleted: 1,
    totalExercises: 1,
    accuracy: 75,
  },
  {
    id: "progress_004",
    userId: "user_001",
    lessonId: "lesson_004",
    status: ProgressStatus.NOT_STARTED,
    startedAt: "2024-08-04T00:00:00Z",
    lastAccessedAt: "2024-08-04T00:00:00Z",
    xpEarned: 0,
    exercisesCompleted: 0,
    totalExercises: 0,
  },
  {
    id: "progress_005",
    userId: "user_001",
    lessonId: "lesson_005",
    status: ProgressStatus.NOT_STARTED,
    startedAt: "2024-08-04T00:00:00Z",
    lastAccessedAt: "2024-08-04T00:00:00Z",
    xpEarned: 0,
    exercisesCompleted: 0,
    totalExercises: 0,
  },
];

/**
 * Mock leaderboard data
 */
export const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: "user_002",
    userName: "Sarah Johnson",
    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    totalXP: 15420,
    lessonsCompleted: 45,
    currentStreak: 45,
    masteredLessons: 28,
  },
  {
    rank: 2,
    userId: "user_003",
    userName: "Michael Chen",
    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    totalXP: 12890,
    lessonsCompleted: 38,
    currentStreak: 32,
    masteredLessons: 22,
  },
  {
    rank: 3,
    userId: "user_001",
    userName: "John Doe",
    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    totalXP: 4850,
    lessonsCompleted: 5,
    currentStreak: 12,
    masteredLessons: 2,
  },
  {
    rank: 4,
    userId: "user_004",
    userName: "Emma Wilson",
    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    totalXP: 3420,
    lessonsCompleted: 12,
    currentStreak: 8,
    masteredLessons: 1,
  },
  {
    rank: 5,
    userId: "user_005",
    userName: "David Martinez",
    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    totalXP: 2150,
    lessonsCompleted: 8,
    currentStreak: 5,
    masteredLessons: 0,
  },
];

/**
 * Mock achievements data
 */
export const mockAchievements: Achievement[] = [
  {
    id: "achievement_001",
    name: "First Steps",
    description: "Complete your first lesson",
    icon: "🎯",
    unlockedAt: "2024-08-01T10:45:00Z",
    rarity: "common",
  },
  {
    id: "achievement_002",
    name: "Alphabet Master",
    description: "Master the complete ASL alphabet",
    icon: "🔤",
    unlockedAt: "2024-08-02T14:20:00Z",
    rarity: "uncommon",
  },
  {
    id: "achievement_003",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "🔥",
    unlockedAt: "2024-08-05T09:00:00Z",
    rarity: "uncommon",
  },
  {
    id: "achievement_004",
    name: "Conversation Starter",
    description: "Complete a conversation lesson",
    icon: "💬",
    rarity: "rare",
  },
  {
    id: "achievement_005",
    name: "Legendary Learner",
    description: "Reach 10,000 XP",
    icon: "👑",
    rarity: "legendary",
  },
];

/**
 * Mock quiz questions
 */
export const mockQuizQuestions: QuizQuestion[] = [
  {
    id: "quiz_001",
    lessonId: "lesson_001",
    question: "Which hand shape represents the letter 'A' in ASL?",
    type: "multiple_choice",
    options: [
      { id: "opt_001", text: "Open hand with fingers spread" },
      { id: "opt_002", text: "Closed fist with thumb to the side" },
      { id: "opt_003", text: "Index and middle finger extended" },
      { id: "opt_004", text: "All fingers together pointing up" },
    ],
    correctAnswerId: "opt_002",
    explanation: "The letter 'A' in ASL is formed with a closed fist and the thumb positioned to the side.",
    difficulty: LessonDifficulty.BEGINNER,
  },
  {
    id: "quiz_002",
    lessonId: "lesson_002",
    question: "How do you sign the number 5 in ASL?",
    type: "multiple_choice",
    options: [
      { id: "opt_005", text: "All five fingers extended and spread apart" },
      { id: "opt_006", text: "Only the thumb and pinky extended" },
      { id: "opt_007", text: "Fingers in a 'V' shape" },
      { id: "opt_008", text: "Closed fist" },
    ],
    correctAnswerId: "opt_005",
    explanation: "The number 5 is signed with all five fingers extended and spread apart.",
    difficulty: LessonDifficulty.BEGINNER,
  },
];

/**
 * Simulated API delay
 */
const API_DELAY = 500; // milliseconds

/**
 * Helper function to simulate API call delay
 */
const delay = (ms: number = API_DELAY): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock API service methods
 */
export const mockApiService = {
  /**
   * Authenticate user with email and password
   */
  async login(email: string, password: string) {
    await delay();
    
    // Mock validation
    if (email === "student@example.com" && password === "password") {
      return {
        user: mockStudentUser,
        token: {
          accessToken: "mock_jwt_token_" + Date.now(),
          refreshToken: "mock_refresh_token_" + Date.now(),
          expiresIn: 3600,
          tokenType: "Bearer" as const,
        },
      };
    }
    
    if (email === "mentor@example.com" && password === "password") {
      return {
        user: mockMentorUser,
        token: {
          accessToken: "mock_jwt_token_" + Date.now(),
          refreshToken: "mock_refresh_token_" + Date.now(),
          expiresIn: 3600,
          tokenType: "Bearer" as const,
        },
      };
    }
    
    throw new Error("Invalid email or password");
  },

  /**
   * Fetch current user profile
   */
  async getCurrentUser() {
    await delay();
    return mockStudentUser;
  },

  /**
   * Fetch all lessons
   */
  async getLessons() {
    await delay();
    return mockLessons;
  },

  /**
   * Fetch a single lesson by ID
   */
  async getLesson(id: string) {
    await delay();
    const lesson = mockLessons.find((l) => l.id === id);
    if (!lesson) throw new Error(`Lesson ${id} not found`);
    return lesson;
  },

  /**
   * Fetch user progress
   */
  async getProgress() {
    await delay();
    return mockProgress;
  },

  /**
   * Fetch progress for a specific lesson
   */
  async getLessonProgress(lessonId: string) {
    await delay();
    const progress = mockProgress.find((p) => p.lessonId === lessonId);
    if (!progress) throw new Error(`Progress for lesson ${lessonId} not found`);
    return progress;
  },

  /**
   * Update lesson progress
   */
  async updateProgress(lessonId: string, status: ProgressStatus, accuracy?: number) {
    await delay();
    const progress = mockProgress.find((p) => p.lessonId === lessonId);
    if (!progress) throw new Error(`Progress for lesson ${lessonId} not found`);
    
    return {
      ...progress,
      status,
      accuracy: accuracy ?? progress.accuracy,
      lastAccessedAt: new Date().toISOString(),
    }
  },

  /**
   * Fetch leaderboard
   */
  async getLeaderboard() {
    await delay();
    return mockLeaderboard;
  },

  /**
   * Fetch user achievements
   */
  async getAchievements() {
    await delay();
    return mockAchievements;
  },

  /**
   * Fetch quiz questions for a lesson
   */
  async getQuizQuestions(lessonId: string) {
    await delay();
    return mockQuizQuestions.filter((q) => q.lessonId === lessonId);
  },

  /**
   * Submit quiz answers
   */
  async submitQuiz(lessonId: string, answers: Record<string, string>) {
    await delay();
    
    const questions = mockQuizQuestions.filter((q) => q.lessonId === lessonId);
    let correctCount = 0;
    
    Object.entries(answers).forEach(([questionId, answerId]) => {
      const question = questions.find((q) => q.id === questionId);
      if (question && question.correctAnswerId === answerId) {
        correctCount++;
      }
    });
    
    const score = (correctCount / questions.length) * 100;
    
    return {
      id: "result_" + Date.now(),
      userId: "user_001",
      lessonId,
      questionsAnswered: questions.length,
      correctAnswers: correctCount,
      score,
      timeSpent: Math.floor(Math.random() * 600) + 60,
      submittedAt: new Date().toISOString(),
    };
  },

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>) {
    await delay();
    return { ...mockStudentUser, ...updates };
  },

  /**
   * Logout user (clear token)
   */
  async logout() {
    await delay();
    return { success: true };
  },
};
