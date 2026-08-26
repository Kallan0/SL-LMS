/**
 * PageSkeletons.tsx
 *
 * Dark-themed loading skeleton components for every page.
 * Each skeleton mirrors the exact layout of its page so the transition
 * from skeleton → real content is seamless.
 */

import { Skeleton } from "@/components/ui/skeleton";

/* ── Shared helpers ──────────────────────────────────────────────────── */

function SkeletonCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-slate-800 dark:bg-slate-900 rounded-lg border border-slate-700 dark:border-slate-800 p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function HeaderSkeleton({ icon }: { icon?: React.ReactNode }) {
  return (
    <header className="bg-slate-800/50 dark:bg-slate-900/50 border-b border-slate-700 dark:border-slate-800 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && <div className="text-indigo-400 opacity-40">{icon}</div>}
          <div>
            <Skeleton className="h-7 w-48 bg-slate-700/60 mb-2" />
            <Skeleton className="h-4 w-64 bg-slate-700/40" />
          </div>
        </div>
        <Skeleton className="h-10 w-28 bg-slate-700/40 rounded-lg" />
      </div>
    </header>
  );
}

/* ── Dashboard ───────────────────────────────────────────────────────── */

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <HeaderSkeleton />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress section */}
        <div className="mb-12">
          <Skeleton className="h-6 w-40 bg-slate-700/60 mb-6" />
          <SkeletonCard>
            <div className="flex items-center gap-6 mb-6">
              <Skeleton className="w-16 h-16 rounded-full bg-slate-700/50" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 bg-slate-700/50 mb-2" />
                <Skeleton className="h-4 w-48 bg-slate-700/30" />
              </div>
              <div className="flex gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="text-center">
                    <Skeleton className="h-8 w-16 bg-slate-700/50 mb-1 mx-auto" />
                    <Skeleton className="h-3 w-12 bg-slate-700/30 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
            {/* Stat bars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <Skeleton className="h-3 w-20 bg-slate-700/40" />
                    <Skeleton className="h-3 w-8 bg-slate-700/40" />
                  </div>
                  <Skeleton className="h-2 w-full bg-slate-700/30 rounded-full" />
                </div>
              ))}
            </div>
          </SkeletonCard>
        </div>

        {/* Chart area */}
        <div className="mb-12">
          <SkeletonCard>
            <Skeleton className="h-5 w-36 bg-slate-700/50 mb-4" />
            <div className="flex items-end gap-2 h-32">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="flex-1 bg-slate-700/30 rounded-t"
                  style={{ height: `${30 + Math.random() * 70}%` }}
                />
              ))}
            </div>
          </SkeletonCard>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i}>
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-4 w-28 bg-slate-700/50" />
                <Skeleton className="w-5 h-5 rounded bg-slate-700/40" />
              </div>
              <Skeleton className="h-9 w-20 bg-slate-700/50 mb-2" />
              <Skeleton className="h-3 w-32 bg-slate-700/30" />
            </SkeletonCard>
          ))}
        </div>

        {/* Quick actions */}
        <SkeletonCard>
          <Skeleton className="h-6 w-32 bg-slate-700/50 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-14 w-full bg-slate-700/40 rounded-lg" />
            <Skeleton className="h-14 w-full bg-slate-700/40 rounded-lg" />
          </div>
        </SkeletonCard>
      </main>
    </div>
  );
}

/* ── Lessons ─────────────────────────────────────────────────────────── */

export function LessonsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <HeaderSkeleton />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <SkeletonCard className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="w-5 h-5 rounded bg-slate-700/40" />
            <Skeleton className="h-5 w-16 bg-slate-700/50" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-10 w-full bg-slate-700/30 rounded-md" />
            <Skeleton className="h-10 w-full bg-slate-700/30 rounded-md" />
            <Skeleton className="h-10 w-full bg-slate-700/30 rounded-md" />
          </div>
        </SkeletonCard>

        {/* Lesson cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-slate-800 dark:bg-slate-900 rounded-lg border border-slate-700 dark:border-slate-800 overflow-hidden"
            >
              {/* Thumbnail */}
              <Skeleton className="h-40 w-full bg-slate-700/40 rounded-none" />
              <div className="p-4">
                <Skeleton className="h-5 w-3/4 bg-slate-700/50 mb-2" />
                <Skeleton className="h-3 w-full bg-slate-700/30 mb-1" />
                <Skeleton className="h-3 w-2/3 bg-slate-700/30 mb-4" />
                <div className="flex gap-2 mb-4">
                  <Skeleton className="h-5 w-16 rounded bg-slate-700/30" />
                  <Skeleton className="h-5 w-20 rounded bg-slate-700/30" />
                </div>
                <Skeleton className="h-10 w-full bg-slate-700/40 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

