/**
 * PageHeader Component
 *
 * Reusable page header with icon, title, subtitle, and optional actions.
 * Used by Dashboard, Lessons, Leaderboard, Profile, LessonManager, MentorDashboard.
 */

import { motion } from "framer-motion";

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accentColor?: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  icon,
  title,
  subtitle,
  accentColor = "text-indigo-400",
  actions,
}: PageHeaderProps) {
  return (
    <header className="bg-slate-800/50 dark:bg-slate-900/50 border-b border-slate-700 dark:border-slate-800 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className={accentColor}>{icon}</div>
            <div>
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              <p className="text-slate-400 text-sm">{subtitle}</p>
            </div>
          </motion.div>
          {actions && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {actions}
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
}
