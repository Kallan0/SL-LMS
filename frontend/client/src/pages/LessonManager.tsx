/**
 * LessonManager Page
 *
 * Mentor-only page for creating, editing, and deleting lessons.
 */

import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { BookOpen, Plus, Pencil, Trash2, Save, Video, Clock, AlertTriangle } from "lucide-react";
import { apiService, type Lesson } from "@/services/api";
import { LogoutConfirmModal } from "@/components/LogoutConfirmModal";
import { LessonManagerSkeleton } from "@/components/PageSkeletons";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

interface LessonForm {
  title: string;
  description: string;
  signLabel: string;
  videoUrl: string;
  difficulty: string;
  category: string;
  order: number;
  duration: number;
}

const emptyForm: LessonForm = {
  title: "",
  description: "",
  signLabel: "",
  videoUrl: "",
  difficulty: "BEGINNER",
  category: "ALPHABET",
  order: 0,
  duration: 10,
};

export default function LessonManager() {
  const [, setLocation] = useLocation();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<LessonForm>(emptyForm);
  const [showNew, setShowNew] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchLessons = useCallback(async () => {
    try {
      const data = await apiService.getLessons();
      setLessons(data);
    } catch (err) {
      console.error("Failed to fetch lessons:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLessons(); }, [fetchLessons]);

  const createLesson = async () => {
    if (!editForm.title.trim()) return;
    try {
      setSaving(true);
      await apiService.createLesson({
        title: editForm.title,
        description: editForm.description || undefined,
        signLabel: editForm.signLabel,
        videoUrl: editForm.videoUrl || undefined,
        difficulty: editForm.difficulty,
        category: editForm.category,
        order: editForm.order,
        duration: editForm.duration,
      });
      setShowNew(false);
      setEditForm(emptyForm);
      fetchLessons();
    } catch (err) {
      console.error("Failed to create lesson:", err);
    } finally {
      setSaving(false);
    }
  };

  const updateLesson = async (id: string) => {
    if (!editForm.title.trim()) return;
    try {
      setSaving(true);
      await apiService.updateLesson(id, {
        title: editForm.title,
        description: editForm.description || undefined,
        signLabel: editForm.signLabel,
        videoUrl: editForm.videoUrl || undefined,
        difficulty: editForm.difficulty,
        category: editForm.category,
        order: editForm.order,
        duration: editForm.duration,
      });
      setEditingId(null);
      fetchLessons();
    } catch (err) {
      console.error("Failed to update lesson:", err);
    } finally {
      setSaving(false);
    }
  };

  const deleteLesson = async (id: string) => {
    try {
      await apiService.deleteLesson(id);
      setDeleteConfirm(null);
      fetchLessons();
    } catch (err) {
      console.error("Failed to delete lesson:", err);
    }
  };

  const startEdit = (lesson: Lesson) => {
    setEditingId(lesson.id);
    setEditForm({
      title: lesson.title,
      description: lesson.description || "",
      signLabel: lesson.signLabel,
      videoUrl: lesson.videoUrl || "",
      difficulty: lesson.difficulty || "BEGINNER",
      category: lesson.category || "ALPHABET",
      order: lesson.order,
      duration: lesson.duration ?? 10,
    });
  };

  const inputClass =
    "w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors";

  const labelClass =
    "block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5";

  const LessonFormComponent = ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) => (
    <div className="bg-slate-900 rounded-xl border border-slate-700 p-5 mt-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-full">
          <label className={labelClass}>Title *</label>
          <input className={inputClass} placeholder="e.g. ISL Alphabet A-E" value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
        </div>
        <div className="col-span-full">
          <label className={labelClass}>Description</label>
          <textarea className={`${inputClass} min-h-[60px] resize-vertical`} placeholder="Lesson description..."
            value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Sign Label</label>
          <input className={inputClass} placeholder="e.g. A-E" value={editForm.signLabel}
            onChange={(e) => setEditForm({ ...editForm, signLabel: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>YouTube URL</label>
          <input className={inputClass} placeholder="https://youtube.com/embed/..." value={editForm.videoUrl}
            onChange={(e) => setEditForm({ ...editForm, videoUrl: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Difficulty</label>
          <select className={`${inputClass} cursor-pointer`} value={editForm.difficulty}
            onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select className={`${inputClass} cursor-pointer`} value={editForm.category}
            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
            <option value="ALPHABET">Alphabet</option>
            <option value="NUMBERS">Numbers</option>
            <option value="PHRASES">Phrases</option>
            <option value="CONVERSATION">Conversation</option>
            <option value="GRAMMAR">Grammar</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Order</label>
          <input className={inputClass} type="number" value={editForm.order}
            onChange={(e) => setEditForm({ ...editForm, order: parseInt(e.target.value) || 0 })} />
        </div>
        <div>
          <label className={labelClass}>Duration (min)</label>
          <input className={inputClass} type="number" value={editForm.duration}
            onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) || 5 })} />
        </div>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={onSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
          <Save size={14} /> {saving ? "Saving..." : "Save"}
        </button>
        <button onClick={onCancel}
          className="px-5 py-2.5 rounded-lg bg-transparent text-slate-400 border border-slate-700 text-sm font-semibold hover:bg-slate-800 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <PageHeader
        icon={<BookOpen className="w-8 h-8" />}
        title="Lesson Manager"
        subtitle="Create, edit, and organize your ISL curriculum"
        accentColor="text-indigo-400"
        actions={
          <button onClick={() => setLocation("/dashboard")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:bg-slate-700/50 text-sm transition-colors">
            ← Back to Dashboard
          </button>
        }
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Action Bar */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-slate-400 text-sm font-medium">{lessons.length} lessons</span>
          <button onClick={() => { setShowNew(!showNew); setEditForm(emptyForm); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-500/20">
            <Plus size={16} /> Add Lesson
          </button>
        </div>

        {/* New Lesson Form */}
        {showNew && <LessonFormComponent onSave={createLesson} onCancel={() => setShowNew(false)} />}

        {/* Lessons List */}
        {loading ? (
          <LessonManagerSkeleton />
        ) : lessons.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-8 h-8" />}
            title="No lessons yet"
            description='Click "Add Lesson" to create your first ISL lesson and start building your curriculum.'
            action={{ label: "Add Lesson", onClick: () => setShowNew(true), icon: <Plus size={16} /> }}
          />
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson) => {
              const isEditing = editingId === lesson.id;
              const isDeleting = deleteConfirm === lesson.id;
              return (
                <div key={lesson.id} className="bg-slate-800 rounded-xl border border-slate-700/50 overflow-hidden hover:border-slate-600 transition-colors">
                  <div className="flex items-center gap-3 px-5 py-4">
                    <div className="text-slate-500 text-xs font-mono w-7 text-center shrink-0">#{lesson.order}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-bold truncate">{lesson.title}</div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-slate-500 text-xs">{lesson.signLabel}</span>
                        {lesson.difficulty && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-medium">
                            {lesson.difficulty}
                          </span>
                        )}
                        {lesson.category && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-medium">
                            {lesson.category}
                          </span>
                        )}
                        {lesson.videoUrl && (
                          <span className="text-emerald-400 text-xs flex items-center gap-1">
                            <Video size={10} /> Video
                          </span>
                        )}
                        <span className="text-slate-500 text-xs flex items-center gap-1">
                          <Clock size={10} /> {lesson.duration}m
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => startEdit(lesson)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-700/50 hover:text-white text-xs font-medium transition-colors">
                        <Pencil size={12} /> Edit
                      </button>
                      <button onClick={() => setDeleteConfirm(lesson.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-red-400 hover:bg-red-600/10 hover:border-red-600/30 text-xs font-medium transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Edit Form */}
                  {isEditing && <LessonFormComponent onSave={() => updateLesson(lesson.id)} onCancel={() => setEditingId(null)} />}

                  {/* Delete Confirm */}
                  {isDeleting && (
                    <div className="flex items-center gap-3 px-5 py-3 bg-red-500/5 border-t border-red-500/20">
                      <AlertTriangle size={16} className="text-red-400 shrink-0" />
                      <span className="text-slate-200 text-sm flex-1">Delete "{lesson.title}"? This cannot be undone.</span>
                      <button onClick={() => deleteLesson(lesson.id)}
                        className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors">
                        Delete
                      </button>
                      <button onClick={() => setDeleteConfirm(null)}
                        className="px-4 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 text-xs font-medium transition-colors">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
