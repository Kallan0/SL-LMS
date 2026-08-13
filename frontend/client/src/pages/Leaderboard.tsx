/**
 * Leaderboard Page
 * 
 * Displays user rankings based on XP, lessons completed, and streaks.
 */

import { motion } from "framer-motion";
import { Trophy, Flame, BookOpen, Zap, Medal } from "lucide-react";
import { useQuery } from "../hooks/useQuery";
import { apiService } from "../services/api";
import { useAuthContext } from "../contexts/AuthContext";

import {ErrorBanner } from "../components/ErrorBanner"

/**
 * Leaderboard Page Component
 */
export default function Leaderboard() {
  const { user } = useAuthContext();

  // Fetch leaderboard
  const { data: leaderboard = [], isLoading, error, refetch } = useQuery(
    "leaderboard",
    () => apiService.getLeaderboard(),
    { staleTime: 10 * 60 * 1000 } // 10 minutes
  );

  // Find current user's rank
  const userRank = leaderboard && leaderboard.find((entry) => entry.userId === user?.id);

  // Get medal icon based on rank
  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Medal className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-orange-400" />;
      default:
        return <span className="text-slate-400 font-semibold">{rank}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="bg-slate-800/50 dark:bg-slate-900/50 border-b border-slate-700 dark:border-slate-800 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
            </div>
            <p className="text-slate-400">See how you rank among other learners</p>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Error Banner - Hidden for now */}
        {false && error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <ErrorBanner
              message="Failed to load leaderboard. Please try again."
              title="Loading Error"
              severity="error"
              onDismiss={refetch}
              autoDismissMs={0}
            />
          </motion.div>
        )}

        {/* Your Rank */}
        {userRank && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-lg p-6 mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Your Current Rank</p>
                <h2 className="text-3xl font-bold text-white">#{userRank.rank}</h2>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-slate-400 text-xs mb-1">Total XP</p>
                    <p className="text-2xl font-bold text-indigo-400">{userRank.totalXP}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 text-xs mb-1">Streak</p>
                    <p className="text-2xl font-bold text-orange-400 flex items-center gap-1">
                      {userRank.currentStreak}
                      <Flame className="w-5 h-5" />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Leaderboard Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/20 mb-4">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-slate-400">Loading leaderboard...</p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 dark:bg-slate-900 rounded-lg border border-slate-700 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700 dark:border-slate-800 bg-slate-700/50 dark:bg-slate-800/50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Total XP
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Lessons
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4" />
                        Streak
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Mastered</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard && leaderboard.map((entry, index) => {
                    const isCurrentUser = entry.userId === user?.id;
                    return (
                      <motion.tr
                        key={entry.userId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`border-b border-slate-700 dark:border-slate-800 transition-colors ${
                          isCurrentUser
                            ? "bg-indigo-600/10 hover:bg-indigo-600/20"
                            : "hover:bg-slate-700/50"
                        }`}
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-white">
                          <div className="flex items-center gap-2">
                            {getMedalIcon(entry.rank)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-3">
                            <img
                              src={entry.userAvatar}
                              alt={entry.userName}
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <p className="font-medium text-white">{entry.userName}</p>
                              {isCurrentUser && (
                                <p className="text-xs text-indigo-400">You</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="font-semibold text-indigo-400">{entry.totalXP}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">{entry.lessonsCompleted}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="flex items-center gap-1 text-orange-400 font-medium">
                            {entry.currentStreak}
                            <Flame className="w-4 h-4" />
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">{entry.masteredLessons}</td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