/* ── Leaderboard ─────────────────────────────────────────────────────── */

export function LeaderboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <HeaderSkeleton />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Your rank card */}
        <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-3 w-28 bg-slate-600/40 mb-2" />
              <Skeleton className="h-9 w-20 bg-slate-600/40" />
            </div>
            <div className="flex gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-3 w-14 bg-slate-600/40 mb-1 mx-auto" />
                  <Skeleton className="h-7 w-16 bg-slate-600/40 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-800 dark:bg-slate-900 rounded-lg border border-slate-700 dark:border-slate-800 overflow-hidden">
          {/* Table header */}
          <div className="bg-slate-700/50 dark:bg-slate-800/50 border-b border-slate-700 dark:border-slate-800 px-6 py-4">
            <div className="grid grid-cols-6 gap-4">
              <Skeleton className="h-4 w-10 bg-slate-600/40" />
              <Skeleton className="h-4 w-16 bg-slate-600/40" />
              <Skeleton className="h-4 w-16 bg-slate-600/40" />
              <Skeleton className="h-4 w-16 bg-slate-600/40" />
              <Skeleton className="h-4 w-12 bg-slate-600/40" />
              <Skeleton className="h-4 w-14 bg-slate-600/40" />
            </div>
          </div>
          {/* Table rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="border-b border-slate-700 dark:border-slate-800 px-6 py-4"
            >
              <div className="grid grid-cols-6 gap-4 items-center">
                <Skeleton className="h-5 w-8 bg-slate-700/40" />
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full bg-slate-700/40" />
                  <Skeleton className="h-4 w-24 bg-slate-700/40" />
                </div>
                <Skeleton className="h-4 w-14 bg-slate-700/40" />
                <Skeleton className="h-4 w-8 bg-slate-700/40" />
                <Skeleton className="h-4 w-12 bg-slate-700/40" />
                <Skeleton className="h-4 w-8 bg-slate-700/40" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

/* ── Profile ─────────────────────────────────────────────────────────── */

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <HeaderSkeleton />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile card */}
        <SkeletonCard className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-48 bg-slate-700/50" />
            <Skeleton className="h-9 w-20 bg-slate-700/40 rounded-lg" />
          </div>

          <div className="flex items-center gap-6 mb-8">
            <Skeleton className="w-20 h-20 rounded-full bg-slate-700/50" />
            <div>
              <Skeleton className="h-5 w-40 bg-slate-700/50 mb-2" />
              <Skeleton className="h-3 w-32 bg-slate-700/30 mb-1" />
              <Skeleton className="h-3 w-48 bg-slate-700/30 mb-3" />
              <div className="flex gap-2">
                <Skeleton className="h-7 w-28 bg-slate-700/30 rounded" />
                <Skeleton className="h-7 w-20 bg-slate-700/30 rounded" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-3 w-20 bg-slate-700/40 mb-2" />
              <Skeleton className="h-5 w-32 bg-slate-700/50" />
            </div>
            <div>
              <Skeleton className="h-3 w-20 bg-slate-700/40 mb-2" />
              <Skeleton className="h-5 w-28 bg-slate-700/50" />
            </div>
          </div>
        </SkeletonCard>

        {/* Preferences card */}
        <SkeletonCard className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="w-6 h-6 rounded bg-slate-700/40" />
            <Skeleton className="h-6 w-32 bg-slate-700/50" />
          </div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="w-5 h-5 rounded bg-slate-700/40" />
                  <div>
                    <Skeleton className="h-4 w-28 bg-slate-700/40 mb-1" />
                    <Skeleton className="h-3 w-48 bg-slate-700/30" />
                  </div>
                </div>
                <Skeleton className="w-5 h-5 rounded bg-slate-700/30" />
              </div>
            ))}
          </div>
        </SkeletonCard>

        {/* Danger zone */}
        <div className="bg-slate-800 dark:bg-slate-900 rounded-lg border border-red-700/50 dark:border-red-800/50 p-8">
          <Skeleton className="h-6 w-32 bg-slate-700/40 mb-6" />
          <Skeleton className="h-10 w-28 bg-slate-700/30 rounded-lg" />
        </div>
      </main>
    </div>
  );
}

