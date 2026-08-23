/**
 * Lessons Page
 *
 * Displays all available lessons with filtering and search capabilities.
 * Shows embedded YouTube ISL videos and lesson progress.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Filter, Search, Play, CheckCircle, Clock, X, Video } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@/hooks/useQuery";
import { apiService } from "@/services/api";
import { Lesson, LessonDifficulty, LessonCategory } from "@/types";

/**
 * Extract YouTube video ID from a URL or embed URL.
 * Returns null if not a valid YouTube URL.
 */
function getYoutubeId(url?: string | null): string | null {
  if (!url) return null;
  // Match youtube.com/embed/VIDEOID
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  if (embedMatch) return embedMatch[1];
  // Match youtube.com/watch?v=VIDEOID
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) return watchMatch[1];
  // Match youtu.be/VIDEOID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return shortMatch[1];
  return null;
}

export default function Lessons() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<LessonDifficulty | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<LessonCategory | "all">("all");
  const [playingLessonId, setPlayingLessonId] = useState<string | null>(null);

  const { data: lessons = [], isLoading, error, refetch } = useQuery(
    "lessons",
    () => apiService.getLessons(),
    { staleTime: 10 * 60 * 1000 }
  );

  const { data: progress = [] } = useQuery(
    "progress",
    () => apiService.getProgress(),
    { staleTime: 5 * 60 * 1000 }
  );

  const filteredLessons = useMemo(() => {
    if (!lessons) return [];
    return lessons.filter((lesson) => {
      const matchesSearch =
        lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lesson.description ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDifficulty = selectedDifficulty === "all" || (lesson.difficulty ?? '').toLowerCase() === selectedDifficulty.toLowerCase();
      const matchesCategory = selectedCategory === "all" || (lesson.category ?? '').toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesDifficulty && matchesCategory;
    });
  }, [lessons || [], searchTerm, selectedDifficulty, selectedCategory]);

  const getProgressForLesson = (lessonId: string) => {
    if (!progress) return undefined;
    return progress.find((p) => p.lessonId === lessonId);
  };

  const getDifficultyColor = (difficulty?: LessonDifficulty | string) => {
    switch (difficulty) {
      case LessonDifficulty.BEGINNER:
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case LessonDifficulty.INTERMEDIATE:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case LessonDifficulty.ADVANCED:
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  // Currently playing lesson
  const playingLesson = playingLessonId && lessons ? lessons.find((l) => l.id === playingLessonId) ?? null : null;
  const playingYoutubeId = playingLesson ? getYoutubeId(playingLesson.videoUrl) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Video Modal */}
      <AnimatePresence>
        {playingLessonId && playingYoutubeId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setPlayingLessonId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white text-lg font-semibold">{playingLesson?.title}</h3>
                <button
                  onClick={() => setPlayingLessonId(null)}
                  className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  src={`https://www.youtube.com/embed/${playingYoutubeId}?autoplay=1&rel=0`}
                  className="absolute inset-0 w-full h-full rounded-xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={playingLesson?.title}
                />
              </div>
              <p className="text-slate-400 text-sm mt-3">{playingLesson?.description}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-slate-800/50 dark:bg-slate-900/50 border-b border-slate-700 dark:border-slate-800 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-8 h-8 text-indigo-400" />
              <h1 className="text-3xl font-bold text-white">Lessons</h1>
            </div>
            <p className="text-slate-400">Browse and learn Indian Sign Language with embedded video tutorials</p>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 dark:bg-slate-900 rounded-lg p-6 border border-slate-700 dark:border-slate-800 mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                type="text"
                placeholder="Search lessons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 dark:bg-slate-800 border-slate-600 dark:border-slate-700 text-white placeholder-slate-500"
              />
            </div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as any)}
              className="px-4 py-2 bg-slate-700 dark:bg-slate-800 border border-slate-600 dark:border-slate-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Difficulties</option>
              <option value={LessonDifficulty.BEGINNER}>Beginner</option>
              <option value={LessonDifficulty.INTERMEDIATE}>Intermediate</option>
              <option value={LessonDifficulty.ADVANCED}>Advanced</option>
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="px-4 py-2 bg-slate-700 dark:bg-slate-800 border border-slate-600 dark:border-slate-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              <option value={LessonCategory.ALPHABET}>Alphabet</option>
              <option value={LessonCategory.NUMBERS}>Numbers</option>
              <option value={LessonCategory.PHRASES}>Phrases</option>
              <option value={LessonCategory.CONVERSATION}>Conversation</option>
              <option value={LessonCategory.GRAMMAR}>Grammar</option>
            </select>
          </div>
        </motion.div>

        {/* Lessons Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/20 mb-4">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-slate-400">Loading lessons...</p>
            </div>
          </div>
        ) : !filteredLessons || filteredLessons.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No lessons found matching your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.map((lesson, index) => {
              const lessonProgress = getProgressForLesson(lesson.id);
              const isCompleted = lessonProgress?.status === "COMPLETED" || (lessonProgress?.status as string) === "mastered";
              const youtubeId = getYoutubeId(lesson.videoUrl);
              const hasVideo = !!youtubeId;

              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-slate-800 dark:bg-slate-900 rounded-lg border border-slate-700 dark:border-slate-800 overflow-hidden hover:border-indigo-500/50 transition-colors group"
                >
                  {/* Thumbnail */}
                  <div className="relative h-40 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 overflow-hidden">
                    {hasVideo ? (
                      <img
                        src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                        alt={lesson.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-slate-700/50 group-hover:bg-slate-700/30 transition-colors flex items-center justify-center">
                        <Video className="w-12 h-12 text-indigo-400/30" />
                      </div>
                    )}

                    {/* Play button overlay */}
                    {hasVideo && (
                      <button
                        onClick={() => setPlayingLessonId(lesson.id)}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <div className="w-14 h-14 rounded-full bg-indigo-600/90 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                          <Play className="w-6 h-6 text-white ml-1" />
                        </div>
                      </button>
                    )}

                    {isCompleted && (
                      <div className="absolute top-3 right-3 bg-green-500/20 border border-green-500/50 rounded-full p-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                    )}

                    {hasVideo && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <Video className="w-3 h-3" /> Video
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white flex-1">{lesson.title}</h3>
                    </div>

                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">{lesson.description}</p>

                    <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{lesson.duration} min</span>
                    </div>

                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getDifficultyColor(lesson.difficulty ?? "")}`}>
                        {lesson.difficulty}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-slate-700 text-slate-300 border border-slate-600">
                        {lesson.category}
                      </span>
                    </div>

                    {lessonProgress && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span>Progress</span>
                          <span>
                            {lessonProgress.exercisesCompleted ?? 0}/{lessonProgress.totalExercises ?? 0}
                          </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-indigo-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${((lessonProgress.exercisesCompleted ?? 0) / (lessonProgress.totalExercises ?? 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {hasVideo ? (
                      <Button
                        onClick={() => setPlayingLessonId(lesson.id)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        {isCompleted ? "Review Video" : lessonProgress ? "Continue" : "Watch Lesson"}
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center gap-2"
                        disabled
                      >
                        <Play className="w-4 h-4" />
                        Coming Soon
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
