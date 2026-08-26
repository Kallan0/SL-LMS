/**
 * Dashboard Page
 *
 * Main page after login. Shows user overview, progress, quick stats,
 * continue learning CTA, achievement showcase, streak calendar, and chart.
 */

import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  LogOut, BookOpen, Trophy, Zap, TrendingUp, Flame, Play,
  ChevronRight, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/AuthContext";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { useQuery } from "@/hooks/useQuery";
import { apiService } from "@/services/api";
import { ProgressChart } from "@/components/ProgressTracker";
import { LogoutConfirmModal } from "@/components/LogoutConfirmModal";
import { DashboardSkeleton } from "@/components/PageSkeletons";
import { PageHeader } from "@/components/PageHeader";
import type { Progress, Achievement } from "../types/index";

/** Mini calendar showing the last 7 days of activity */
function StreakCalendar({ progress }: { progress: Progress[] }) {
  const days = useMemo(() => {
    const result: { label: string; active: boolean; isToday: boolean }[] = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const dayEnd = dayStart + 86400000;
      const hasActivity = progress.some((p) => {
        const ts = p.lastAccessedAt ? new Date(p.lastAccessedAt).getTime() : 0;
        return ts >= dayStart && ts < dayEnd;
      });
      result.push({
        label: dayNames[date.getDay()],
        active: hasActivity,
        isToday: i === 0,
      });
    }
    return result;
  }, [progress]);

  return (
    <div className="flex items-center gap-2">
      {days.map((day, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              day.active
                ? day.isToday
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 animate-pulse"
                  : "bg-indigo-500/30 text-indigo-300 border border-indigo-500/40"
                : "bg-slate-800 text-slate-600 border border-slate-700"
            }`}
          >
            {day.active ? "✓" : "·"}
          </div>
          <span className={`text-[10px] font-medium ${day.isToday ? "text-indigo-400" : "text-slate-500"}`}>
            {day.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuthContext();

  const { data: progress, isLoading: progressLoading } = useQuery(
    "progress",
    () => apiService.getProgress(),
    { staleTime: 5 * 60 * 1000 }
  );

  const { data: achievements, isLoading: achievementsLoading } = useQuery(
    "achievements",
    () => apiService.getAchievements(),
    { staleTime: 10 * 60 * 1000 }
  );

  const isLoading = progressLoading || achievementsLoading;

  useInactivityLogout({ onLogout: () => setLocation("/login") });

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (isLoading) return <DashboardSkeleton />;

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      await logout();
      setLocation("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const allProgress = progress || [];
  const allAchievements = achievements || [];

  // Continue Learning: find most recent IN_PROGRESS lesson
  const inProgressLesson = allProgress
    .filter((p) => p.status === "IN_PROGRESS")
    .sort((a, b) => {
      const aTime = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0;
      const bTime = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0;
      return bTime - aTime;
    })[0];

  // Stats
  const completedLessons = allProgress.filter((p) => p.status === "COMPLETED").length;
  const unlockedAchievements = allAchievements.filter((a) => a.unlockedAt).length;
  const totalLessons = allProgress.length || 10; // fallback

  // Recent achievements (last 5 unlocked)
  const recentAchievements = allAchievements
    .filter((a) => a.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <PageHeader
        icon={<TrendingUp className="w-8 h-8" />}
        title={`Welcome back, ${user?.firstName || user?.username}!`}
        subtitle="Here's your learning overview"
        accentColor="text-indigo-400"
        actions={
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </motion.button>
        }
      />

      <LogoutConfirmModal
        open={showLogoutConfirm}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Continue Learning CTA */}
        {inProgressLesson && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-gradient-to-r from-indigo-600/20 via-indigo-500/10 to-sky-500/20 border border-indigo-500/30 rounded-2xl p-6"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider">Continue Learning</span>
                </div>
                <h3 className="text-white text-lg font-bold mb-1">{inProgressLesson.lesson?.title || "Lesson"}</h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1 max-w-xs">
                    <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all"
                        style={{
                          width: `${((inProgressLesson.exercisesCompleted ?? 0) / (inProgressLesson.totalExercises ?? 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-slate-400 text-xs">
                    {inProgressLesson.exercisesCompleted ?? 0}/{inProgressLesson.totalExercises ?? 0} exercises
                  </span>
                </div>
              </div>
              <Button
                onClick={() => setLocation("/lessons")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 shrink-0 shadow-lg shadow-indigo-500/30"
              >
                <Play className="w-4 h-4" />
                Resume
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* 4-Column Stat Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="bg-slate-800 rounded-xl border border-slate-700/50 p-5 hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-xs font-semibold">Streak</span>
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-orange-400">{user?.streak ?? 0}</span>
              <span className="text-slate-500 text-xs">days</span>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700/50 p-5 hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-xs font-semibold">Total XP</span>
              <Zap className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-yellow-400">{user?.xp ?? 0}</span>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700/50 p-5 hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-xs font-semibold">Weekly</span>
              <BookOpen className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-blue-400">{completedLessons}</span>
              <span className="text-slate-500 text-xs">/{totalLessons}</span>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700/50 p-5 hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-xs font-semibold">Badges</span>
              <Trophy className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-emerald-400">{unlockedAchievements}</span>
              <span className="text-slate-500 text-xs">/{allAchievements.length}</span>
            </div>
          </div>
        </motion.div>

        {/* Streak Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800 rounded-xl border border-slate-700/50 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-sm font-bold flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              This Week
            </h3>
            <span className="text-slate-500 text-xs">
              {progress?.filter((p) => {
                const weekAgo = Date.now() - 7 * 86400000;
                const ts = p.lastAccessedAt ? new Date(p.lastAccessedAt).getTime() : 0;
                return ts >= weekAgo;
              }).length || 0} active days
            </span>
          </div>
          <StreakCalendar progress={allProgress} />
        </motion.div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <ProgressChart progress={allProgress} />
        </motion.div>

        {/* Achievement Showcase */}
        {recentAchievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800 rounded-xl border border-slate-700/50 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-sm font-bold flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                Recent Achievements
              </h3>
              <span className="text-slate-500 text-xs">{unlockedAchievements} unlocked</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              {recentAchievements.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-4 py-3 bg-slate-700/30 rounded-xl border border-slate-700/50 shrink-0 min-w-[200px]">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center shrink-0">
                    <span className="text-lg">{a.icon || "🏅"}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-white text-xs font-bold truncate">{a.name}</div>
                    <div className="text-slate-500 text-[10px] truncate">{a.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <button
            onClick={() => setLocation("/lessons")}
            className="flex items-center gap-4 p-5 bg-slate-800 rounded-xl border border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/30 transition-colors">
              <BookOpen className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="text-left">
              <div className="text-white text-sm font-bold">Browse Lessons</div>
              <div className="text-slate-500 text-xs">Explore the ISL curriculum</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 ml-auto group-hover:text-indigo-400 transition-colors" />
          </button>

          <button
            onClick={() => setLocation("/leaderboard")}
            className="flex items-center gap-4 p-5 bg-slate-800 rounded-xl border border-slate-700/50 hover:border-purple-500/50 hover:bg-slate-800/80 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0 group-hover:bg-purple-500/30 transition-colors">
              <Trophy className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-left">
              <div className="text-white text-sm font-bold">Leaderboard</div>
              <div className="text-slate-500 text-xs">See how you rank</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 ml-auto group-hover:text-purple-400 transition-colors" />
          </button>
        </motion.div>
      </main>
    </div>
  );
}
