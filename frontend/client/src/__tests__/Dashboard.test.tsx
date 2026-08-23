/**
 * Dashboard Page – Component Tests
 *
 * Verifies the dashboard renders user info, stats cards, quick actions,
 * and handles logout correctly.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

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

// Mock wouter
const mockSetLocation = vi.fn();
vi.mock("wouter", () => ({
  useLocation: () => ["/dashboard", mockSetLocation],
}));

// Mock the auth context
const mockLogout = vi.fn().mockResolvedValue(undefined);
vi.mock("@/contexts/AuthContext", () => ({
  useAuthContext: () => ({
    user: {
      id: "1",
      email: "student@example.com",
      username: "student",
      firstName: "Alice",
      lastName: "Smith",
      role: "STUDENT",
      xp: 2500,
      streak: 5,
    },
    logout: mockLogout,
    isAuthenticated: true,
    isLoading: false,
  }),
}));

// Mock the useQuery hook
vi.mock("@/hooks/useQuery", () => ({
  useQuery: (key: string) => {
    if (key === "progress") {
      return {
        data: [
          { id: "p1", userId: "1", lessonId: "l1", status: "COMPLETED", accuracy: 85 },
          { id: "p2", userId: "1", lessonId: "l2", status: "IN_PROGRESS", accuracy: 60 },
        ],
        isLoading: false,
        isError: false,
        error: null,
      };
    }
    if (key === "achievements") {
      return {
        data: [{ id: "a1", title: "First Lesson", unlockedAt: "2025-01-01" }],
        isLoading: false,
        isError: false,
        error: null,
      };
    }
    return { data: null, isLoading: false, isError: false, error: null };
  },
}));

// Mock useInactivityLogout
vi.mock("@/hooks/useInactivityLogout", () => ({
  useInactivityLogout: () => {},
}));

// Mock ProgressTracker
vi.mock("@/components/ProgressTracker", () => ({
  ProgressTracker: ({ user }: any) => (
    <div data-testid="progress-tracker">Progress for {user?.firstName}</div>
  ),
  ProgressChart: ({ progress }: any) => (
    <div data-testid="progress-chart">Chart with {progress?.length} entries</div>
  ),
}));

// Mock Button component
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, className }: any) => (
    <button onClick={onClick} className={className}>{children}</button>
  ),
}));

// Import AFTER mocks
import Dashboard from "@/pages/Dashboard";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Dashboard Page", () => {
  it("renders the dashboard heading", () => {
    render(<Dashboard />);
    expect(screen.getByText("Dashboard")).toBeTruthy();
  });

  it("shows a welcome message with the user's first name", () => {
    render(<Dashboard />);
    expect(screen.getByText("Welcome back, Alice!")).toBeTruthy();
  });

  it("renders the ProgressTracker component", () => {
    render(<Dashboard />);
    expect(screen.getByTestId("progress-tracker")).toBeTruthy();
    expect(screen.getByText("Progress for Alice")).toBeTruthy();
  });

  it("renders the ProgressChart component", () => {
    render(<Dashboard />);
    expect(screen.getByTestId("progress-chart")).toBeTruthy();
  });

  it("displays the Lessons Completed stat card", () => {
    render(<Dashboard />);
    expect(screen.getByText("Lessons Completed")).toBeTruthy();
  });

  it("displays the Achievements stat card", () => {
    render(<Dashboard />);
    expect(screen.getByText("Achievements")).toBeTruthy();
  });

  it("displays the Next Milestone stat card", () => {
    render(<Dashboard />);
    expect(screen.getByText("Next Milestone")).toBeTruthy();
    expect(screen.getByText("XP to 10,000")).toBeTruthy();
  });

  it("renders Quick Actions section", () => {
    render(<Dashboard />);
    expect(screen.getByText("Quick Actions")).toBeTruthy();
    expect(screen.getByText("Browse Lessons")).toBeTruthy();
    expect(screen.getByText("View Leaderboard")).toBeTruthy();
  });

  it("navigates to /lessons when Browse Lessons is clicked", () => {
    render(<Dashboard />);
    const browseBtn = screen.getByText("Browse Lessons");
    fireEvent.click(browseBtn);
    expect(mockSetLocation).toHaveBeenCalledWith("/lessons");
  });

  it("navigates to /leaderboard when View Leaderboard is clicked", () => {
    render(<Dashboard />);
    const leaderboardBtn = screen.getByText("View Leaderboard");
    fireEvent.click(leaderboardBtn);
    expect(mockSetLocation).toHaveBeenCalledWith("/leaderboard");
  });

  it("calls logout and redirects to /login on logout click", async () => {
    render(<Dashboard />);
    const logoutBtn = screen.getByText("Logout");
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockSetLocation).toHaveBeenCalledWith("/login");
    });
  });

  it("displays the inactivity timeout tip", () => {
    render(<Dashboard />);
    expect(screen.getByText(/automatically logged out after 10 minutes/)).toBeTruthy();
  });
});
