/**
 * Custom Hooks – Unit Tests
 *
 * Tests the useQuery and useMutation hooks for data fetching,
 * caching, loading states, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useQuery, useMutation } from "@/hooks/useQuery";

beforeEach(() => {
  vi.clearAllMocks();
});

// ── useQuery ─────────────────────────────────────────────────────────────────

describe("useQuery", () => {
  it("starts in loading state and fetches data", async () => {
    const fetcher = vi.fn().mockResolvedValue({ name: "test" });

    const { result } = renderHook(() => useQuery("test-key", fetcher));

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({ name: "test" });
    expect(result.current.isError).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("sets error state when fetcher throws", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useQuery("error-key", fetcher));

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("Network error");
    expect(result.current.data).toBeNull();
  });

  it("does not fetch when enabled is false", async () => {
    const fetcher = vi.fn().mockResolvedValue("data");

    const { result } = renderHook(() =>
      useQuery("disabled-key", fetcher, { enabled: false })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetcher).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });

  it("respects staleTime and does not re-fetch within the window", async () => {
    const fetcher = vi.fn().mockResolvedValue("data");

    // First render
    const { result, rerender } = renderHook(() =>
      useQuery("stale-key", fetcher, { staleTime: 60000 })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetcher).toHaveBeenCalledTimes(1);

    // Re-render immediately — should NOT re-fetch due to staleTime
    rerender();

    // Wait a tick
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Still only 1 call because staleTime hasn't elapsed
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("refetch attempts to re-fetch (note: hook has a staleTime closure race)", async () => {
    const fetcher = vi.fn().mockResolvedValue("data");

    const { result } = renderHook(() =>
      useQuery("refetch-key", fetcher, { staleTime: 0 })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetcher).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refetch();
    });

    // With staleTime=0, refetch should trigger a new fetch
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

// ── useMutation ──────────────────────────────────────────────────────────────

describe("useMutation", () => {
  it("starts with isLoading false", () => {
    const mutationFn = vi.fn().mockResolvedValue("done");

    const { result } = renderHook(() => useMutation(mutationFn));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.isError).toBe(false);
  });

  it("sets data on successful mutation", async () => {
    const mutationFn = vi.fn().mockResolvedValue({ id: 1, status: "ok" });

    const { result } = renderHook(() => useMutation(mutationFn));

    await act(async () => {
      const res = await result.current.mutate({ lessonId: "l1" });
      expect(res).toEqual({ id: 1, status: "ok" });
    });

    expect(result.current.data).toEqual({ id: 1, status: "ok" });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("sets error state when mutation fails", async () => {
    const mutationFn = vi.fn().mockRejectedValue(new Error("Server error"));

    const { result } = renderHook(() => useMutation(mutationFn));

    await act(async () => {
      try {
        await result.current.mutate({ lessonId: "l1" });
      } catch {
        // Expected
      }
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error?.message).toBe("Server error");
    expect(result.current.isLoading).toBe(false);
  });

  it("calls onSuccess callback on successful mutation", async () => {
    const onSuccess = vi.fn();
    const mutationFn = vi.fn().mockResolvedValue("done");

    const { result } = renderHook(() =>
      useMutation(mutationFn, { onSuccess })
    );

    await act(async () => {
      await result.current.mutate({ value: 42 });
    });

    expect(onSuccess).toHaveBeenCalledWith("done");
  });

  it("calls onError callback on failed mutation", async () => {
    const onError = vi.fn();
    const mutationFn = vi.fn().mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() =>
      useMutation(mutationFn, { onError })
    );

    await act(async () => {
      try {
        await result.current.mutate({ value: 42 });
      } catch {
        // Expected
      }
    });

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it("reset clears all state", async () => {
    const mutationFn = vi.fn().mockResolvedValue("done");

    const { result } = renderHook(() => useMutation(mutationFn));

    await act(async () => {
      await result.current.mutate({ x: 1 });
    });

    expect(result.current.data).toBe("done");

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.isError).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });
});
