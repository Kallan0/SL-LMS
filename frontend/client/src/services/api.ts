/**
 * api.ts – Centralised HTTP client for Sign Language LMS.
 *
 * `apiFetch` wrapper acts as a fetch interceptor:
 *   • Reads the JWT from localStorage
 *   • Attaches `Authorization: Bearer <token>` to every outgoing request
 *   • Handles 401 responses by clearing the stored token and redirecting to /login
 *   • Enforces a configurable request timeout
 */
import {
  User,
  Lesson,
  Progress,
  LeaderboardEntry,
  Achievement,
  QuizQuestion,
  QuizResult,
  LoginRequest,
  LoginResponse,
  ProgressStatus,
} from "@/types/index";

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * Core backend URL (Express + Prisma).
 * All auth, lessons, progress, leaderboard, and quiz endpoints live here.
 * The ML inference service (port 8000) is called separately by the
 * Assessment page and WebcamTracker component — it is NOT routed through
 * this base URL.
 */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:5000";

const JWT_STORAGE_KEY =
  import.meta.env.VITE_JWT_STORAGE_KEY ?? "sign_language_lms_token";

const DEFAULT_TIMEOUT_MS = 30_000;

// ─── Token helpers ────────────────────────────────────────────────────────────

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(JWT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeToken(token: string): void {
  try {
    localStorage.setItem(JWT_STORAGE_KEY, token);
  } catch (err) {
    console.error("[api] Failed to persist token:", err);
  }
}

function clearToken(): void {
  try {
    localStorage.removeItem(JWT_STORAGE_KEY);
  } catch (err) {
    console.error("[api] Failed to clear token:", err);
  }
}

// ─── Fetch interceptor ────────────────────────────────────────────────────────

/**
 * apiFetch
 *
 * A thin wrapper around the native Fetch API that acts as a request interceptor:
 *
 *   1. Resolves the full URL against `FASTAPI_BASE_URL`.
 *   2. Merges in `Content-Type: application/json` and
 *      `Authorization: Bearer <token>` headers automatically.
 *   3. Enforces a configurable AbortController timeout.
 *   4. On 401 Unauthorized, clears the stored token and triggers a page
 *      reload so the AuthProvider redirects the user to /login.
 *
 * Use this function anywhere you need to call the FastAPI backend.
 * Components that import `apiService` methods get the interceptor for free.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const url        = `${API_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timerId    = setTimeout(() => controller.abort(), timeoutMs);

  // Build auth header from localStorage (or fall back to nothing)
  const token = getStoredToken();
  const authHeader: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
        // Caller-supplied headers win over the defaults above
        ...(options.headers as Record<string, string> | undefined),
      },
    });

    // ── 401 interceptor: session expired / invalid token ─────────────────
    if (response.status === 401) {
      console.warn("[api] 401 Unauthorized – clearing session");
      clearToken();
      // Redirect to login without a full navigation loop
      window.location.href = "/login";
      // Throw so the calling code doesn't try to parse an empty body
      throw new Error("Unauthorized – redirecting to login");
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        (errorBody as { detail?: string; message?: string }).detail ??
          (errorBody as { message?: string }).message ??
          `HTTP ${response.status} ${response.statusText}`
      );
    }

    // FastAPI sometimes returns 204 No Content
    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return (await response.json()) as T;
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms: ${endpoint}`);
    }
    throw err;
  } finally {
    clearTimeout(timerId);
  }
}

// ─── API Service Interface ────────────────────────────────────────────────────

export interface IApiService {
  // Auth
  login(email: string, password: string): Promise<LoginResponse>;
  logout(): Promise<{ success: boolean }>;
  getCurrentUser(): Promise<User>;

  //Register
  register(email: string, username: string, password: string, role: string, firstName: string, lastName: string): Promise<any>;
  

  // Lessons
  getLessons(): Promise<Lesson[]>;
  getLesson(id: string): Promise<Lesson>;

  // Progress
  getProgress(): Promise<Progress[]>;
  getLessonProgress(lessonId: string): Promise<Progress>;
  updateProgress(lessonId: string, status: ProgressStatus, accuracy?: number): Promise<Progress>;

  // Leaderboard
  getLeaderboard(): Promise<LeaderboardEntry[]>;

  // Achievements
  getAchievements(): Promise<Achievement[]>;

  // Quiz
  getQuizQuestions(lessonId: string): Promise<QuizQuestion[]>;
  submitQuiz(lessonId: string, answers: Record<string, string>): Promise<QuizResult>;

  // Profile
  updateProfile(updates: Partial<User>): Promise<User>;
}

// ─── Production Implementation (FastAPI) ─────────────────────────────────────

class ProductionApiService implements IApiService {
  // ── Auth ──────────────────────────────────────────────────────────────────

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password } satisfies LoginRequest),
    });

    if (response.token?.access_token) {
      storeToken(response.token.access_token);
    }

    return response;
  }

  async register(email: string, username: string, password: string, role: string, firstName: string, lastName: string): Promise<any> {
    const response = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password, role, firstName, lastName }),
    });
    return response;
  }

  async logout(): Promise<{ success: boolean }> {
    clearToken();
    return { success: true };
  }

  async getCurrentUser(): Promise<User> {
    return apiFetch<User>("/users/me");
  }

  // ── Lessons ───────────────────────────────────────────────────────────────

  async getLessons(): Promise<Lesson[]> {
    return apiFetch<Lesson[]>("/lessons");
  }

  async getLesson(id: string): Promise<Lesson> {
    return apiFetch<Lesson>(`/lessons/${id}`);
  }

  // ── Progress ──────────────────────────────────────────────────────────────

  async getProgress(): Promise<Progress[]> {
    return apiFetch<Progress[]>("/progress");
  }

  async getLessonProgress(lessonId: string): Promise<Progress> {
    return apiFetch<Progress>(`/progress/${lessonId}`);
  }

  async updateProgress(
    lessonId: string,
    status: ProgressStatus,
    accuracy?: number
  ): Promise<Progress> {
    return apiFetch<Progress>(`/progress/${lessonId}`, {
      method: "PATCH",
      body: JSON.stringify({ status, accuracy }),
    });
  }

  // ── Leaderboard ───────────────────────────────────────────────────────────

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    return apiFetch<LeaderboardEntry[]>("/leaderboard");
  }

  // ── Achievements ──────────────────────────────────────────────────────────

  async getAchievements(): Promise<Achievement[]> {
    return apiFetch<Achievement[]>("/achievements");
  }

  // ── Quiz ──────────────────────────────────────────────────────────────────

  async getQuizQuestions(lessonId: string): Promise<QuizQuestion[]> {
    return apiFetch<QuizQuestion[]>(`/lessons/${lessonId}/quiz`);
  }

  async submitQuiz(
    lessonId: string,
    answers: Record<string, string>
  ): Promise<QuizResult> {
    return apiFetch<QuizResult>(`/lessons/${lessonId}/quiz/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    });
  }

  // ── Profile ───────────────────────────────────────────────────────────────

  async updateProfile(updates: Partial<User>): Promise<User> {
    return apiFetch<User>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }
}

export const apiService = new ProductionApiService();
