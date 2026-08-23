import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Users, BookOpen, Trophy, TrendingUp, MessageSquare,
  ChevronRight, Clock, CheckCircle, BarChart3, Shield,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";

var ACCENT = "#6366f1";
var GREEN = "#22c55e";
var ORANGE = "#f97316";
var RED = "#ef4444";

interface Student {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  xp: number;
  streak: number;
  createdAt: string;
  totalLessons: number;
  completedLessons: number;
}

export default function MentorDashboard() {
  var [, setLocation] = useLocation();
  var { user } = useAuthContext();
  var [students, setStudents] = useState<Student[]>([]);
  var [loading, setLoading] = useState(true);
  var [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  var [studentProgress, setStudentProgress] = useState<any[]>([]);
  var [loadingProgress, setLoadingProgress] = useState(false);

  var token = localStorage.getItem("sign_language_lms_token");
  var API_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:5000";

  useEffect(function () {
    fetchStudents();
  }, []);

  var fetchStudents = async function () {
    try {
      var res = await fetch(API_URL + "/mentor/students", {
        headers: { Authorization: "Bearer " + token },
      });
      var data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error("Failed to fetch students:", err);
    } finally {
      setLoading(false);
    }
  };

  var fetchStudentProgress = async function (studentId: string) {
    setLoadingProgress(true);
    try {
      var res = await fetch(API_URL + "/mentor/students/" + studentId + "/progress", {
        headers: { Authorization: "Bearer " + token },
      });
      var data = await res.json();
      setSelectedStudent(data.student);
      setStudentProgress(data.progress);
    } catch (err) {
      console.error("Failed to fetch progress:", err);
    } finally {
      setLoadingProgress(false);
    }
  };

  var totalXp = students.reduce(function (sum, s) { return sum + s.xp; }, 0);
  var totalCompleted = students.reduce(function (sum, s) { return sum + s.completedLessons; }, 0);
  var avgXp = students.length > 0 ? Math.round(totalXp / students.length) : 0;

  var getName = function (s: Student) {
    if (s.firstName) return s.firstName + (s.lastName ? " " + s.lastName : "");
    return s.username;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", fontFamily: "Inter,sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))", borderBottom: "1px solid #334155", padding: "32px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <Shield size={28} style={{ color: ACCENT }} />
            <h1 style={{ color: "#f8fafc", fontSize: 28, fontWeight: 900, margin: 0 }}>Mentor Dashboard</h1>
          </div>
          <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>Welcome back, {getName(user as any)}. Track your students' progress here.</p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
          <div style={{ background: "#1e293b", borderRadius: 16, padding: "20px", border: "1px solid #334155" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Users size={18} style={{ color: ACCENT }} />
              <span style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>Total Students</span>
            </div>
            <div style={{ color: "#f8fafc", fontSize: 32, fontWeight: 900 }}>{students.length}</div>
          </div>
          <div style={{ background: "#1e293b", borderRadius: 16, padding: "20px", border: "1px solid #334155" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Trophy size={18} style={{ color: ORANGE }} />
              <span style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>Total XP Earned</span>
            </div>
            <div style={{ color: ORANGE, fontSize: 32, fontWeight: 900 }}>{totalXp.toLocaleString()}</div>
          </div>
          <div style={{ background: "#1e293b", borderRadius: 16, padding: "20px", border: "1px solid #334155" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <CheckCircle size={18} style={{ color: GREEN }} />
              <span style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>Lessons Completed</span>
            </div>
            <div style={{ color: GREEN, fontSize: 32, fontWeight: 900 }}>{totalCompleted}</div>
          </div>
          <div style={{ background: "#1e293b", borderRadius: 16, padding: "20px", border: "1px solid #334155" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <TrendingUp size={18} style={{ color: ACCENT }} />
              <span style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>Avg XP / Student</span>
            </div>
            <div style={{ color: "#f8fafc", fontSize: 32, fontWeight: 900 }}>{avgXp}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
          <button onClick={function () { setLocation("/lesson-manager"); }} style={{ padding: "12px 24px", borderRadius: 12, background: "linear-gradient(135deg,#6366f1,#38bdf8)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, border: "none" }}>
            <BookOpen size={16} /> Manage Lessons
          </button>
          <button onClick={function () { setLocation("/chat"); }} style={{ padding: "12px 24px", borderRadius: 12, background: "transparent", color: "#94a3b8", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, border: "1px solid #334155" }}>
            <MessageSquare size={16} /> Chat with Students
          </button>
        </div>

        <div style={{ display: "flex", gap: 24, flexDirection: "column" }}>
          {/* Student List */}
          <div style={{ background: "#1e293b", borderRadius: 16, border: "1px solid #334155", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #334155", display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={18} style={{ color: ACCENT }} />
              <h2 style={{ color: "#f8fafc", fontSize: 16, fontWeight: 700, margin: 0 }}>Students</h2>
              <span style={{ color: "#64748b", fontSize: 13, marginLeft: "auto" }}>{students.length} total</span>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <div style={{ width: 32, height: 32, border: "3px solid #334155", borderTopColor: ACCENT, borderRadius: 99, animation: "spin 1s linear infinite", margin: "0 auto" }} />
                <p style={{ color: "#64748b", fontSize: 13, marginTop: 12 }}>Loading students...</p>
              </div>
            ) : students.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <Users size={32} style={{ color: "#334155", margin: "0 auto 8px" }} />
                <p style={{ color: "#64748b", fontSize: 13 }}>No students registered yet.</p>
              </div>
            ) : (
              students.map(function (student, i) {
                var progress = student.totalLessons > 0 ? Math.round((student.completedLessons / Math.max(student.totalLessons, 1)) * 100) : 0;
                var isSelected = selectedStudent?.id === student.id;
                return (
                  <div
                    key={student.id}
                    onClick={function () { fetchStudentProgress(student.id); }}
                    style={{
                      padding: "14px 20px", borderBottom: i < students.length - 1 ? "1px solid #334155" : undefined,
                      display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
                      background: isSelected ? "rgba(99,102,241,0.08)" : "transparent",
                      borderLeft: isSelected ? "3px solid " + ACCENT : "3px solid transparent",
                      transition: "all .15s",
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 99, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>{getName(student)[0].toUpperCase()}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "#f8fafc", fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{getName(student)}</div>
                      <div style={{ color: "#64748b", fontSize: 12 }}>{student.email}</div>
                    </div>
                    <div style={{ display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: ORANGE, fontSize: 13, fontWeight: 700 }}>{student.xp} XP</div>
                        <div style={{ color: "#64748b", fontSize: 11 }}>{student.completedLessons}/{Math.max(student.totalLessons, 1)} done</div>
                      </div>
                      <div style={{ width: 48, height: 6, borderRadius: 99, background: "#334155", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: progress + "%", background: progress === 100 ? GREEN : ACCENT, borderRadius: 99, transition: "width .3s" }} />
                      </div>
                      <ChevronRight size={16} style={{ color: "#475569" }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Student Detail Panel */}
          {selectedStudent && (
            <div style={{ background: "#1e293b", borderRadius: 16, border: "1px solid #334155", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #334155", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 99, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>{getName(selectedStudent)[0].toUpperCase()}</span>
                </div>
                <div>
                  <h3 style={{ color: "#f8fafc", fontSize: 16, fontWeight: 700, margin: 0 }}>{getName(selectedStudent)}</h3>
                  <span style={{ color: "#64748b", fontSize: 12 }}>{selectedStudent.email}</span>
                </div>
                <button onClick={function () { setLocation("/chat?user=" + selectedStudent!.id); }} style={{ marginLeft: "auto", padding: "8px 16px", borderRadius: 99, background: "transparent", border: "1px solid #334155", color: "#94a3b8", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <MessageSquare size={14} /> Message
                </button>
              </div>

              {loadingProgress ? (
                <div style={{ padding: 30, textAlign: "center" }}>
                  <p style={{ color: "#64748b", fontSize: 13 }}>Loading progress...</p>
                </div>
              ) : studentProgress.length === 0 ? (
                <div style={{ padding: 30, textAlign: "center" }}>
                  <p style={{ color: "#64748b", fontSize: 13 }}>No lesson progress yet.</p>
                </div>
              ) : (
                <div style={{ padding: "12px 20px" }}>
                  {studentProgress.map(function (p, i) {
                    var statusColor = p.status === "COMPLETED" ? GREEN : p.status === "IN_PROGRESS" ? ORANGE : "#64748b";
                    return (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < studentProgress.length - 1 ? "1px solid #334155" : undefined }}>
                        <div style={{ width: 8, height: 8, borderRadius: 99, background: statusColor, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{p.lesson?.title || p.lessonId}</div>
                          <div style={{ color: "#64748b", fontSize: 11 }}>{p.status.replace("_", " ")} | {Math.round(p.accuracy)}% accuracy</div>
                        </div>
                        <div style={{ color: "#64748b", fontSize: 11 }}><Clock size={12} /> {new Date(p.updatedAt).toLocaleDateString()}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
