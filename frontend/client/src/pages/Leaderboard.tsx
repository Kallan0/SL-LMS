/**
 * Leaderboard Page
 *
 * Displays user rankings with a top-3 podium, time period filter, and full table.
 */

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, BookOpen, Zap, Medal } from "lucide-react";
import { useQuery } from "../hooks/useQuery";
import { apiService } from "../services/api";
import { useAuthContext } from "../contexts/AuthContext";
import { LeaderboardSkeleton } from "@/components/PageSkeletons";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBanner } from "../components/ErrorBanner";
import type { LeaderboardEntry } from "../types/index";

type TimePeriod = "all" | "week" | "month";

function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length < 3) return null;

  const [second, first, third] = entries.slice(0, 3);

  const PodiumCard = ({
    entry,
    rank,
    height,
    order,
  }: {
    entry: LeaderboardEntry;
    rank: number;
    height: string;
    order: number;
  }) => {
    const medalColors: Record<number, { bg: string; border: string; text: string; glow: string }> = {
      1: { bg: "from-yellow-500/20 to-amber-500/20", border: "border-yellow-500/40", text: "text-yellow-400", glow: "shadow-yellow-500/20" },
      2: { bg: "from-slate-400/20 to-slate-300/20", border: "border-slate-400/40", text: "text-slate-300", glow: "shadow-slate-400/20" },
      3: { bg: "from-orange-500/20 to-amber-600/20", border: "border-orange-500/40", text: "text-orange-400", glow: "shadow-orange-500/20" },
    };
    const colors = medalColors[rank] || medalColors[3];

    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: order * 0.15 }}
        className="flex flex-col items-center"
      >
        {/* Avatar */}
        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${colors.bg} border-2 ${colors.border} flex items-center justify-center mb-2 shadow-lg ${colors.glow}`}>
          <span className="text-white text-lg font-black">
            {(entry.userName || entry.username || "?")[0].toUpperCase()}
          </span>
        </div>
        <div className="text-white text-sm font-bold text-center mb-1">
          {entry.userName || entry.username}
        </div>
        <div className={`${colors.text} text-xs font-bold mb-2`}>
          {(entry.totalXP ?? entry.xp ?? 0).toLocaleString()} XP
        </div>
        {/* Bar */}
        <div
          className={`w-20 rounded-t-lg bg-gradient-to-b ${colors.bg} border ${colors.border} border-b-0 flex items-center justify-center`}
          style={{ height }}
        >
          <span className={`${colors.text} text-lg font-black`}>#{rank}</span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex items-end justify-center gap-6 mb-10">
      <PodiumCard entry={second} rank={2} height="80px" order={1} />
      <PodiumCard entry={first} rank={1} height="110px" order={0} />
      <PodiumCard entry={third} rank={3} height="60px" order={2} />
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useAuthContext();
  const [period, setPeriod] = useState<TimePeriod>("all");

  const { data: leaderboard = [], isLoading, error, refetch } = useQuery(
    "leaderboard",
    () => apiService.getLeaderboard(),
    { staleTime: 10 * 60 * 1000 }
  );

  // Note: In a real app, the period filter would call the API with a date range.
  // For now we show the same data regardless of period — the UI is ready for backend support.
  const filteredLeaderboard = useMemo(() => leaderboard || [], [leaderboard, period]);

  const userRank = filteredLeaderboard.find((entry) => entry.userId === user?.id);

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Medal className="w-5 h-5 text-yellow-400" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Medal className="w-5 h-5 text-orange-400" />;
      default: return <span className="text-slate-400 font-semibold text-sm">{rank}</span>;
    }
  };

  const periods: { key: TimePeriod; label: string }[] = [
    { key: "all", label: "All Time" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <PageHeader
        icon={<Trophy className="w-8 h-8" />}
        title="Leaderboard"
        subtitle="See how you rank among other learners"
        accentColor="text-yellow-400"
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Error Banner */}
        {error && (
          <ErrorBanner
            message="Failed to load leaderboard. Please try again."
            title="Loading Error"
            severity="error"
            onDismiss={refetch}
            autoDismissMs={0}
          />
        )}

        {/* Your Rank Banner */}
        {userRank && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Your Current Rank</p>
                <h2 className="text-4xl font-black text-white">#{userRank.rank}</h2>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">Total XP</p>
                  <p className="text-2xl font-black text-indigo-400">{(userRank.totalXP ?? userRank.xp ?? 0).toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">Streak</p>
                  <p className="text-2xl font-black text-orange-400 flex items-center gap-1">
                    {userRank.currentStreak ?? userRank.streak ?? 0}
                    <Flame className="w-5 h-5" />
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Period Filter */}
        <div className="flex items-center justify-between">
          <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700/50">
            {periods.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
                  period === p.key
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Podium */}
        {isLoading ? (
          <LeaderboardSkeleton />
        ) : filteredLeaderboard.length >= 3 ? (
          <Podium entries={filteredLeaderboard} />
        ) : null}

        {/* Table */}
        {isLoading ? (
          <LeaderboardSkeleton />
        ) : filteredLeaderboard.length === 0 ? (
          <EmptyState
            icon={<Trophy className="w-8 h-8" />}
            title="No rankings yet"
            description="Complete lessons and assessments to appear on the leaderboard."
          />
        ) : (
          <div className="bg-slate-800 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50 bg-slate-800/80">
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> XP</span>
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> Lessons</span>
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> Streak</span>
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mastered</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaderboard.map((entry, index) => {
                    const isCurrentUser = entry.userId === user?.id;
                    const displayName = entry.userName || entry.username || "Unknown";
                    const entryRank = entry.rank ?? (index + 1);
                    return (
                      <motion.tr
                        key={entry.id || entry.userId || `entry-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`border-b border-slate-700/30 transition-colors ${
                          isCurrentUser
                            ? "bg-indigo-600/10 hover:bg-indigo-600/15"
                            : "hover:bg-slate-700/30"
                        }`}
                      >
                        <td className="px-6 py-3.5">
                          {getMedalIcon(entryRank)}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                              <span className="text-white text-xs font-bold">{displayName[0].toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-white text-sm">{displayName}</p>
                              {isCurrentUser && <p className="text-[10px] text-indigo-400 font-medium">You</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="font-bold text-indigo-400 text-sm">{(entry.totalXP ?? entry.xp ?? 0).toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-3.5 text-sm text-slate-300">{entry.lessonsCompleted ?? 0}</td>
                        <td className="px-6 py-3.5">
                          <span className="flex items-center gap-1 text-orange-400 font-medium text-sm">
                            {entry.currentStreak ?? entry.streak ?? 0}
                            <Flame className="w-3.5 h-3.5" />
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-sm text-slate-300">{entry.masteredLessons ?? 0}</td>
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
