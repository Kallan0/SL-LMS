/**
 * Lessons Page
 * 
 * Displays all available lessons with filtering and search capabilities.
 * Shows lesson progress and allows users to start/continue lessons.
 */

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen, Filter, Search, Play, CheckCircle, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@/hooks/useQuery";
import { apiService } from "@/services/api";
import { Lesson, LessonDifficulty, LessonCategory } from "@/types";
import { ErrorBanner } from "@/components/ErrorBanner";

/**
 * Lessons Page Component
 */
export default function Lessons() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<LessonDifficulty | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<LessonCategory | "all">("all");

  // Fetch lessons
  const { data: lessons = [], isLoading, error, refetch } = useQuery(
    "lessons",
    () => apiService.getLessons(),
    { staleTime: 10 * 60 * 1000 } // 10 minutes
  );

  // Fetch progress
  const { data: progress = [] } = useQuery(
    "progress",
    () => apiService.getProgress(),
    { staleTime: 5 * 60 * 1000 } // 5 minutes
  );

  // Filter lessons
  const filteredLessons = useMemo(() => {
    if (!lessons) return [];
    return lessons.filter((lesson) => {
      const matchesSearch =
        lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDifficulty =
        selectedDifficulty === "all" || lesson.difficulty === selectedDifficulty;

      const matchesCategory =
        selectedCategory === "all" || lesson.category === selectedCategory;

      return matchesSearch && matchesDifficulty && matchesCategory;
    });
  }, [lessons || [], searchTerm, selectedDifficulty, selectedCategory]);

  // Get progress for a lesson
  const getProgressForLesson = (lessonId: string) => {
    if (!progress) return undefined;
    return progress.find((p) => p.lessonId === lessonId);
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: LessonDifficulty) => {
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
              <BookOpen className="w-8 h-8 text-indigo-400" />
              <h1 className="text-3xl font-bold text-white">Lessons</h1>
            </div>
            <p className="text-slate-400">Browse and learn sign language lessons</p>
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
              message="Failed to load lessons. Please try again."
              title="Loading Error"
              severity="error"
              onDismiss={refetch}
              autoDismissMs={0}
            />
          </motion.div>
        )}

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
            {/* Search */}
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

            {/* Difficulty Filter */}
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

            {/* Category Filter */}
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
              const isCompleted = lessonProgress?.status === "completed" || lessonProgress?.status === "mastered";

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
                    <div className="absolute inset-0 bg-slate-700/50 group-hover:bg-slate-700/30 transition-colors" />
                    {isCompleted && (
                      <div className="absolute top-3 right-3 bg-green-500/20 border border-green-500/50 rounded-full p-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white flex-1">{lesson.title}</h3>
                    </div>

                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                      {lesson.description}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{lesson.duration} min</span>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${getDifficultyColor(
                          lesson.difficulty
                        )}`}
                      >
                        {lesson.difficulty}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-slate-700 text-slate-300 border border-slate-600">
                        {lesson.category}
                      </span>
                    </div>

                    {/* Progress */}
                    {lessonProgress && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span>Progress</span>
                          <span>{lessonProgress.exercisesCompleted}/{lessonProgress.totalExercises}</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-indigo-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${
                                (lessonProgress.exercisesCompleted /
                                  lessonProgress.totalExercises) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Button */}
                    <Button
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      {isCompleted ? "Review" : lessonProgress ? "Continue" : "Start"}
                    </Button>
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
