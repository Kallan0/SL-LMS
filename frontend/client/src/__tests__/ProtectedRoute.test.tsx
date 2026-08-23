/**
 * ProtectedRoute Component – Tests
 *
 * Verifies that the ProtectedRoute redirects unauthenticated users to /login,
 * shows a loading state while checking auth, and renders children when
 * authenticated.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// Mock wouter
const mockSetLocation = vi.fn();
vi.mock("wouter", () => ({
  useLocation: () => ["/dashboard", mockSetLocation],
}));

// We'll control the mock per-test
let mockAuthState: {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuthContext: () => mockAuthState,
}));

// Import AFTER mocks
import { ProtectedRoute } from "@/components/ProtectedRoute";

beforeEach(() => {
  vi.clearAllMocks();
  mockSetLocation.mockClear();
  mockAuthState = {
    isAuthenticated: false,
    isLoading: false,
    user: null,
  };
});

describe("ProtectedRoute", () => {
  it("shows loading state while auth is loading", () => {
    mockAuthState = { isAuthenticated: false, isLoading: true, user: null };
    render(
      <ProtectedRoute>
        <div>Secret Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Loading...")).toBeTruthy();
    expect(screen.queryByText("Secret Content")).toBeNull();
  });

  it("redirects to /login when not authenticated", async () => {
    mockAuthState = { isAuthenticated: false, isLoading: false, user: null };
    render(
      <ProtectedRoute>
        <div>Secret Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockSetLocation).toHaveBeenCalledWith("/login");
    });
  });

  it("renders children when authenticated", () => {
    mockAuthState = {
      isAuthenticated: true,
      isLoading: false,
      user: { id: "1", role: "STUDENT" },
    };
    render(
      <ProtectedRoute>
        <div>Secret Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Secret Content")).toBeTruthy();
  });

  it("redirects to /dashboard when role does not match requiredRole", async () => {
    mockAuthState = {
      isAuthenticated: true,
      isLoading: false,
      user: { id: "1", role: "STUDENT" },
    };
    render(
      <ProtectedRoute requiredRole="MENTOR">
        <div>Mentor Only Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockSetLocation).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("renders children when role matches requiredRole", () => {
    mockAuthState = {
      isAuthenticated: true,
      isLoading: false,
      user: { id: "1", role: "MENTOR" },
    };
    render(
      <ProtectedRoute requiredRole="MENTOR">
        <div>Mentor Only Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Mentor Only Content")).toBeTruthy();
  });
});
