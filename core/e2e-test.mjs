/**
 * E2E Test Script for Sign Language LMS Backend
 * 
 * Tests all API endpoints against the running Express server on port 5000.
 * Run: node e2e-test.mjs
 * 
 * Requires the backend server to be running on http://127.0.0.1:5000
 */

const BASE_URL = process.env.API_BASE_URL || "http://127.0.0.1:5000";

let passed = 0;
let failed = 0;
let total = 0;

// ─── Test Utilities ───────────────────────────────────────────────────────────

function log(msg, color = "") {
  const prefix = color === "green" ? "\x1b[32m" : color === "red" ? "\x1b[31m" : color === "cyan" ? "\x1b[36m" : color === "yellow" ? "\x1b[33m" : "";
  const suffix = color ? "\x1b[0m" : "";
  console.log(`${prefix}${msg}${suffix}`);
}

async function test(name, fn) {
  total++;
  try {
    await fn();
    passed++;
    log(`  ✅ PASS: ${name}`, "green");
  } catch (err) {
    failed++;
    log(`  ❌ FAIL: ${name}`, "red");
    log(`         ${err.message}`, "red");
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || "Assertion failed");
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertExists(obj, key, message) {
  if (!(key in obj)) throw new Error(message || `Expected object to have key "${key}"`);
}

// ─── Test Helpers ─────────────────────────────────────────────────────────────

async function api(endpoint, options = {}) {
  const { method = "GET", body, token, expectStatus } = options;
  
  const headers = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
    signal: AbortSignal.timeout(10000),
  };
  
  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  
  let data = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  }
  
  if (expectStatus !== undefined) {
    assertEqual(response.status, expectStatus, `Expected status ${expectStatus}, got ${response.status}`);
  }
  
  return { status: response.status, data, ok: response.ok };
}

// ─── Test Suites ──────────────────────────────────────────────────────────────

async function testHealthCheck() {
  log("\n🏥 Health Check", "cyan");
  
  await test("GET /health returns ok status", async () => {
    const { status, data } = await api("/health");
    assertEqual(status, 200);
    assertEqual(data.status, "ok");
    assertEqual(data.service, "core-backend");
  });
}

async function testRegistration() {
  log("\n📝 Registration", "cyan");
  
  const testEmail = `e2e-test-${Date.now()}@example.com`;
  const testUsername = `e2e_user_${Date.now()}`;
  
  await test("POST /auth/register - success", async () => {
    const { status, data } = await api("/auth/register", {
      method: "POST",
      body: {
        email: testEmail,
        username: testUsername,
        password: "testpass123",
        role: "student",
        firstName: "E2E",
        lastName: "TestUser",
      },
    });
    assertEqual(status, 200);
    assertExists(data, "id");
    assertExists(data, "email");
    assertEqual(data.email, testEmail);
  });
  
  await test("POST /auth/register - missing fields", async () => {
    const { status, data } = await api("/auth/register", {
      method: "POST",
      body: { email: "test@test.com" },
      expectStatus: 400,
    });
    assertExists(data, "error");
  });
  
  await test("POST /auth/register - duplicate email", async () => {
    const { status, data } = await api("/auth/register", {
      method: "POST",
      body: {
        email: testEmail,
        username: "another_user",
        password: "testpass123",
      },
      expectStatus: 409,
    });
    assertExists(data, "error");
  });
}