/* ── Chat ────────────────────────────────────────────────────────────── */

export function ChatSkeleton() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        background: "#0f172a",
        fontFamily: "Inter,sans-serif",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: 340,
          borderRight: "1px solid #334155",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        {/* Sidebar header */}
        <div
          style={{
            padding: "16px 18px",
            borderBottom: "1px solid #334155",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Skeleton className="w-4 h-4 bg-slate-700/40" />
          <Skeleton className="w-5 h-5 rounded bg-slate-700/40" />
          <Skeleton className="h-5 w-24 bg-slate-700/50" />
        </div>

        {/* Search bar */}
        <div style={{ padding: "12px 18px" }}>
          <Skeleton className="h-10 w-full bg-slate-700/30 rounded-[10px]" />
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, padding: "8px 0" }}>
          <div
            style={{
              padding: "8px 18px",
              color: "#475569",
              fontSize: 11,
            }}
          >
            <Skeleton className="h-3 w-14 bg-slate-700/30" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                padding: "10px 18px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Skeleton className="w-9 h-9 rounded-full bg-slate-700/40" />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Skeleton className="h-3.5 w-24 bg-slate-700/40" />
                  <Skeleton className="h-3 w-10 bg-slate-700/30" />
                </div>
                <Skeleton className="h-3 w-36 bg-slate-700/30" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Skeleton className="w-16 h-16 rounded-full bg-slate-700/30 mx-auto mb-4" />
          <Skeleton className="h-5 w-48 bg-slate-700/30 mx-auto mb-2" />
          <Skeleton className="h-3 w-64 bg-slate-700/20 mx-auto" />
        </div>
      </div>
    </div>
  );
}

/* ── LessonManager ───────────────────────────────────────────────────── */

export function LessonManagerSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <HeaderSkeleton />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Action bar */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-5 w-40 bg-slate-700/50" />
          <Skeleton className="h-10 w-36 bg-slate-700/40 rounded-lg" />
        </div>

        {/* Table */}
        <div className="bg-slate-800 dark:bg-slate-900 rounded-lg border border-slate-700 dark:border-slate-800 overflow-hidden">
          {/* Table header */}
          <div className="bg-slate-700/50 dark:bg-slate-800/50 border-b border-slate-700 dark:border-slate-800 px-6 py-4">
            <div className="grid grid-cols-5 gap-4">
              <Skeleton className="h-4 w-12 bg-slate-600/40" />
              <Skeleton className="h-4 w-16 bg-slate-600/40" />
              <Skeleton className="h-4 w-20 bg-slate-600/40" />
              <Skeleton className="h-4 w-16 bg-slate-600/40" />
              <Skeleton className="h-4 w-20 bg-slate-600/40" />
            </div>
          </div>
          {/* Table rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="border-b border-slate-700 dark:border-slate-800 px-6 py-4"
            >
              <div className="grid grid-cols-5 gap-4 items-center">
                <Skeleton className="h-4 w-20 bg-slate-700/40" />
                <Skeleton className="h-4 w-12 bg-slate-700/40" />
                <Skeleton className="h-4 w-24 bg-slate-700/40" />
                <Skeleton className="h-4 w-16 bg-slate-700/40" />
                <div className="flex gap-2">
                  <Skeleton className="h-7 w-7 rounded bg-slate-700/30" />
                  <Skeleton className="h-7 w-7 rounded bg-slate-700/30" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

/* ── MentorDashboard ─────────────────────────────────────────────────── */

export function MentorDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <HeaderSkeleton />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i}>
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-4 w-28 bg-slate-700/50" />
                <Skeleton className="w-5 h-5 rounded bg-slate-700/40" />
              </div>
              <Skeleton className="h-9 w-16 bg-slate-700/50" />
            </SkeletonCard>
          ))}
        </div>

        {/* Quick actions */}
        <SkeletonCard className="mb-8">
          <Skeleton className="h-5 w-32 bg-slate-700/50 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full bg-slate-700/40 rounded-lg" />
            ))}
          </div>
        </SkeletonCard>

        {/* Student list */}
        <SkeletonCard>
          <Skeleton className="h-5 w-36 bg-slate-700/50 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full bg-slate-700/40" />
                  <div>
                    <Skeleton className="h-4 w-32 bg-slate-700/40 mb-1" />
                    <Skeleton className="h-3 w-24 bg-slate-700/30" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20 bg-slate-700/30 rounded-lg" />
              </div>
            ))}
          </div>
        </SkeletonCard>
      </main>
    </div>
  );
}
