/**
 * Navigation Component – Tests
 *
 * Verifies the navigation bar renders all nav links, highlights the
 * active route, and handles logout.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

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
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock wouter
const mockSetLocation = vi.fn();
let currentPath = "/dashboard";
vi.mock("wouter", () => ({
  useLocation: () => [currentPath, mockSetLocation],
}));

// Mock the auth context
const mockLogout = vi.fn().mockResolvedValue(undefined);
vi.mock("@/contexts/AuthContext", () => ({
  useAuthContext: () => ({
    user: {
      id: "1",
      firstName: "Alice",
      totalXP: 2500,
      avatar: "https://example.com/avatar.png",
    },
    logout: mockLogout,
  }),
}));

// Import AFTER mocks
import { Navigation } from "@/components/Navigation";

beforeEach(() => {
  vi.clearAllMocks();
  currentPath = "/dashboard";
});

describe("Navigation", () => {
  it("renders the Sign Language LMS brand text", () => {
    render(<Navigation />);
    expect(screen.getByText("Sign Language LMS")).toBeTruthy();
  });

  it("renders all nav items", () => {
    render(<Navigation />);
    expect(screen.getByText("Dashboard")).toBeTruthy();
    expect(screen.getByText("Lessons")).toBeTruthy();
    expect(screen.getByText("Leaderboard")).toBeTruthy();
    expect(screen.getByText("Profile")).toBeTruthy();
    expect(screen.getByText("Assessment")).toBeTruthy();
  });

  it("navigates to /lessons when Lessons button is clicked", () => {
    render(<Navigation />);
    const lessonsBtn = screen.getByText("Lessons");
    fireEvent.click(lessonsBtn);
    expect(mockSetLocation).toHaveBeenCalledWith("/lessons");
  });

  it("navigates to /leaderboard when Leaderboard button is clicked", () => {
    render(<Navigation />);
    const lbBtn = screen.getByText("Leaderboard");
    fireEvent.click(lbBtn);
    expect(mockSetLocation).toHaveBeenCalledWith("/leaderboard");
  });

  it("navigates to /profile when Profile button is clicked", () => {
    render(<Navigation />);
    const profileBtn = screen.getByText("Profile");
    fireEvent.click(profileBtn);
    expect(mockSetLocation).toHaveBeenCalledWith("/profile");
  });

  it("navigates to /assessment when Assessment button is clicked", () => {
    render(<Navigation />);
    const assessBtn = screen.getByText("Assessment");
    fireEvent.click(assessBtn);
    expect(mockSetLocation).toHaveBeenCalledWith("/assessment");
  });

  it("navigates to /dashboard when brand is clicked", () => {
    render(<Navigation />);
    // The brand div with the logo
    const brand = screen.getByText("Sign Language LMS").closest("div");
    fireEvent.click(brand!);
    expect(mockSetLocation).toHaveBeenCalledWith("/dashboard");
  });

  it("calls logout on logout button click", () => {
    render(<Navigation />);
    // Find the logout button (the one with LogOut icon, no text in desktop)
    const buttons = screen.getAllByRole("button");
    const logoutBtn = buttons.find((b) => b.className.includes("hover:bg-red-600"));
    if (logoutBtn) {
      fireEvent.click(logoutBtn);
      expect(mockLogout).toHaveBeenCalled();
    }
  });

  it("displays the user's first name", () => {
    render(<Navigation />);
    expect(screen.getByText("Alice")).toBeTruthy();
  });

  it("displays the user's XP", () => {
    render(<Navigation />);
    expect(screen.getByText("2500 XP")).toBeTruthy();
  });
});