async function testAuthentication() {
  log("\n🔐 Authentication", "cyan");
  
  // First register a test user
  const testEmail = `e2e-auth-${Date.now()}@example.com`;
  const testUsername = `e2e_auth_${Date.now()}`;
  
  await api("/auth/register", {
    method: "POST",
    body: {
      email: testEmail,
      username: testUsername,
      password: "authpass123",
      role: "student",
    },
  });
  
  let authToken = null;
  let userId = null;
  
  await test("POST /auth/login - success", async () => {
    const { status, data } = await api("/auth/login", {
      method: "POST",
      body: { email: testEmail, password: "authpass123" },
    });
    assertEqual(status, 200);
    assertExists(data, "token");
    assertExists(data.token, "access_token");
    assertExists(data, "user");
    assertEqual(data.user.email, testEmail);
    authToken = data.token.access_token;
    userId = data.user.id;
  });
  
  await test("POST /auth/login - invalid credentials", async () => {
    const { status, data } = await api("/auth/login", {
      method: "POST",
      body: { email: testEmail, password: "wrongpassword" },
      expectStatus: 401,
    });
    assertExists(data, "error");
  });
  
  await test("GET /users/me - success with token", async () => {
    const { status, data } = await api("/users/me", { token: authToken });
    assertEqual(status, 200);
    assertExists(data, "id");
    assertExists(data, "email");
    assertEqual(data.email, testEmail);
  });
  
  await test("GET /users/me - no token", async () => {
    const { status } = await api("/users/me", { expectStatus: 401 });
    assertEqual(status, 401);
  });
  
  await test("GET /users/me - invalid token", async () => {
    const { status } = await api("/users/me", {
      token: "invalid-token-12345",
      expectStatus: 403,
    });
    assertEqual(status, 403);
  });
  
  return { authToken, userId };
}

async function testLessons() {
  log("\n📚 Lessons", "cyan");
  
  await test("GET /lessons - returns array", async () => {
    const { status, data } = await api("/lessons");
    assertEqual(status, 200);
    assert(Array.isArray(data), "Expected lessons to be an array");
    // We expect seeded lessons
    assert(data.length > 0, "Expected at least one lesson");
  });
  
  await test("GET /lessons - lessons have required fields", async () => {
    const { data } = await api("/lessons");
    const lesson = data[0];
    assertExists(lesson, "id");
    assertExists(lesson, "title");
    assertExists(lesson, "order");
    assertExists(lesson, "signLabel");
  });
  
  let lessonId = null;
  
  await test("GET /lessons/:id - single lesson", async () => {
    const { data: lessons } = await api("/lessons");
    lessonId = lessons[0].id;
    
    const { status, data } = await api(`/lessons/${lessonId}`);
    assertEqual(status, 200);
    assertEqual(data.id, lessonId);
    assertExists(data, "title");
    assertExists(data, "description");
  });
  
  await test("GET /lessons/:id - not found", async () => {
    const { status } = await api("/lessons/nonexistent-id-12345", { expectStatus: 404 });
    assertEqual(status, 404);
  });
  
  return { lessonId };
}

async function testProgress(authToken, lessonId) {
  log("\n📊 Progress", "cyan");
  
  await test("GET /progress - with auth", async () => {
    const { status, data } = await api("/progress", { token: authToken });
    assertEqual(status, 200);
    assert(Array.isArray(data), "Expected progress to be an array");
  });
  
  await test("GET /progress - without auth", async () => {
    const { status } = await api("/progress", { expectStatus: 401 });
    assertEqual(status, 401);
  });
  
  await test("PATCH /progress/:lessonId - update progress", async () => {
    const { status, data } = await api(`/progress/${lessonId}`, {
      method: "PATCH",
      token: authToken,
      body: { status: "IN_PROGRESS", accuracy: 0.75 },
    });
    assertEqual(status, 200);
    assertExists(data, "id");
    assertEqual(data.status, "IN_PROGRESS");
    assertEqual(data.accuracy, 0.75);
  });
  
  await test("GET /progress/:lessonId - get specific progress", async () => {
    const { status, data } = await api(`/progress/${lessonId}`, { token: authToken });
    assertEqual(status, 200);
    assertEqual(data.lessonId, lessonId);
  });
  
  await test("POST /progress/complete - mark lesson complete", async () => {
    const { status, data } = await api("/progress/complete", {
      method: "POST",
      token: authToken,
      body: { lessonId, accuracy: 0.95 },
    });
    assertEqual(status, 200);
    assertExists(data, "record");
    assertEqual(data.record.status, "COMPLETED");
    assertExists(data, "xp");
    assertExists(data, "streak");
  });
}

