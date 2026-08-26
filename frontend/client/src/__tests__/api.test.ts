/**
 * Frontend E2E Tests - API Service Layer
 * 
 * Tests the ProductionApiService against the running backend.
 * Run: npx vitest run client/src/__tests__/api.test.ts
 */

import { describe, it, expect, beforeAll } from "vitest";

const API_BASE_URL = "http://127.0.0.1:5000";

// Helper to make API calls (mirroring the frontend's apiFetch)
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ status: number; data: T | null; ok: boolean }> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  let data: T | null = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = (await response.json()) as T;
  }

  return { status: response.status, data, ok: response.ok };
}

describe("API Service Integration", () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Register and login a test user
    const testEmail = `vitest-${Date.now()}@example.com`;
    const testUsername = `vitest_user_${Date.now()}`;

    await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: testEmail,
        username: testUsername,
        password: "vitestpass123",
        role: "student",
      }),
    });

    const loginResult = await apiFetch<{
      token: { access_token: string };
      user: { id: string; email: string };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: testEmail, password: "vitestpass123" }),
    });

    authToken = loginResult.data!.token.access_token;
    userId = loginResult.data!.user.id;
  });

  describe("Health Check", () => {
    it("should return ok status", async () => {
      const { status, data } = await apiFetch<{ status: string; service: string }>(
        "/health"
      );
      expect(status).toBe(200);
      expect(data?.status).toBe("ok");
      expect(data?.service).toBe("core-backend");
    });
  });

  describe("Authentication", () => {
    it("should login with valid credentials", async () => {
      const { status, data } = await apiFetch<{
        token: { access_token: string };
        user: { id: string; email: string; role: string };
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "student@example.com",
          password: "password",
        }),
      });

      // Either success or user doesn't exist (depending on seed data)
      expect([200, 401]).toContain(status);
      if (status === 200) {
        expect(data?.token?.access_token).toBeDefined();
        expect(data?.user?.id).toBeDefined();
      }
    });

    it("should reject invalid credentials", async () => {
      const { status, data } = await apiFetch<{ error: string }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            email: "nonexistent@example.com",
            password: "wrongpassword",
          }),
        }
      );
      expect(status).toBe(401);
      expect(data?.error).toBeDefined();
    });

    it("should return user profile with valid token", async () => {
      const { status, data } = await apiFetch<{
        id: string;
        email: string;
        username: string;
      }>("/users/me", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(status).toBe(200);
      expect(data?.id).toBe(userId);
    });

    it("should reject unauthenticated requests", async () => {
      const { status } = await apiFetch("/users/me");
      expect(status).toBe(401);
    });

    it("should reject invalid tokens", async () => {
      const { status } = await apiFetch("/users/me", {
        headers: { Authorization: "Bearer invalid-token-12345" },
      });
      expect(status).toBe(403);
    });
  });

  describe("Lessons", () => {
    it("should fetch all lessons", async () => {
      const { status, data } = await apiFetch<
        Array<{ id: string; title: string; order: number }>
      >("/lessons");
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data!.length).toBeGreaterThan(0);
    });

    it("should have required lesson fields", async () => {
      const { data } = await apiFetch<
        Array<{ id: string; title: string; order: number; signLabel: string }>
      >("/lessons");
      const lesson = data![0];
      expect(lesson.id).toBeDefined();
      expect(lesson.title).toBeDefined();
      expect(lesson.order).toBeDefined();
      expect(lesson.signLabel).toBeDefined();
    });

    it("should fetch single lesson", async () => {
      const { data: lessons } = await apiFetch<
        Array<{ id: string }>
      >("/lessons");
      const lessonId = lessons![0].id;

      const { status, data } = await apiFetch<{
        id: string;
        title: string;
        description: string;
      }>(`/lessons/${lessonId}`);
      expect(status).toBe(200);
      expect(data?.id).toBe(lessonId);
      expect(data?.title).toBeDefined();
    });

    it("should return 404 for nonexistent lesson", async () => {
      const { status } = await apiFetch("/lessons/nonexistent-id-12345");
      expect(status).toBe(404);
    });
  });

  describe("Progress", () => {
    it("should fetch user progress when authenticated", async () => {
      const { status, data } = await apiFetch<
        Array<{ id: string; userId: string }>
      >("/progress", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it("should reject unauthenticated progress request", async () => {
      const { status } = await apiFetch("/progress");
      expect(status).toBe(401);
    });

    it("should update lesson progress", async () => {
      const { data: lessons } = await apiFetch<
        Array<{ id: string }>
      >("/lessons");
      const lessonId = lessons![0].id;

      const { status, data } = await apiFetch<{
        id: string;
        status: string;
        accuracy: number;
      }>(`/progress/${lessonId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ status: "IN_PROGRESS", accuracy: 0.8 }),
      });

      expect(status).toBe(200);
      expect(data?.id).toBeDefined();
      expect(data?.status).toBe("IN_PROGRESS");
      expect(data?.accuracy).toBe(0.8);
    });

    it("should complete a lesson", async () => {
      const { data: lessons } = await apiFetch<
        Array<{ id: string }>
      >("/lessons");
      const lessonId = lessons![0].id;

      const { status, data } = await apiFetch<{
        record: { status: string };
        xp: number;
        streak: number;
      }>("/progress/complete", {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ lessonId, accuracy: 0.95 }),
      });

      expect(status).toBe(200);
      expect(data?.record?.status).toBe("COMPLETED");
      expect(data?.xp).toBeDefined();
      expect(data?.streak).toBeDefined();
    });
  });

  describe("Leaderboard", () => {
    it("should fetch leaderboard", async () => {
      const { status, data } = await apiFetch<
        Array<{ id: string; username: string; xp: number }>
      >("/leaderboard");
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it("should have required leaderboard fields", async () => {
      const { data } = await apiFetch<
        Array<{ id: string; username: string; xp: number }>
      >("/leaderboard");

      if (data!.length > 0) {
        const entry = data![0];
        expect(entry.id).toBeDefined();
        expect(entry.username).toBeDefined();
        expect(entry.xp).toBeDefined();
      }
    });
  });

  describe("Quiz", () => {
    it("should fetch quiz questions for a lesson", async () => {
      const { data: lessons } = await apiFetch<
        Array<{ id: string }>
      >("/lessons");
      const lessonId = lessons![0].id;

      const { status, data } = await apiFetch<
        Array<{ id: string }>
      >(`/lessons/${lessonId}/quiz`);
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it("should require auth for quiz submission", async () => {
      const { data: lessons } = await apiFetch<
        Array<{ id: string }>
      >("/lessons");
      const lessonId = lessons![0].id;

      const { status } = await apiFetch(`/lessons/${lessonId}/quiz/submit`, {
        method: "POST",
        body: JSON.stringify({ answers: {} }),
      });
      expect(status).toBe(401);
    });
  });

  describe("Achievements", () => {
    it("should fetch achievements when authenticated", async () => {
      const { status, data } = await apiFetch<
        Array<{ id: string }>
      >("/achievements", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it("should reject unauthenticated achievements request", async () => {
      const { status } = await apiFetch("/achievements");
      expect(status).toBe(401);
    });
  });

  describe("Chat", () => {
    it("should send heartbeat", async () => {
      const { status, data } = await apiFetch<{ ok: boolean }>(
        "/chat/heartbeat",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({}),
        }
      );
      expect(status).toBe(200);
      expect(data?.ok).toBe(true);
    });

    it("should fetch conversations", async () => {
      const { status, data } = await apiFetch<
        Array<{ id: string }>
      >("/chat/conversations", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it("should fetch unread count", async () => {
      const { status, data } = await apiFetch<{ count: number }>(
        "/chat/unread",
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      expect(status).toBe(200);
      expect(typeof data?.count).toBe("number");
    });
  });

  describe("Mentor Routes", () => {
    it("should reject student access to mentor endpoints", async () => {
      const { status } = await apiFetch("/mentor/students", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(status).toBe(403);
    });
  });

  describe("Error Handling", () => {
    it("should return 404 for nonexistent routes", async () => {
      const { status } = await apiFetch("/nonexistent-route");
      expect(status).toBe(404);
    });

    it("should handle malformed JSON gracefully", async () => {
      const { status } = await apiFetch("/auth/login", {
        method: "POST",
        body: "not json",
        headers: { "Content-Type": "application/json" },
      });
      expect([400, 500]).toContain(status);
    });
  });
});
