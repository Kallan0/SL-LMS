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
  logout: () => Promise<void>;
  clearError: () => void;
  refreshToken: (newToken: AuthToken) => void;
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
        const storedToken = getStoredToken();
        
        if (storedToken) {
          // Verify token is still valid by fetching current user
          const user = await apiService.getCurrentUser();
          setState((prev) => ({
            ...prev,
            user,
            token: storedToken,
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
        clearStoredToken();
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
      
      // Store token securely
      if (response.token?.accessToken) {
        storeToken(response.token);
      }
      
      setState((prev) => ({
        ...prev,
        user: response.user,
        token: response.token,
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
   * Logout user and clear session
   */
  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    
    try {
      await apiService.logout();
      clearStoredToken();
      
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
      clearStoredToken();
      
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
    storeToken(newToken);
    setState((prev) => ({
      ...prev,
      token: newToken,
    }));
  }, []);

  return {
    ...state,
    login,
    logout,
    clearError,
    refreshToken,
  };
}

/**
 * Get stored JWT token from localStorage
 */
function getStoredToken(): AuthToken | null {
  try {
    const stored = localStorage.getItem(JWT_STORAGE_KEY);
    if (!stored) return null;
    
    const token = JSON.parse(stored) as AuthToken;
    
    // Check if token is expired
    if (token.expiresIn) {
      const expirationTime = JSON.parse(localStorage.getItem(JWT_STORAGE_KEY + "_timestamp") || "0");
      const now = Date.now();
      
      if (now > expirationTime) {
        clearStoredToken();
        return null;
      }
    }
    
    return token;
  } catch (error) {
    console.error("Failed to retrieve stored token", error);
    return null;
  }
}

/**
 * Store JWT token in localStorage with expiration tracking
 */
function storeToken(token: AuthToken): void {
  try {
    localStorage.setItem(JWT_STORAGE_KEY, JSON.stringify(token));
    
    // Store expiration timestamp
    const expirationTime = Date.now() + (token.expiresIn * 1000);
    localStorage.setItem(JWT_STORAGE_KEY + "_timestamp", JSON.stringify(expirationTime));
  } catch (error) {
    console.error("Failed to store token", error);
  }
}

/**
 * Clear stored JWT token from localStorage
 */
function clearStoredToken(): void {
  try {
    localStorage.removeItem(JWT_STORAGE_KEY);
    localStorage.removeItem(JWT_STORAGE_KEY + "_timestamp");
  } catch (error) {
    console.error("Failed to clear token", error);
  }
}

/**
 * Get JWT token from localStorage (utility function)
 */
export function getJWTToken(): string | null {
  const token = getStoredToken();
  return token?.access_token ?? null;
}

/**
 * Clear JWT token (utility function)
 */
export function clearJWTToken(): void {
  clearStoredToken();
}
