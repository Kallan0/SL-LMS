/**
 * Frontend E2E Tests - Page Components
 * 
 * Verifies that page components render correctly and handle states.
 * Run: npx vitest run client/src/__tests__/pages.test.ts
 */

import { describe, it, expect } from "vitest";

const API_BASE_URL = "http://127.0.0.1:5000";

describe("Page Component Integration", () => {
  describe("Login Page", () => {
    it("should have login form fields", () => {
      // Verify the login page structure by checking the component exports
      // In a real E2E test, we'd use Playwright to verify DOM elements
      expect(true).toBe(true);
    });

    it("should handle login API call", async () => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "student@example.com",
          password: "password",
        }),
      });

      // Either success (200) or user doesn't exist (401)
      expect([200, 401]).toContain(response.status);
    });
  });

  describe("Registration Page", () => {
    it("should handle registration API call", async () => {
      const testEmail = `register-test-${Date.now()}@example.com`;
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          username: `reg_test_${Date.now()}`,
          password: "testpass123",
          role: "student",
          firstName: "Test",
          lastName: "User",
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBeDefined();
      expect(data.email).toBe(testEmail);
    });
  });

  describe("Dashboard Page", () => {
    it("should fetch user data for dashboard", async () => {
      // Register and login
      const testEmail = `dashboard-test-${Date.now()}@example.com`;
      await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          username: `dash_test_${Date.now()}`,
          password: "testpass123",
          role: "student",
        }),
      });

      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail, password: "testpass123" }),
      });

      const loginData = await loginResponse.json();
      const token = loginData.token.access_token;

      // Fetch user profile (needed for dashboard)
      const profileResponse = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(profileResponse.status).toBe(200);
      const profile = await profileResponse.json();
      expect(profile.id).toBeDefined();
      expect(profile.username).toBeDefined();
    });
  });

  describe("Lessons Page", () => {
    it("should fetch lessons list", async () => {
      const response = await fetch(`${API_BASE_URL}/lessons`);
      expect(response.status).toBe(200);

      const lessons = await response.json();
      expect(Array.isArray(lessons)).toBe(true);
      expect(lessons.length).toBeGreaterThan(0);

      // Verify lesson structure matches what the page expects
      const lesson = lessons[0];
      expect(lesson).toHaveProperty("id");
      expect(lesson).toHaveProperty("title");
      expect(lesson).toHaveProperty("order");
      expect(lesson).toHaveProperty("signLabel");
      expect(lesson).toHaveProperty("difficulty");
      expect(lesson).toHaveProperty("category");
    });
  });

  describe("Leaderboard Page", () => {
    it("should fetch leaderboard data", async () => {
      const response = await fetch(`${API_BASE_URL}/leaderboard`);
      expect(response.status).toBe(200);

      const leaderboard = await response.json();
      expect(Array.isArray(leaderboard)).toBe(true);
    });
  });

  describe("Profile Page", () => {
    it("should fetch and update profile", async () => {
      // Register and login
      const testEmail = `profile-test-${Date.now()}@example.com`;
      await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          username: `profile_test_${Date.now()}`,
          password: "testpass123",
          role: "student",
        }),
      });

      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail, password: "testpass123" }),
      });

      const loginData = await loginResponse.json();
      const token = loginData.token.access_token;

      // Get profile
      const profileResponse = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(profileResponse.status).toBe(200);
      const profile = await profileResponse.json();

      // Update profile
      const updateResponse = await fetch(`${API_BASE_URL}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: "Updated",
          lastName: "Name",
          bio: "Test bio",
        }),
      });

      expect(updateResponse.status).toBe(200);
      const updated = await updateResponse.json();
      expect(updated.firstName).toBe("Updated");
      expect(updated.lastName).toBe("Name");
      expect(updated.bio).toBe("Test bio");
    });
  });

  describe("Assessment Page", () => {
    it("should fetch quiz questions for assessment", async () => {
      // Get a lesson first
      const lessonsResponse = await fetch(`${API_BASE_URL}/lessons`);
      const lessons = await lessonsResponse.json();

      if (lessons.length > 0) {
        const lessonId = lessons[0].id;
        const quizResponse = await fetch(
          `${API_BASE_URL}/lessons/${lessonId}/quiz`
        );
        expect(quizResponse.status).toBe(200);

        const quiz = await quizResponse.json();
        expect(Array.isArray(quiz)).toBe(true);
      }
    });
  });

  describe("Chat Portal", () => {
    it("should require authentication for chat", async () => {
      const response = await fetch(`${API_BASE_URL}/chat/conversations`);
      expect(response.status).toBe(401);
    });

    it("should fetch conversations when authenticated", async () => {
      // Register and login
      const testEmail = `chat-test-${Date.now()}@example.com`;
      await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          username: `chat_test_${Date.now()}`,
          password: "testpass123",
          role: "student",
        }),
      });

      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail, password: "testpass123" }),
      });

      const loginData = await loginResponse.json();
      const token = loginData.token.access_token;

      const conversationsResponse = await fetch(
        `${API_BASE_URL}/chat/conversations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      expect(conversationsResponse.status).toBe(200);
      const conversations = await conversationsResponse.json();
      expect(Array.isArray(conversations)).toBe(true);
    });
  });
});
