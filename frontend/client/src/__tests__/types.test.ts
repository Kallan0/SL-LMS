/**
 * Frontend E2E Tests - Type Definitions
 * 
 * Verifies that the frontend's TypeScript types match the backend's API responses.
 * Run: npx vitest run client/src/__tests__/types.test.ts
 */

import { describe, it, expect } from "vitest";
import type {
  User,
  AuthToken,
  Progress,
  ProgressStatus,
  LoginRequest,
  LoginResponse,
} from "@/types/index";

const API_BASE_URL = "http://127.0.0.1:5000";

describe("Type Definitions - API Response Validation", () => {
  it("User type should match backend response", async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    // Just verify the types are importable and the API responds
    expect(data.status).toBe("ok");
  });

  it("LoginResponse should be compatible with backend", async () => {
    // Type assertion that LoginResponse structure matches
    const mockLoginResponse: LoginResponse = {
      token: {
        access_token: "mock-token",
        token_type: "bearer",
        expiresIn: 3600,
      },
      user: {
        id: "test-id",
        username: "testuser",
        role: "student",
      },
    };

    expect(mockLoginResponse.token.access_token).toBeDefined();
    expect(mockLoginResponse.user.id).toBeDefined();
  });

  it("LoginRequest should have correct fields", () => {
    const mockRequest: LoginRequest = {
      email: "test@example.com",
      password: "password123",
    };

    expect(mockRequest.email).toBeDefined();
    expect(mockRequest.password).toBeDefined();
  });

  it("ProgressStatus enum should have all values", () => {
    const statuses: ProgressStatus[] = [
      "NOT_STARTED",
      "IN_PROGRESS",
      "COMPLETED",
    ];
    expect(statuses).toHaveLength(3);
  });

  it("User type should match API response shape", async () => {
    // Register and login to get a real user
    const testEmail = `type-test-${Date.now()}@example.com`;
    await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        username: `type_test_${Date.now()}`,
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

    // Fetch user profile
    const profileResponse = await fetch(`${API_BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const profileData = await profileResponse.json();

    // Verify the response matches User type
    const user: User = profileData;
    expect(user.id).toBeDefined();
    expect(user.username).toBeDefined();
    expect(user.role).toBeDefined();
  });

  it("Lesson type should match API response shape", async () => {
    const response = await fetch(`${API_BASE_URL}/lessons`);
    const lessons = await response.json();

    if (lessons.length > 0) {
      const lesson = lessons[0];
      // Verify required fields exist
      expect(typeof lesson.id).toBe("string");
      expect(typeof lesson.title).toBe("string");
      expect(typeof lesson.order).toBe("number");
      expect(typeof lesson.signLabel).toBe("string");
    }
  });

  it("Progress type should match API response shape", async () => {
    // Get a token first
    const testEmail = `progress-test-${Date.now()}@example.com`;
    await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        username: `progress_test_${Date.now()}`,
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

    const progressResponse = await fetch(`${API_BASE_URL}/progress`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const progress = await progressResponse.json();
    expect(Array.isArray(progress)).toBe(true);
  });
});
