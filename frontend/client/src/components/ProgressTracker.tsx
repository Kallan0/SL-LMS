/**
 * ProgressTracker Component
 * 
 * Displays user's learning progress with statistics and achievements.
 */

import { motion } from "framer-motion";
import { TrendingUp, Flame, BookOpen, Trophy, Zap } from "lucide-react";
import type { User, Progress } from "../types/index";

export interface ProgressTrackerProps {
  user: User | null;
  progress: Progress[];
}

/**
 * ProgressTracker Component
 */
export function ProgressTracker({ user, progress }: ProgressTrackerProps) {
  if (!user || !progress) return null;

  // Calculate statistics
  const completedLessons = progress.filter((p) => p.status === "COMPLETED" || (p.status as string) === "mastered").length;
  const totalLessons = progress.length;
  const averageAccuracy = Math.round(
    progress.reduce((sum, p) => sum + (p.accuracy || 0), 0) / (progress.length || 1)
  );
  const totalXP = user.xp ?? 0;
  const currentStreak = user.streak ?? 0;

  const stats = [
    {
      icon: BookOpen,
      label: "Lessons Completed",
      value: completedLessons,
      total: totalLessons,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
    },
    {
      icon: Flame,
      label: "Current Streak",
      value: currentStreak,
      suffix: "days",
      color: "text-orange-400",
      bgColor: "bg-orange-500/20",
    },
    {
      icon: Zap,
      label: "Total XP",
      value: totalXP,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
    },
    {
      icon: TrendingUp,
      label: "Avg Accuracy",
      value: averageAccuracy,
      suffix: "%",
      color: "text-green-400",
      bgColor: "bg-green-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${stat.bgColor} rounded-lg p-4 border border-slate-700`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-300">{stat.label}</h3>
              <Icon className={`w-5 h-5 ${stat.color}`} />
            </div>

            <div className="flex items-baseline gap-2">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              {stat.suffix && <p className="text-xs text-slate-400">{stat.suffix}</p>}
              {stat.total && (
                <p className="text-xs text-slate-400">/ {stat.total}</p>
              )}
            </div>

            {stat.total != null && stat.total > 0 && (
              <div className="mt-3 w-full bg-slate-700 rounded-full h-1.5">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-blue-400 h-1.5 rounded-full"
                  animate={{
                    width: `${Math.min(100, ((stat.value ?? 0) / stat.total) * 100)}%`,
                  }}
                />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

/**
 * Detailed Progress Chart Component
 */
export interface ProgressChartProps {
  progress: Progress[];
}

export function ProgressChart({ progress }: ProgressChartProps) {
  if (!progress || progress.length === 0) return null;

  // Group progress by week
  const weeks = 4;
  const progressByWeek = Array(weeks)
    .fill(0)
    .map((_, weekIndex) => {
      const weekStart = Date.now() - (weeks - weekIndex) * 7 * 24 * 60 * 60 * 1000;
      const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000;

      return progress.filter((p) => {
        const dateVal = p.completedAt || p.lastAccessedAt;
        const date = dateVal ? new Date(dateVal).getTime() : 0;
        return date >= weekStart && date <= weekEnd;
      }).length;
    });

  const maxProgress = Math.max(...progressByWeek, 1);

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-indigo-400" />
        Learning Activity
      </h3>

      <div className="flex items-end justify-between gap-2 h-32">
        {progressByWeek.map((count, index) => (
          <motion.div
            key={index}
            initial={{ height: 0 }}
            animate={{ height: `${(count / maxProgress) * 100}%` }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="flex-1 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg hover:from-indigo-500 hover:to-indigo-300 transition-colors cursor-pointer group relative"
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {count} lessons
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-between text-xs text-slate-400 mt-4">
        <span>4 weeks ago</span>
        <span>This week</span>
      </div>
    </div>
  );
}
