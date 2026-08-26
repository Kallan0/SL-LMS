/**
 * Combined E2E Test Runner
 * 
 * 1. Starts the backend server on port 5000
 * 2. Runs backend E2E tests
 * 3. Runs frontend vitest tests
 * 4. Starts the frontend dev server
 * 
 * Run: node run-all-e2e.mjs
 */

import { spawn, execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

const BACKEND_PORT = 5000;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

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

  const response = await fetch(`${BACKEND_URL}${endpoint}`, config);
  
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

// ─── Backend Test Suites ──────────────────────────────────────────────────────

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
  
  await test("Login as mentor", async () => {
    const { data } = await api("/auth/login", {
      method: "POST",
      body: { email: mentorEmail, password: "mentorpass123" },
    });
    assertEqual(data.user.role, "MENTOR");
  });
  
  let mentorToken = null;
  
  const { data: loginData } = await api("/auth/login", {
    method: "POST",
    body: { email: mentorEmail, password: "mentorpass123" },
  });
  mentorToken = loginData.token.access_token;
  
  await test("GET /mentor/students - with mentor role", async () => {
    const { status, data } = await api("/mentor/students", { token: mentorToken });
    assertEqual(status, 200);
    assert(Array.isArray(data), "Expected students to be an array");
  });
  
  await test("GET /mentor/students - with student role (forbidden)", async () => {
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
    
    const { data: studentLogin } = await api("/auth/login", {
      method: "POST",
      body: { email: studentEmail, password: "studentpass123" },
    });
    
    const { status } = await api("/mentor/students", {
      token: studentLogin.token.access_token,
      expectStatus: 403,
    });
    assertEqual(status, 403);
  });
}

async function testChat(authToken) {
  log("\n💬 Chat", "cyan");
  
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
    });
    assert(status === 401 || status === 500, `Expected 401 or 500, got ${status}`);
  });
}

// ─── Server Management ────────────────────────────────────────────────────────

function startServer() {
  return new Promise((resolve, reject) => {
    process.env.PORT = String(BACKEND_PORT);
    
    const server = spawn("node", ["dist/index.js"], {
      cwd: path.join(PROJECT_ROOT, "core"),
      env: { ...process.env, PORT: String(BACKEND_PORT) },
      stdio: ["pipe", "pipe", "pipe"],
    });
    
    server.stdout.on("data", (data) => {
      const msg = data.toString();
      console.log(`[SERVER] ${msg.trim()}`);
    });
    
    server.stderr.on("data", (data) => {
      const msg = data.toString();
      console.error(`[SERVER ERR] ${msg.trim()}`);
    });
    
    server.on("error", (err) => reject(err));
    
    setTimeout(() => resolve(server), 3000);
  });
}

async function waitForServer(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const { status } = await api("/health");
      if (status === 200) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

// ─── Frontend Test Runner ─────────────────────────────────────────────────────

async function runFrontendTests() {
  log("\n🧪 Running Frontend Vitest Tests...", "cyan");
  log("(These test the API integration layer)\n", "yellow");
  
  return new Promise((resolve) => {
    const testProcess = spawn("npx", ["vitest", "run", "--reporter=verbose"], {
      cwd: path.join(PROJECT_ROOT, "frontend"),
      env: { ...process.env, API_BASE_URL: BACKEND_URL },
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    });
    
    testProcess.stdout.on("data", (data) => {
      const lines = data.toString().split("\n");
      for (const line of lines) {
        if (line.includes("✓") || line.includes("×") || line.includes("↓")) {
          log(line.trim(), line.includes("✓") ? "green" : line.includes("×") ? "red" : "yellow");
        }
      }
    });
    
    testProcess.stderr.on("data", (data) => {
      console.error(`[VITEST ERR] ${data.toString().trim()}`);
    });
    
    testProcess.on("close", (code) => {
      if (code === 0) {
        log("\n✅ Frontend tests completed successfully!", "green");
      } else {
        log("\n⚠️  Some frontend tests failed (backend may not be running on port 5000)", "yellow");
      }
      resolve(code);
    });
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n" + "═".repeat(60));
  console.log("🧪 Sign Language LMS - Full E2E Test Suite");
  console.log("═".repeat(60));
  console.log(`\nBackend: ${BACKEND_URL}`);
  console.log(`Started: ${new Date().toISOString()}\n`);
  
  // Start backend server
  log("🚀 Starting backend server...", "yellow");
  let server;
  try {
    server = await startServer();
  } catch (err) {
    log(`\n❌ Failed to start server: ${err.message}`, "red");
    process.exit(1);
  }
  
  log("⏳ Waiting for server to be ready...", "yellow");
  const ready = await waitForServer();
  if (!ready) {
    log("\n❌ Server failed to start within timeout", "red");
    server.kill();
    process.exit(1);
  }
  log("✅ Backend server is ready!\n", "green");
  
  // Run backend tests
  await testHealthCheck();
  await testRegistration();
  const { authToken } = await testAuthentication();
  const { lessonId } = await testLessons();
  await testProgress(authToken, lessonId);
  await testLeaderboard();
  await testAchievements(authToken);
  await testQuiz(lessonId);
  await testMentorRoutes();
  await testChat(authToken);
  await testErrorHandling();
  
  // Summary for backend
  console.log("\n" + "═".repeat(60));
  console.log("📊 Backend Test Results");
  console.log("═".repeat(60));
  console.log(`\n  Total:  ${total}`);
  log(`  Passed: ${passed}`, "green");
  log(`  Failed: ${failed}`, failed > 0 ? "red" : "green");
  console.log("═".repeat(60) + "\n");
  
  // Run frontend tests
  const frontendResult = await runFrontendTests();
  
  // Final summary
  console.log("\n" + "═".repeat(60));
  console.log("🎯 Final Results");
  console.log("═".repeat(60));
  log(`  Backend:  ${passed} passed, ${failed} failed`, failed > 0 ? "red" : "green");
  log(`  Frontend: ${frontendResult === 0 ? "✅ All passed" : "⚠️  Some failed"}`, frontendResult === 0 ? "green" : "yellow");
  console.log("═".repeat(60) + "\n");
  
  // Cleanup
  server.kill();
  
  process.exit(failed > 0 || frontendResult !== 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("\n💥 Runner crashed:", err);
  process.exit(1);
});
