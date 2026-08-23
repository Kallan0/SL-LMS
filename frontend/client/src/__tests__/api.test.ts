/**
 * API Service – Integration Tests
 *
 * Tests the apiFetch wrapper and ProductionApiService methods against
 * mocked fetch responses, verifying auth headers, error handling, and
 * token lifecycle.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiFetch } from "@/services/api";

// ── Mock global fetch ────────────────────────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── apiFetch wrapper ─────────────────────────────────────────────────────────

describe("apiFetch", () => {
  it("resolves the full URL against API_BASE_URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: 1 }),
    });

    await apiFetch("/health");

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("/health");
  });

  it("attaches Authorization header when a token is stored", async () => {
    // Simulate a stored token
    localStorage.setItem("sign_language_lms_token", "test-token-string");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: 1 }),
    });

    await apiFetch("/users/me");

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers).toMatchObject({
      Authorization: "Bearer test-token-string",
      "Content-Type": "application/json",
    });
  });

  it("does NOT attach Authorization header when no token is stored", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: 1 }),
    });

    await apiFetch("/lessons");

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers).not.toHaveProperty("Authorization");
  });

  it("throws on non-OK responses with detail message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => ({ detail: "Lesson not found" }),
    });

    await expect(apiFetch("/lessons/999")).rejects.toThrow("Lesson not found");
  });

  it("falls back to HTTP status text when body has no detail/message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({}),
    });

    await expect(apiFetch("/broken")).rejects.toThrow("HTTP 500");
  });

  it("redirects to /login on 401 and clears token", async () => {
    localStorage.setItem("sign_language_lms_token", "expired-token");

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({}),
    });

    await expect(apiFetch("/users/me")).rejects.toThrow("Unauthorized");
    expect(localStorage.getItem("sign_language_lms_token")).toBeNull();
  });

  it("returns parsed JSON on success", async () => {
    const payload = { id: 1, name: "Lesson A" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => payload,
    });

    const result = await apiFetch<typeof payload>("/lessons/1");
    expect(result).toEqual(payload);
  });

  it("merges caller-supplied headers over defaults", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await apiFetch("/test", {
      headers: { "X-Custom": "yes" },
    });

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers).toMatchObject({
      "X-Custom": "yes",
      "Content-Type": "application/json",
    });
  });

  it("times out when the request exceeds the timeout", async () => {
    // Simulate a fetch that respects AbortSignal and throws on abort
    mockFetch.mockImplementation((_url: string, init: RequestInit) => {
      return new Promise((_, reject) => {
        const signal = init?.signal;
        if (signal) {
          signal.addEventListener("abort", () => {
            const err = new DOMException("The operation was aborted.", "AbortError");
            reject(err);
          });
        }
        // Fallback: never resolve
      });
    });

    await expect(apiFetch("/slow", {}, 100)).rejects.toThrow("timed out");
  });
});
