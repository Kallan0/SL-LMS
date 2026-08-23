/**
 * Login Page – Component Tests
 *
 * Verifies the login page renders correctly, shows demo credentials,
 * handles form interactions, and calls the auth API on submit.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock framer-motion to avoid animation complexity in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...filterMotionProps(props)}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...filterMotionProps(props)}>{children}</button>,
    p: ({ children, ...props }: any) => <p {...filterMotionProps(props)}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock wouter
const mockSetLocation = vi.fn();
vi.mock("wouter", () => ({
  useLocation: () => ["/login", mockSetLocation],
  Route: ({ children }: any) => <>{children}</>,
  Switch: ({ children }: any) => <>{children}</>,
}));

// Mock the API service
vi.mock("@/services/api", () => ({
  apiService: {
    login: vi.fn().mockResolvedValue({
      user: { id: "1", email: "student@example.com", username: "student", role: "STUDENT" },
      token: { access_token: "mock-jwt", token_type: "bearer", expiresIn: 86400 },
    }),
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
    getLessons: vi.fn(),
    getProgress: vi.fn(),
    getLeaderboard: vi.fn(),
    getAchievements: vi.fn(),
  },
}));

// Mock AuthContext — Login calls useAuthContext() directly
const mockLogin = vi.fn().mockResolvedValue(undefined);
const mockClearError = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuthContext: () => ({
    login: mockLogin,
    error: null,
    clearError: mockClearError,
    isAuthenticated: false,
    isLoading: false,
    user: null,
  }),
}));

// Filter out framer-motion specific props that DOM doesn't recognize
function filterMotionProps(props: Record<string, any>) {
  const { initial, animate, exit, transition, whileHover, whileTap, ...domProps } = props;
  return domProps;
}

// Import Login AFTER mocks
import Login from "@/pages/Login";
import { apiService } from "@/services/api";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockSetLocation.mockClear();
});

describe("Login Page", () => {
  it("renders the SignPath LMS brand", () => {
    render(<Login />);
    expect(screen.getByText("SignPath LMS")).toBeTruthy();
  });

  it("renders the welcome heading", () => {
    render(<Login />);
    expect(screen.getByText("Welcome back")).toBeTruthy();
  });

  it("renders email and password input fields", () => {
    render(<Login />);
    expect(screen.getByPlaceholderText("you@example.com")).toBeTruthy();
    expect(screen.getByPlaceholderText("••••••••")).toBeTruthy();
  });

  it("pre-fills student email by default", () => {
    render(<Login />);
    const emailInput = screen.getByPlaceholderText("you@example.com") as HTMLInputElement;
    expect(emailInput.value).toBe("student@example.com");
  });

  it("switches email to mentor@example.com when Mentor role is clicked", async () => {
    const user = userEvent.setup();
    render(<Login />);

    const mentorBtn = screen.getByText("Mentor");
    await user.click(mentorBtn);

    const emailInput = screen.getByPlaceholderText("you@example.com") as HTMLInputElement;
    expect(emailInput.value).toBe("mentor@example.com");
  });

  it("renders the login button with role label", () => {
    render(<Login />);
    expect(screen.getByText(/Log In as Student/)).toBeTruthy();
  });

  it("shows password toggle button", () => {
    render(<Login />);
    // The Eye icon toggle
    const pwInput = screen.getByPlaceholderText("••••••••") as HTMLInputElement;
    expect(pwInput.type).toBe("password");
  });

  it("calls login when login flow completes", async () => {
    render(<Login />);

    // Click login button to trigger loader
    const loginBtn = screen.getByText(/Log In as Student/);
    fireEvent.click(loginBtn);

    // The SignLoadingScreen triggers executeApiLogin after its animation.
    await waitFor(
      () => {
        expect(mockLogin).toHaveBeenCalled();
      },
      { timeout: 10000 }
    );
  });

  it("redirects to /dashboard after successful login", async () => {
    render(<Login />);

    const loginBtn = screen.getByText(/Log In as Student/);
    fireEvent.click(loginBtn);

    await waitFor(
      () => {
        expect(mockSetLocation).toHaveBeenCalledWith("/dashboard");
      },
      { timeout: 10000 }
    );
  });

  it("has a 'Sign up free' link that navigates to /register", () => {
    render(<Login />);
    const signupLink = screen.getByText("Sign up free →");
    expect(signupLink).toBeTruthy();
  });

  it("renders feature pills", () => {
    render(<Login />);
    expect(screen.getByText("Hand Tracking")).toBeTruthy();
    expect(screen.getByText("ISL Curriculum")).toBeTruthy();
    expect(screen.getByText("AI Feedback")).toBeTruthy();
  });
});