async function testLeaderboard() {
  log("\n🏆 Leaderboard", "cyan");
  
  await test("GET /leaderboard - returns array", async () => {
    const { status, data } = await api("/leaderboard");
    assertEqual(status, 200);
    assert(Array.isArray(data), "Expected leaderboard to be an array");
  });
  
  await test("GET /leaderboard - entries have required fields", async () => {
    const { data } = await api("/leaderboard");
    if (data.length > 0) {
      const entry = data[0];
      assertExists(entry, "id");
      assertExists(entry, "username");
      assertExists(entry, "xp");
    }
  });
}

async function testAchievements(authToken) {
  log("\n🎯 Achievements", "cyan");
  
  await test("GET /achievements - with auth", async () => {
    const { status, data } = await api("/achievements", { token: authToken });
    assertEqual(status, 200);
    assert(Array.isArray(data), "Expected achievements to be an array");
  });
  
  await test("GET /achievements - without auth", async () => {
    const { status } = await api("/achievements", { expectStatus: 401 });
    assertEqual(status, 401);
  });
}

async function testQuiz(lessonId) {
  log("\n❓ Quiz", "cyan");
  
  await test("GET /lessons/:id/quiz - returns array", async () => {
    const { status, data } = await api(`/lessons/${lessonId}/quiz`);
    assertEqual(status, 200);
    assert(Array.isArray(data), "Expected quiz to be an array");
  });
  
  await test("POST /lessons/:id/quiz/submit - without auth", async () => {
    const { status } = await api(`/lessons/${lessonId}/quiz/submit`, {
      method: "POST",
      body: { answers: {} },
      expectStatus: 401,
    });
    assertEqual(status, 401);
  });
}

async function testMentorRoutes() {
  log("\n👨‍🏫 Mentor Routes", "cyan");
  
  // Create a mentor user
  const mentorEmail = `e2e-mentor-${Date.now()}@example.com`;
  const mentorUsername = `e2e_mentor_${Date.now()}`;
  
  await api("/auth/register", {
    method: "POST",
    body: {
      email: mentorEmail,
      username: mentorUsername,
      password: "mentorpass123",
      role: "mentor",
    },
  });
  
  let mentorToken = null;
  
  await test("Login as mentor", async () => {
    const { data } = await api("/auth/login", {
      method: "POST",
      body: { email: mentorEmail, password: "mentorpass123" },
    });
    mentorToken = data.token.access_token;
    assertEqual(data.user.role, "MENTOR");
  });
  
  await test("GET /mentor/students - with mentor role", async () => {
    const { status, data } = await api("/mentor/students", { token: mentorToken });
    assertEqual(status, 200);
    assert(Array.isArray(data), "Expected students to be an array");
  });
  
  await test("GET /mentor/students - with student role (forbidden)", async () => {
    // Create a student
    const studentEmail = `e2e-student-${Date.now()}@example.com`;
    await api("/auth/register", {
      method: "POST",
      body: {
        email: studentEmail,
        username: `e2e_student_${Date.now()}`,
        password: "studentpass123",
        role: "student",
      },
    });
    
    const { data: loginData } = await api("/auth/login", {
      method: "POST",
      body: { email: studentEmail, password: "studentpass123" },
    });
    
    const { status } = await api("/mentor/students", {
      token: loginData.token.access_token,
      expectStatus: 403,
    });
    assertEqual(status, 403);
  });
}

