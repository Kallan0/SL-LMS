/**
 * useInactivityLogout Hook
 * 
 * Tracks user activity (mouse movement, keyboard, touch events) and automatically
 * logs out the user after exactly 10 minutes (600,000 ms) of inactivity.
 * 
 * This hook:
 * - Monitors mouse movement, keyboard input, and touch events
 * - Resets the inactivity timer on any user activity
 * - Automatically logs out and clears cache after 10 minutes of no activity
 * - Redirects to login screen
 * - Handles cleanup on unmount
 */

import { useEffect, useRef, useCallback } from "react";
import { clearJWTToken } from "./useAuth";

const INACTIVITY_TIMEOUT = import.meta.env.VITE_INACTIVITY_TIMEOUT || 600000; // 10 minutes in milliseconds

export interface UseInactivityLogoutOptions {
  onLogout?: () => void;
  enabled?: boolean;
  warningTime?: number; // Show warning before logout (ms before timeout)
}

/**
 * Custom hook for automatic logout on inactivity
 */
export function useInactivityLogout(options: UseInactivityLogoutOptions = {}) {
  const {
    onLogout,
    enabled = true,
    warningTime = 60000, // 1 minute before logout
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isWarningShownRef = useRef<boolean>(false);

  /**
   * Reset the inactivity timer
   */
  const resetInactivityTimer = useCallback(() => {
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Reset warning flag
    isWarningShownRef.current = false;
    lastActivityRef.current = Date.now();

    if (!enabled) return;

    // Set warning timeout
    warningTimeoutRef.current = setTimeout(() => {
      if (!isWarningShownRef.current) {
        isWarningShownRef.current = true;
        // You can dispatch a warning notification here
        console.warn("⏰ You will be logged out due to inactivity in 1 minute");
        // Dispatch custom event or show toast notification
        window.dispatchEvent(
          new CustomEvent("inactivity-warning", {
            detail: { timeRemaining: warningTime },
          })
        );
      }
    }, INACTIVITY_TIMEOUT - warningTime);

    // Set logout timeout
    timeoutRef.current = setTimeout(() => {
      handleInactivityLogout();
    }, INACTIVITY_TIMEOUT);
  }, [enabled, warningTime]);

  /**
   * Handle automatic logout
   */
  const handleInactivityLogout = useCallback(async () => {
    console.log("🔐 Logging out due to inactivity");

    try {
      // Clear JWT token
      clearJWTToken();

      // Clear React Query cache (if using React Query)
      // You can dispatch an action here to clear the cache
      window.dispatchEvent(new CustomEvent("auth-logout"));

      // Call custom logout handler
      if (onLogout) {
        onLogout();
      }

      // Redirect to login
      window.location.href = "/login";
    } catch (error) {
      console.error("Error during inactivity logout", error);
    }
  }, [onLogout]);

  /**
   * Activity event handler
   */
  const handleActivity = useCallback(() => {
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  /**
   * Setup activity listeners
   */
  useEffect(() => {
    if (!enabled) return;

    // List of activity events to monitor
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "keypress",
      "scroll",
      "touchstart",
      "touchmove",
      "click",
      "focus",
    ];

    // Add event listeners with throttling
    let throttleTimeout: NodeJS.Timeout | null = null;

    const throttledActivityHandler = () => {
      if (throttleTimeout) return;

      handleActivity();

      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;
      }, 1000); // Throttle to once per second
    };

    // Attach listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, throttledActivityHandler, true);
    });

    // Initialize timer
    resetInactivityTimer();

    // Cleanup function
    return () => {
      // Remove event listeners
      activityEvents.forEach((event) => {
        document.removeEventListener(event, throttledActivityHandler, true);
      });

      // Clear timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }

      // Clear throttle timeout
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
    };
  }, [enabled, handleActivity, resetInactivityTimer]);

  /**
   * Return utility functions for manual control
   */
  return {
    resetTimer: resetInactivityTimer,
    logout: handleInactivityLogout,
    getTimeUntilLogout: () => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      return Math.max(0, INACTIVITY_TIMEOUT - timeSinceLastActivity);
    },
  };
}
