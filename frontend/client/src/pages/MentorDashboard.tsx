/**
 * MentorDashboard Page
 *
 * Mentor-only dashboard showing student overview, progress, and quick actions.
 */

import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Users, BookOpen, Trophy, TrendingUp, MessageSquare,
  ChevronRight, Clock, CheckCircle, Shield,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { apiService, type MentorStudent } from "@/services/api";
import { MentorDashboardSkeleton } from "@/components/PageSkeletons";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export default function MentorDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuthContext();
  const [students, setStudents] = useState<MentorStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<MentorStudent | null>(null);
  const [studentProgress, setStudentProgress] = useState<any[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      const data = await apiService.getMentorStudents();
      setStudents(data);
    } catch (err) {
      console.error("Failed to fetch students:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const fetchStudentProgress = async (studentId: string) => {
    setLoadingProgress(true);
    try {
      const data = await apiService.getStudentProgress(studentId);
      setSelectedStudent(data.student);
      setStudentProgress(data.progress);
    } catch (err) {
      console.error("Failed to fetch progress:", err);
    } finally {
      setLoadingProgress(false);
    }
  };

  const totalXp = students.reduce((sum, s) => sum + s.xp, 0);
  const totalCompleted = students.reduce((sum, s) => sum + (s.completedLessons || 0), 0);
  const avgXp = students.length > 0 ? Math.round(totalXp / students.length) : 0;
  const maxXp = Math.max(...students.map((s) => s.xp), 1);

  if (loading) return <MentorDashboardSkeleton />;

  const getName = (s: { firstName?: string; lastName?: string; username: string }) =>
    s.firstName ? `${s.firstName}${s.lastName ? ` ${s.lastName}` : ""}` : s.username;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <PageHeader
        icon={<Shield className="w-8 h-8" />}
        title="Mentor Dashboard"
        subtitle={`Welcome back, ${getName(user as any)}. Track your students' progress here.`}
        accentColor="text-indigo-400"
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 rounded-xl border border-slate-700/50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} className="text-indigo-400" />
              <span className="text-slate-400 text-xs font-semibold">Students</span>
            </div>
            <div className="text-white text-3xl font-black">{students.length}</div>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700/50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={16} className="text-orange-400" />
              <span className="text-slate-400 text-xs font-semibold">Total XP</span>
            </div>
            <div className="text-orange-400 text-3xl font-black">{totalXp.toLocaleString()}</div>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700/50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={16} className="text-emerald-400" />
              <span className="text-slate-400 text-xs font-semibold">Completed</span>
            </div>
            <div className="text-emerald-400 text-3xl font-black">{totalCompleted}</div>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700/50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-indigo-400" />
              <span className="text-slate-400 text-xs font-semibold">Avg XP</span>
            </div>
            <div className="text-white text-3xl font-black">{avgXp}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mb-8 flex-wrap">
          <button onClick={() => setLocation("/lesson-manager")}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-500/20">
            <BookOpen size={16} /> Manage Lessons
          </button>
          <button onClick={() => setLocation("/chat")}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white font-bold text-sm transition-colors">
            <MessageSquare size={16} /> Chat with Students
          </button>
          <button onClick={() => setLocation("/leaderboard")}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white font-bold text-sm transition-colors">
            <Trophy size={16} /> View Leaderboard
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Student List */}
          <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-700/50">
              <Users size={16} className="text-indigo-400" />
              <h2 className="text-white text-sm font-bold">Students</h2>
              <span className="text-slate-500 text-xs ml-auto">{students.length} total</span>
            </div>

            {students.length === 0 ? (
              <EmptyState
                icon={<Users className="w-8 h-8" />}
                title="No students yet"
                description="Students will appear here once they register and start learning."
              />
            ) : (
              <div>
                {students.map((student, i) => {
                  const totalLessons = student.totalLessons || 1;
                  const completed = student.completedLessons || 0;
                  const progress = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
                  const isSelected = selectedStudent?.id === student.id;
                  return (
                    <div
                      key={student.id}
                      onClick={() => fetchStudentProgress(student.id)}
                      className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-all border-l-3 ${
                        isSelected
                          ? "bg-indigo-500/10 border-l-indigo-500"
                          : "border-l-transparent hover:bg-slate-700/30"
                      } ${i < students.length - 1 ? "border-b border-b-slate-700/50" : ""}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                        <span className="text-white text-sm font-bold">{getName(student)[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-bold truncate">{getName(student)}</div>
                        <div className="text-slate-500 text-xs">{student.email}</div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className="text-orange-400 text-xs font-bold">{student.xp} XP</div>
                          <div className="text-slate-500 text-[10px]">{completed}/{totalLessons}</div>
                        </div>
                        {/* XP Progress Bar */}
                        <div className="w-14">
                          <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${(student.xp / maxXp) * 100}%`,
                                background: progress === 100
                                  ? "linear-gradient(90deg, #22c55e, #4ade80)"
                                  : "linear-gradient(90deg, #6366f1, #38bdf8)",
                              }}
                            />
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-600" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Student Detail Panel */}
          {selectedStudent && (
            <div className="w-full lg:w-96 bg-slate-800 rounded-xl border border-slate-700/50 overflow-hidden shrink-0">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700/50">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{getName(selectedStudent)[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white text-sm font-bold truncate">{getName(selectedStudent)}</h3>
                  <span className="text-slate-500 text-xs">{selectedStudent.email}</span>
                </div>
                <button onClick={() => setLocation(`/chat?user=${selectedStudent.id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white text-xs font-medium transition-colors">
                  <MessageSquare size={12} /> Message
                </button>
              </div>

              {loadingProgress ? (
                <div className="p-8 text-center">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-slate-500 text-xs">Loading progress...</p>
                </div>
              ) : studentProgress.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-slate-500 text-xs">No lesson progress yet.</p>
                </div>
              ) : (
                <div className="px-5 py-3">
                  {studentProgress.map((p: any, i: number) => {
                    const statusDot = p.status === "COMPLETED" ? "bg-emerald-400"
                      : p.status === "IN_PROGRESS" ? "bg-orange-400"
                      : "bg-slate-500";
                    return (
                      <div key={p.id} className={`flex items-center gap-3 py-2.5 ${
                        i < studentProgress.length - 1 ? "border-b border-slate-700/50" : ""
                      }`}>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${statusDot}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-200 text-xs font-semibold truncate">{p.lesson?.title || p.lessonId}</div>
                          <div className="text-slate-500 text-[10px]">{p.status.replace("_", " ")} · {Math.round(p.accuracy)}%</div>
                        </div>
                        <div className="text-slate-500 text-[10px] flex items-center gap-1 shrink-0">
                          <Clock size={10} /> {new Date(p.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
