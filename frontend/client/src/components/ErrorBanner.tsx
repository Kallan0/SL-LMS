/**
 * ErrorBanner Component
 * 
 * Displays error messages inline within the page content.
 * Replaces browser alerts and popups with a professional, dismissible banner.
 * 
 * Features:
 * - Smooth fade-in/out animations
 * - Auto-dismiss after configurable duration
 * - Manual dismiss button
 * - Supports different error types/severity levels
 * - Accessible with proper ARIA attributes
 */

import { useEffect, useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ErrorBannerProps {
  message: string;
  title?: string;
  onDismiss?: () => void;
  autoDismissMs?: number; // 0 = no auto-dismiss
  severity?: "error" | "warning" | "info";
  details?: string;
}

/**
 * ErrorBanner Component
 */
export function ErrorBanner({
  message,
  title = "Error",
  onDismiss,
  autoDismissMs = 8000,
  severity = "error",
  details,
}: ErrorBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-dismiss after specified duration
  useEffect(() => {
    if (!autoDismissMs || autoDismissMs <= 0) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [autoDismissMs, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  // Color scheme based on severity
  const colorScheme = {
    error: {
      bg: "bg-red-50 dark:bg-red-950/20",
      border: "border-red-200 dark:border-red-900/50",
      text: "text-red-900 dark:text-red-200",
      icon: "text-red-600 dark:text-red-400",
      button: "hover:bg-red-100 dark:hover:bg-red-900/30",
    },
    warning: {
      bg: "bg-amber-50 dark:bg-amber-950/20",
      border: "border-amber-200 dark:border-amber-900/50",
      text: "text-amber-900 dark:text-amber-200",
      icon: "text-amber-600 dark:text-amber-400",
      button: "hover:bg-amber-100 dark:hover:bg-amber-900/30",
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-950/20",
      border: "border-blue-200 dark:border-blue-900/50",
      text: "text-blue-900 dark:text-blue-200",
      icon: "text-blue-600 dark:text-blue-400",
      button: "hover:bg-blue-100 dark:hover:bg-blue-900/30",
    },
  };

  const colors = colorScheme[severity];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          role="alert"
          aria-live="polite"
          aria-atomic="true"
          className={`rounded-lg border ${colors.bg} ${colors.border} ${colors.text} p-4 shadow-sm`}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${colors.icon}`} />

            {/* Content */}
            <div className="flex-1 min-w-0">
              {title && <h3 className="font-semibold text-sm mb-1">{title}</h3>}
              <p className="text-sm leading-relaxed">{message}</p>
              {details && (
                <details className="mt-2 text-xs opacity-75">
                  <summary className="cursor-pointer font-medium">Details</summary>
                  <pre className="mt-1 whitespace-pre-wrap break-words bg-black/10 dark:bg-white/10 p-2 rounded text-xs font-mono overflow-auto max-h-40">
                    {details}
                  </pre>
                </details>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              onClick={handleDismiss}
              className={`flex-shrink-0 p-1 rounded transition-colors ${colors.button}`}
              aria-label="Dismiss error"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Container component for multiple error banners
 */
export interface ErrorBannerContainerProps {
  errors: ErrorBannerProps[];
  onDismiss?: (index: number) => void;
}

export function ErrorBannerContainer({
  errors,
  onDismiss,
}: ErrorBannerContainerProps) {
  return (
    <div className="space-y-2">
      {errors.map((error, index) => (
        <ErrorBanner
          key={index}
          {...error}
          onDismiss={() => onDismiss?.(index)}
        />
      ))}
    </div>
  );
}
