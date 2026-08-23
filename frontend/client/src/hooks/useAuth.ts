/**
 * useAuth Hook
 * 
 * Manages authentication state, JWT token storage, and user session.
 * Provides methods for login, logout, and token management.
 */

import { useEffect, useState, useCallback } from "react";
import { apiService } from "@/services/api";
import { User, AuthToken } from "@/types/index";

const JWT_STORAGE_KEY = import.meta.env.VITE_JWT_STORAGE_KEY || "sign_language_lms_token";

export interface AuthState {
  user: User | null;
  token: AuthToken | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface UseAuthReturn extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, role: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshToken: (newToken: AuthToken) => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

/**
 * Custom hook for authentication management
 */
export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    error: null,
    isAuthenticated: false,
  });

  /**
   * Initialize auth state from stored token
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const rawToken = getRawToken();
        
        if (rawToken) {
          const authToken: AuthToken = { access_token: rawToken, token_type: "bearer", expiresIn: 86400 };
          // Verify token is still valid by fetching current user
          const currentUser = await apiService.getCurrentUser();
          setState((prev) => ({
            ...prev,
            user: { ...currentUser, id: String(currentUser.id) },
            token: authToken,
            isAuthenticated: true,
            isLoading: false,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error("Failed to initialize auth", error);
        // Clear invalid token
        clearRawToken();
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Session expired. Please login again.",
        }));
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login user with email and password
   */
  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiService.login(email, password);
      
      // api.ts already stores the raw JWT in localStorage — no need to duplicate
      const authToken: AuthToken = response.token ?? {
        access_token: "",
        token_type: "bearer",
        expiresIn: 86400,
      };

      const user = response.user;
      if (!user) {
        throw new Error("Login succeeded but no user data was returned");
      }

      setState((prev) => ({
        ...prev,
        user: { ...user, id: String(user.id) },
        token: authToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      console.error("Login error:", error);
      
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      throw error;
    }
  }, []);

  /**
   * Register a new userr
   */

    const register = useCallback(async (email: string, username: string, password: string, role: string, firstName: string, lastName: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await apiService.register(email, username, password, role, firstName, lastName);

        // Registration may or may not return a token/user — handle both cases
        if (response?.user) {
          setState((prev) => ({
            ...prev,
            user: { ...response.user, id: String(response.user.id) },
            token: response.token ?? null,
            isAuthenticated: !!response.token,
            isLoading: false,
            error: null,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: null,
          }));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Registration not successful";
        console.error("Registration Error:", error);

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    }, []);
  /**
   * Logout user and clear session
   */
  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    
    try {
      await apiService.logout();
      clearRawToken();
      
      setState((prev) => ({
        ...prev,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local state even if API call fails
      clearRawToken();
      
      setState((prev) => ({
        ...prev,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      }));
    }
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Update stored token (useful for token refresh)
   */
  const refreshToken = useCallback((newToken: AuthToken) => {
    setState((prev) => ({
      ...prev,
      token: newToken,
    }));
  }, []);

  /**
   * Update user profile via API and refresh local state
   */
  const updateUser = useCallback(async (updates: Partial<User>) => {
    const updated = await apiService.updateProfile(updates);
    setState((prev) => ({
      ...prev,
      user: { ...prev.user, ...updated, id: String(updated.id) } as User,
    }));
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    clearError,
    refreshToken,
    updateUser,
  };
}

/**
 * Read the raw JWT string from localStorage.
 * api.ts stores the raw JWT — we read it directly to avoid conflicts.
 */
function getRawToken(): string | null {
  try {
    const stored = localStorage.getItem(JWT_STORAGE_KEY);
    if (!stored) return null;

    // Handle both raw JWT strings and JSON-wrapped tokens (legacy)
    try {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === "object" && parsed.access_token) {
        // Legacy JSON format — migrate to raw string
        localStorage.setItem(JWT_STORAGE_KEY, parsed.access_token);
        return parsed.access_token;
      }
    } catch {
      // Not JSON — treat as raw JWT string (normal case)
    }

    return stored;
  } catch {
    return null;
  }
}

/**
 * Clear stored JWT token from localStorage
 */
function clearRawToken(): void {
  try {
    localStorage.removeItem(JWT_STORAGE_KEY);
    localStorage.removeItem(JWT_STORAGE_KEY + "_timestamp");
  } catch {
    // ignore
  }
}

/**
 * Get JWT token from localStorage (utility function)
 */
export function getJWTToken(): string | null {
  return getRawToken();
}

/**
 * Clear JWT token (utility function)
 */
export function clearJWTToken(): void {
  clearRawToken();
}
