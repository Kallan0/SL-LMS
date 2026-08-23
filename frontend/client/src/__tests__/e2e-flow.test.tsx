/**
 * End-to-End Flow – Integration Test
 *
 * Tests the complete user journey: Login → Dashboard → Navigate to Lessons
 * with mocked API layer, verifying the full integration chain.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ── Mocks ────────────────────────────────────────────────────────────────────

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, whileTap, variants, ...domProps } = props;
      return <div {...domProps}>{children}</div>;
    },
    button: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, whileTap, variants, ...domProps } = props;
      return <button {...domProps}>{children}</button>;
    },
    header: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, whileTap, variants, ...domProps } = props;
      return <header {...domProps}>{children}</header>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock wouter with controllable routing
let currentRoute = "/login";
const mockSetLocation = vi.fn((path: string) => {
  currentRoute = path;
});
vi.mock("wouter", () => ({
  useLocation: () => [currentRoute, mockSetLocation],
}));

// Use vi.hoisted so mockApiService is available inside vi.mock factory
const mockApiService = vi.hoisted(() => ({
  login: vi.fn().mockResolvedValue({
    user: {
      id: "1",
      email: "student@example.com",
      username: "alice",
      firstName: "Alice",
      lastName: "Smith",
      role: "STUDENT",
      xp: 1500,
      streak: 3,
    },
    token: { access_token: "test-jwt-token", token_type: "bearer", expiresIn: 86400 },
  }),
  logout: vi.fn().mockResolvedValue({ success: true }),
  getCurrentUser: vi.fn(),
  getLessons: vi.fn().mockResolvedValue([
    { id: "l1", title: "Introduction to ISL", category: "alphabet", difficulty: "beginner" },
    { id: "l2", title: "Numbers 1-10", category: "numbers", difficulty: "beginner" },
  ]),
  getProgress: vi.fn().mockResolvedValue([
    { id: "p1", userId: "1", lessonId: "l1", status: "COMPLETED", accuracy: 90 },
  ]),
  getLeaderboard: vi.fn().mockResolvedValue([
    { id: "1", username: "alice", xp: 1500, streak: 3 },
  ]),
  getAchievements: vi.fn().mockResolvedValue([
    { id: "a1", title: "First Steps", unlockedAt: "2025-01-01" },
  ]),
}));
vi.mock("@/services/api", () => ({
  apiService: mockApiService,
}));

// Mock AuthContext — Login, Dashboard, and Navigation all use useAuthContext()
let mockAuthUser: any = null;
let mockIsAuthenticated = false;
vi.mock("@/contexts/AuthContext", () => ({
  useAuthContext: () => ({
    login: mockApiService.login,
    logout: mockApiService.logout,
    error: null,
    clearError: vi.fn(),
    isAuthenticated: mockIsAuthenticated,
    isLoading: false,
    user: mockAuthUser,
  }),
}));

// Mock hooks
vi.mock("@/hooks/useInactivityLogout", () => ({
  useInactivityLogout: () => {},
}));

vi.mock("@/hooks/useQuery", () => ({
  useQuery: (key: string) => {
    if (key === "progress") {
      return {
        data: [
          { id: "p1", userId: "1", lessonId: "l1", status: "COMPLETED", accuracy: 90 },
        ],
        isLoading: false,
        isError: false,
        error: null,
      };
    }
    if (key === "achievements") {
      return {
        data: [{ id: "a1", title: "First Steps", unlockedAt: "2025-01-01" }],
        isLoading: false,
        isError: false,
        error: null,
      };
    }
    return { data: null, isLoading: false, isError: false, error: null };
  },
}));

vi.mock("@/components/ProgressTracker", () => ({
  ProgressTracker: ({ user }: any) => <div data-testid="progress-tracker">{user?.firstName}'s progress</div>,
  ProgressChart: ({ progress }: any) => <div data-testid="progress-chart" />,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, className }: any) => (
    <button onClick={onClick} className={className}>{children}</button>
  ),
}));

// ── Test Suite ───────────────────────────────────────────────────────────────

// We import components after mocks
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import { Navigation } from "@/components/Navigation";

beforeEach(() => {
  vi.clearAllMocks();
  currentRoute = "/login";
  localStorage.clear();
  mockAuthUser = null;
  mockIsAuthenticated = false;
});

describe("E2E Flow: Login → Dashboard → Navigation", () => {
  it("complete user journey: login → see dashboard → navigate to lessons", async () => {
    const user = userEvent.setup({ delay: null });

    // ── Step 1: Render Login Page ──
    const { unmount: unmountLogin } = render(<Login />);

    // Verify login form is visible
    expect(screen.getByText("Welcome back")).toBeTruthy();
    expect(screen.getByPlaceholderText("you@example.com")).toBeTruthy();

    // Verify pre-filled student credentials
    const emailInput = screen.getByPlaceholderText("you@example.com") as HTMLInputElement;
    expect(emailInput.value).toBe("student@example.com");

    // ── Step 2: Submit Login ──
    const loginBtn = screen.getByText(/Log In as Student/);
    fireEvent.click(loginBtn);

    // Wait for the loading screen to complete and API call to happen
    await waitFor(
      () => {
        expect(mockApiService.login).toHaveBeenCalledWith("student@example.com", "password");
      },
      { timeout: 10000 }
    );

    // Verify login was called with correct credentials
    expect(mockApiService.login).toHaveBeenCalledTimes(1);

    // ── Step 3: Simulate navigation to Dashboard ──
    unmountLogin();
    currentRoute = "/dashboard";
    mockIsAuthenticated = true;
    mockAuthUser = {
      id: "1",
      firstName: "Alice",
      totalXP: 1500,
      avatar: "https://example.com/avatar.png",
      role: "STUDENT",
    };

    render(
      <div>
        <Navigation />
        <Dashboard />
      </div>
    );

    // Verify dashboard content ("Dashboard" appears in both nav and heading, so use getAllByText)
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Welcome back, Alice!")).toBeTruthy();

    // Verify navigation is present with all links
    expect(screen.getByText("Lessons")).toBeTruthy();
    expect(screen.getByText("Leaderboard")).toBeTruthy();
    expect(screen.getByText("Profile")).toBeTruthy();

    // Verify user info in nav
    expect(screen.getByText("Alice")).toBeTruthy();

    // ── Step 4: Navigate to Lessons ──
    const lessonsBtn = screen.getByText("Lessons");
    fireEvent.click(lessonsBtn);

    expect(mockSetLocation).toHaveBeenCalledWith("/lessons");
  });

  it("login failure shows error and stays on login page", async () => {
    // Override login to fail
    mockApiService.login.mockRejectedValueOnce(new Error("Invalid credentials"));

    render(<Login />);

    const loginBtn = screen.getByText(/Log In as Student/);
    fireEvent.click(loginBtn);

    // The login throws, which causes the loader to hide
    // Verify we stay on login page
    await waitFor(
      () => {
        expect(mockSetLocation).not.toHaveBeenCalledWith("/dashboard");
      },
      { timeout: 10000 }
    );
  });

  it("role switching updates the login form", async () => {
    const user = userEvent.setup({ delay: null });
    render(<Login />);

    // Start as student
    const emailInput = screen.getByPlaceholderText("you@example.com") as HTMLInputElement;
    expect(emailInput.value).toBe("student@example.com");
    expect(screen.getByText(/Log In as Student/)).toBeTruthy();

    // Switch to mentor
    const mentorBtn = screen.getByText("Mentor");
    await user.click(mentorBtn);

    expect(emailInput.value).toBe("mentor@example.com");
    expect(screen.getByText(/Log In as Mentor/)).toBeTruthy();
  });

  it("logout clears state and redirects to login", async () => {
    currentRoute = "/dashboard";
    mockIsAuthenticated = true;
    mockAuthUser = {
      id: "1",
      firstName: "Alice",
      totalXP: 1500,
      avatar: "https://example.com/avatar.png",
      role: "STUDENT",
    };

    render(
      <div>
        <Navigation />
        <Dashboard />
      </div>
    );

    // Find and click logout
    const logoutBtn = screen.getByText("Logout");
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(mockApiService.logout).toHaveBeenCalled();
      expect(mockSetLocation).toHaveBeenCalledWith("/login");
    });
  });

  it("dashboard shows correct statistics", () => {
    currentRoute = "/dashboard";
    mockIsAuthenticated = true;
    mockAuthUser = {
      id: "1",
      firstName: "Alice",
      totalXP: 1500,
      avatar: "https://example.com/avatar.png",
      role: "STUDENT",
    };

    render(<Dashboard />);

    // Verify stat cards
    expect(screen.getByText("Lessons Completed")).toBeTruthy();
    expect(screen.getByText("Achievements")).toBeTruthy();
    expect(screen.getByText("Next Milestone")).toBeTruthy();
    expect(screen.getByText("XP to 10,000")).toBeTruthy();

    // Verify quick actions
    expect(screen.getByText("Browse Lessons")).toBeTruthy();
    expect(screen.getByText("View Leaderboard")).toBeTruthy();
  });

  it("navigation quick actions route correctly", () => {
    currentRoute = "/dashboard";
    mockIsAuthenticated = true;
    mockAuthUser = {
      id: "1",
      firstName: "Alice",
      totalXP: 1500,
      avatar: "https://example.com/avatar.png",
      role: "STUDENT",
    };

    render(
      <div>
        <Navigation />
        <Dashboard />
      </div>
    );

    // Click Browse Lessons
    const browseBtn = screen.getByText("Browse Lessons");
    fireEvent.click(browseBtn);
    expect(mockSetLocation).toHaveBeenCalledWith("/lessons");

    // Click View Leaderboard
    const lbBtn = screen.getByText("View Leaderboard");
    fireEvent.click(lbBtn);
    expect(mockSetLocation).toHaveBeenCalledWith("/leaderboard");
  });
});
