/**
 * Dashboard Page
 * 
 * Main page after login. Shows user overview, progress, and quick access to features.
 */

import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { LogOut, BookOpen, Trophy, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/AuthContext";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { useQuery } from "@/hooks/useQuery";
import { apiService } from "@/services/api";
import { ProgressTracker, ProgressChart } from "@/components/ProgressTracker";

/**
 * Dashboard Page Component
 */
export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuthContext();

  // Fetch progress data
  const { data: progress } = useQuery(
    "progress",
    () => apiService.getProgress(),
    { staleTime: 5 * 60 * 1000 } // 5 minutes
  );

  // Fetch achievements
  const { data: achievements } = useQuery(
    "achievements",
    () => apiService.getAchievements(),
    { staleTime: 10 * 60 * 1000 } // 10 minutes
  );

  // Setup inactivity logout
  useInactivityLogout({
    onLogout: () => {
      setLocation("/login");
    },
  });

  const handleLogout = async () => {
    try {
      await logout();
      setLocation("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Calculate statistics
  const completedLessons = (progress || []).filter(
    (p) => p.status === "completed" || p.status === "mastered"
  ).length;
  const unlockedAchievements = (achievements || []).filter((a) => a.unlockedAt).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="bg-slate-800/50 dark:bg-slate-900/50 border-b border-slate-700 dark:border-slate-800 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 text-sm">Welcome back, {user?.firstName}!</p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </motion.button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-400" />
            Your Progress
          </h2>
          <ProgressTracker user={user} progress={progress || []} />
        </motion.div>

        {/* Progress Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <ProgressChart progress={progress || []} />
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {/* Lessons Completed */}
          <div className="bg-slate-800 dark:bg-slate-900 rounded-lg p-6 border border-slate-700 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400 text-sm font-semibold">Lessons Completed</h3>
              <BookOpen className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-white">{completedLessons}</p>
            <p className="text-slate-500 text-xs mt-2">Keep learning!</p>
          </div>

          {/* Achievements */}
          <div className="bg-slate-800 dark:bg-slate-900 rounded-lg p-6 border border-slate-700 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400 text-sm font-semibold">Achievements</h3>
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-white">{unlockedAchievements}</p>
            <p className="text-slate-500 text-xs mt-2">
              {(achievements?.length || 0) - unlockedAchievements} more to unlock
            </p>
          </div>

          {/* Next Milestone */}
          <div className="bg-slate-800 dark:bg-slate-900 rounded-lg p-6 border border-slate-700 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400 text-sm font-semibold">Next Milestone</h3>
              <Zap className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-white">
              {Math.ceil((10000 - (user?.totalXP || 0)) / 100) * 100}
            </p>
            <p className="text-slate-500 text-xs mt-2">XP to 10,000</p>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800 dark:bg-slate-900 rounded-lg p-8 border border-slate-700 dark:border-slate-800 mb-8"
        >
          <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              onClick={() => setLocation("/lessons")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 py-6"
            >
              <BookOpen className="w-5 h-5" />
              Browse Lessons
            </Button>

            <Button
              onClick={() => setLocation("/leaderboard")}
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2 py-6"
            >
              <Trophy className="w-5 h-5" />
              View Leaderboard
            </Button>
          </div>
        </motion.div>

        {/* Info Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg text-blue-300 text-sm"
        >
          <p>
            <strong>Tip:</strong> You will be automatically logged out after 10 minutes of inactivity for security purposes.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