async function testChat(authToken, userId) {
  log("\n💬 Chat", "cyan");
  
  // Register another user to chat with
  const otherEmail = `e2e-chat-other-${Date.now()}@example.com`;
  const otherUsername = `e2e_chat_${Date.now()}`;
  
  await api("/auth/register", {
    method: "POST",
    body: {
      email: otherEmail,
      username: otherUsername,
      password: "chatpass123",
      role: "student",
    },
  });
  
  const { data: otherLogin } = await api("/auth/login", {
    method: "POST",
    body: { email: otherEmail, password: "chatpass123" },
  });
  
  const otherToken = otherLogin.token.access_token;
  const otherId = otherLogin.user.id;
  
  await test("POST /chat/heartbeat - mark online", async () => {
    const { status, data } = await api("/chat/heartbeat", {
      method: "POST",
      token: authToken,
      body: {},
    });
    assertEqual(status, 200);
    assertEqual(data.ok, true);
  });
  
  await test("POST /chat/messages - send message", async () => {
    const { status, data } = await api("/chat/messages", {
      method: "POST",
      token: authToken,
      body: { receiverId: otherId, content: "Hello from E2E test!" },
    });
    assertEqual(status, 200);
    assertExists(data, "id");
    assertEqual(data.content, "Hello from E2E test!");
  });
  
  await test("GET /chat/messages/:userId - get messages", async () => {
    const { status, data } = await api(`/chat/messages/${otherId}`, { token: authToken });
    assertEqual(status, 200);
    assert(Array.isArray(data), "Expected messages to be an array");
    assert(data.length > 0, "Expected at least one message");
  });
  
  await test("GET /chat/conversations - list conversations", async () => {
    const { status, data } = await api("/chat/conversations", { token: authToken });
    assertEqual(status, 200);
    assert(Array.isArray(data), "Expected conversations to be an array");
    assert(data.length > 0, "Expected at least one conversation");
  });
  
  await test("GET /chat/unread - unread count", async () => {
    const { status, data } = await api("/chat/unread", { token: otherToken });
    assertEqual(status, 200);
    assertExists(data, "count");
    assert(data.count >= 1, "Expected at least 1 unread message");
  });
}

async function testErrorHandling() {
  log("\n⚠️  Error Handling", "cyan");
  
  await test("GET /nonexistent-route - 404", async () => {
    const { status } = await api("/nonexistent-route", { expectStatus: 404 });
    assertEqual(status, 404);
  });
  
  await test("POST /auth/login - missing body", async () => {
    const { status } = await api("/auth/login", {
      method: "POST",
      body: {},
      expectStatus: 401,
    });
    assertEqual(status, 401);
  });
}

// ─── Main Test Runner ─────────────────────────────────────────────────────────

async function runAllTests() {
  console.log("\n" + "═".repeat(60));
  console.log("🧪 Sign Language LMS - Backend E2E Tests");
  console.log("═".repeat(60));
  console.log(`\nTarget: ${BASE_URL}`);
  console.log(`Started: ${new Date().toISOString()}\n`);
  
  // Check server is reachable
  try {
    const { status } = await api("/health");
    log(`✅ Server is running (status: ${status})\n`, "green");
  } catch (err) {
    log(`\n❌ Cannot reach server at ${BASE_URL}`, "red");
    log(`   Error: ${err.message}`, "red");
    log("\n💡 Make sure the backend server is running:", "yellow");
    log("   cd core && npm run dev\n", "yellow");
    process.exit(1);
  }
  
  // Run test suites
  await testHealthCheck();
  await testRegistration();
  const { authToken, userId } = await testAuthentication();
  const { lessonId } = await testLessons();
  await testProgress(authToken, lessonId);
  await testLeaderboard();
  await testAchievements(authToken);
  await testQuiz(lessonId);
  await testMentorRoutes();
  await testChat(authToken, userId);
  await testErrorHandling();
  
  // Summary
  console.log("\n" + "═".repeat(60));
  console.log("📊 Test Results Summary");
  console.log("═".repeat(60));
  console.log(`\n  Total:  ${total}`);
  log(`  Passed: ${passed}`, "green");
  log(`  Failed: ${failed}`, failed > 0 ? "red" : "green");
  console.log(`\n  Duration: ${new Date().toISOString()}`);
  console.log("═".repeat(60) + "\n");
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((err) => {
  console.error("\n💥 Test runner crashed:", err);
  process.exit(1);
});
