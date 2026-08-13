// Core hex values required for <canvas> drawing and raw manipulation
export const CANVAS_COLORS = {
  accent: "#c9623f",      // Terracotta
  secondary: "#d4a853",   // Warm Gold
  success: "#7a9e7e",     // Sage Green
  warning: "#e08c3a",     // Amber
  danger: "#b85c5c",      // Dusty Red
};

// Legacy hook wrapper to prevent breaking changes in unmodified components
export function useTheme() {
  const isDark = typeof window !== 'undefined' ? document.documentElement.classList.contains('dark') : false;

  return {
    dark: isDark,
    bg: isDark ? '#120d07' : '#faf5ec',
    text: isDark ? '#f5ede0' : '#1e140a',
    muted: isDark ? '#8c7a64' : '#8c7060',
    border: isDark ? 'rgba(201,98,63,0.16)' : 'rgba(180,120,80,0.22)',
    inputBg: isDark ? '#221a0e' : '#fffcf7',
    inputBdr: isDark ? 'rgba(201,98,63,0.16)' : 'rgba(180,120,80,0.22)',
    progressTrack: isDark ? 'rgba(201,98,63,0.1)' : 'rgba(180,120,80,0.1)',
    card: isDark ? '#221a0e' : '#fffcf7',
    streakBg: isDark ? '#261808' : '#f3eae0',
    streakBdr: isDark ? 'rgba(201,98,63,0.16)' : 'rgba(180,120,80,0.22)',
    textDim: isDark ? '#8c7a64' : '#8c7060',
    modalBg: isDark ? '#221a0e' : '#fffcf7',
  };
}