import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  BookOpen, Plus, Pencil, Trash2, Save, X, ArrowLeft,
  Video, Tag, Clock, GripVertical, AlertTriangle,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";

var ACCENT = "#6366f1";
var GREEN = "#22c55e";
var RED = "#ef4444";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  signLabel: string;
  videoUrl: string | null;
  difficulty: string | null;
  category: string | null;
  order: number;
  duration: number;
  createdAt: string;
}

var emptyLesson = { title: "", description: "", signLabel: "", videoUrl: "", difficulty: "BEGINNER", category: "ALPHABET", order: 0, duration: 10 };

export default function LessonManager() {
  var [, setLocation] = useLocation();
  var { user } = useAuthContext();
  var [lessons, setLessons] = useState<Lesson[]>([]);
  var [loading, setLoading] = useState(true);
  var [editingId, setEditingId] = useState<string | null>(null);
  var [editForm, setEditForm] = useState(emptyLesson);
  var [showNew, setShowNew] = useState(false);
  var [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  var token = localStorage.getItem("sign_language_lms_token");
  var API_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:5000";

  var headers = { "Content-Type": "application/json", Authorization: "Bearer " + token };

  useEffect(function () { fetchLessons(); }, []);

  var fetchLessons = async function () {
    try {
      var res = await fetch(API_URL + "/lessons");
      setLessons(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  var createLesson = async function () {
    try {
      var res = await fetch(API_URL + "/lessons", { method: "POST", headers: headers, body: JSON.stringify(editForm) });
      if (res.ok) {
        setShowNew(false);
        setEditForm(emptyLesson);
        fetchLessons();
      }
    } catch (err) { console.error(err); }
  };

  var updateLesson = async function (id: string) {
    try {
      var res = await fetch(API_URL + "/lessons/" + id, { method: "PUT", headers: headers, body: JSON.stringify(editForm) });
      if (res.ok) {
        setEditingId(null);
        fetchLessons();
      }
    } catch (err) { console.error(err); }
  };

  var deleteLesson = async function (id: string) {
    try {
      var res = await fetch(API_URL + "/lessons/" + id, { method: "DELETE", headers: headers });
      if (res.ok) {
        setDeleteConfirm(null);
        fetchLessons();
      }
    } catch (err) { console.error(err); }
  };

  var startEdit = function (lesson: Lesson) {
    setEditingId(lesson.id);
    setEditForm({
      title: lesson.title,
      description: lesson.description || "",
      signLabel: lesson.signLabel,
      videoUrl: lesson.videoUrl || "",
      difficulty: lesson.difficulty || "BEGINNER",
      category: lesson.category || "ALPHABET",
      order: lesson.order,
      duration: lesson.duration,
    });
  };

  var inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10, background: "#0f172a",
    border: "1px solid #334155", color: "#f8fafc", fontSize: 13, outline: "none",
    fontFamily: "Inter,sans-serif", boxSizing: "border-box" as const,
  };

  var labelStyle: React.CSSProperties = {
    color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, marginBottom: 6, display: "block", textTransform: "uppercase",
  };

  var selectStyle: React.CSSProperties = {
    ...inputStyle, cursor: "pointer",
  };

  var LessonForm = function (props: { onSave: () => void; onCancel: () => void }) {
    return (
      <div style={{ background: "#0f172a", borderRadius: 12, border: "1px solid #334155", padding: 20, marginTop: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Title *</label>
            <input style={inputStyle} placeholder="e.g. ISL Alphabet A-E" value={editForm.title} onChange={function (e) { setEditForm({ ...editForm, title: e.target.value }); }} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} placeholder="Lesson description..." value={editForm.description} onChange={function (e) { setEditForm({ ...editForm, description: e.target.value }); }} />
          </div>
          <div>
            <label style={labelStyle}>Sign Label</label>
            <input style={inputStyle} placeholder="e.g. A-E" value={editForm.signLabel} onChange={function (e) { setEditForm({ ...editForm, signLabel: e.target.value }); }} />
          </div>
          <div>
            <label style={labelStyle}>YouTube URL</label>
            <input style={inputStyle} placeholder="https://youtube.com/embed/..." value={editForm.videoUrl} onChange={function (e) { setEditForm({ ...editForm, videoUrl: e.target.value }); }} />
          </div>
          <div>
            <label style={labelStyle}>Difficulty</label>
            <select style={selectStyle} value={editForm.difficulty} onChange={function (e) { setEditForm({ ...editForm, difficulty: e.target.value }); }}>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select style={selectStyle} value={editForm.category} onChange={function (e) { setEditForm({ ...editForm, category: e.target.value }); }}>
              <option value="ALPHABET">Alphabet</option>
              <option value="NUMBERS">Numbers</option>
              <option value="PHRASES">Phrases</option>
              <option value="CONVERSATION">Conversation</option>
              <option value="GRAMMAR">Grammar</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Order</label>
            <input style={inputStyle} type="number" value={editForm.order} onChange={function (e) { setEditForm({ ...editForm, order: parseInt(e.target.value) || 0 }); }} />
          </div>
          <div>
            <label style={labelStyle}>Duration (min)</label>
            <input style={inputStyle} type="number" value={editForm.duration} onChange={function (e) { setEditForm({ ...editForm, duration: parseInt(e.target.value) || 5 }); }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={props.onSave} style={{ padding: "10px 20px", borderRadius: 10, background: GREEN, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", border: "none", display: "flex", alignItems: "center", gap: 6 }}>
            <Save size={14} /> Save
          </button>
          <button onClick={props.onCancel} style={{ padding: "10px 20px", borderRadius: 10, background: "transparent", color: "#94a3b8", border: "1px solid #334155", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", fontFamily: "Inter,sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))", borderBottom: "1px solid #334155", padding: "24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={function () { setLocation("/dashboard"); }} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
            <ArrowLeft size={16} /> Back
          </button>
          <BookOpen size={24} style={{ color: ACCENT }} />
          <h1 style={{ color: "#f8fafc", fontSize: 22, fontWeight: 900, margin: 0 }}>Lesson Manager</h1>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px" }}>
        {/* Add New Button */}
        <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#94a3b8", fontSize: 14 }}>{lessons.length} lessons</span>
          <button onClick={function () { setShowNew(!showNew); setEditForm(emptyLesson); }} style={{ padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#38bdf8)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", border: "none", display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={16} /> Add Lesson
          </button>
        </div>

        {/* New Lesson Form */}
        {showNew && (
          <LessonForm onSave={createLesson} onCancel={function () { setShowNew(false); }} />
        )}

        {/* Lessons List */}
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <div style={{ width: 32, height: 32, border: "3px solid #334155", borderTopColor: ACCENT, borderRadius: 99, animation: "spin 1s linear infinite", margin: "0 auto" }} />
          </div>
        ) : (
          lessons.map(function (lesson) {
            var isEditing = editingId === lesson.id;
            var isDeleting = deleteConfirm === lesson.id;
            return (
              <div key={lesson.id} style={{ background: "#1e293b", borderRadius: 12, border: "1px solid #334155", marginBottom: 12, overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ color: "#475569", fontSize: 12, fontFamily: "DM Mono,monospace", width: 24, textAlign: "center" }}>#{lesson.order}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#f8fafc", fontSize: 14, fontWeight: 700 }}>{lesson.title}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                      <span style={{ color: "#64748b", fontSize: 11 }}>{lesson.signLabel}</span>
                      {lesson.difficulty && <span style={{ color: "#94a3b8", fontSize: 11, padding: "1px 8px", borderRadius: 99, background: "#334155" }}>{lesson.difficulty}</span>}
                      {lesson.category && <span style={{ color: "#94a3b8", fontSize: 11, padding: "1px 8px", borderRadius: 99, background: "#334155" }}>{lesson.category}</span>}
                      {lesson.videoUrl && <span style={{ color: GREEN, fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}><Video size={10} /> Video</span>}
                      <span style={{ color: "#64748b", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}><Clock size={10} /> {lesson.duration}m</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={function () { startEdit(lesson); }} style={{ padding: "6px 10px", borderRadius: 8, background: "transparent", border: "1px solid #334155", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                      <Pencil size={12} /> Edit
                    </button>
                    <button onClick={function () { setDeleteConfirm(lesson.id); }} style={{ padding: "6px 10px", borderRadius: 8, background: "transparent", border: "1px solid #334155", color: RED, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Edit Form */}
                {isEditing && <LessonForm onSave={function () { updateLesson(lesson.id); }} onCancel={function () { setEditingId(null); }} />}

                {/* Delete Confirm */}
                {isDeleting && (
                  <div style={{ padding: "12px 18px", background: "rgba(239,68,68,0.05)", borderTop: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", gap: 12 }}>
                    <AlertTriangle size={16} style={{ color: RED }} />
                    <span style={{ color: "#e2e8f0", fontSize: 13, flex: 1 }}>Delete "{lesson.title}"? This cannot be undone.</span>
                    <button onClick={function () { deleteLesson(lesson.id); }} style={{ padding: "6px 16px", borderRadius: 8, background: RED, color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer", border: "none" }}>Delete</button>
                    <button onClick={function () { setDeleteConfirm(null); }} style={{ padding: "6px 16px", borderRadius: 8, background: "transparent", color: "#94a3b8", border: "1px solid #334155", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
