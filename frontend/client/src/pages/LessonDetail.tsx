/**
 * LessonDetail Page
 * 
 * Displays detailed lesson content with video, steps, and practice exercises.
 * Allows users to track progress and complete exercises.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Play,
  CheckCircle,
  Clock,
  BookOpen,
  Zap,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@/hooks/useQuery";
import { apiService } from "@/services/api";
import { useAuthContext } from "@/contexts/AuthContext";
import { ErrorBanner } from "@/components/ErrorBanner";
import type { ProgressStatus } from "@/types";

export interface LessonDetailProps {
  lessonId: string;
}

/**
 * LessonDetail Page Component
 */
export function LessonDetail({ lessonId }: LessonDetailProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuthContext();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(
    new Set()
  );
  const [error, setError] = useState<string | null>(null);

  // Fetch lesson details
  const { data: lesson, isLoading: lessonLoading, error: lessonError } = useQuery(
    `lesson-${lessonId}`,
    () => apiService.getLesson(lessonId),
    { staleTime: 15 * 60 * 1000 } // 15 minutes
  );

  // Fetch lesson progress
  const { data: progress } = useQuery(
    `progress-${lessonId}`,
    () => apiService.getLessonProgress(lessonId),
    { staleTime: 5 * 60 * 1000 } // 5 minutes
  );

  // Update progress mutation
  const { mutate: updateProgress, isLoading: isUpdating } = useMutation(
    (status: ProgressStatus) =>
      apiService.updateProgress(lessonId, status, calculateAccuracy()),
    {
      onSuccess: () => {
        console.log("Progress updated successfully");
      },
      onError: (err) => {
        setError(err.message);
        console.error("Failed to update progress:", err);
      },
    }
  );

  const calculateAccuracy = () => {
    if (!lesson) return 0;
    const totalExercises = exercises.length;
    return (completedExercises.size / totalExercises) * 100;
  };

  const handleCompleteExercise = (exerciseId: string) => {
    setCompletedExercises((prev) => new Set(prev).add(exerciseId));
  };

  const handleCompleteLesson = () => {
    updateProgress("completed" as ProgressStatus);
  };

  if (lessonLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/20 mb-4">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-slate-400">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (lessonError || !lesson || !lesson.content) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ErrorBanner
          message="Failed to load lesson. Please try again."
          title="Loading Error"
          severity="error"
          onDismiss={() => setLocation("/lessons")}
          autoDismissMs={0}
        />
      </div>
    );
  }

  const content = lesson.content;
  const steps = content.steps ?? [];
  const exercises = content.practiceExercises ?? [];
  const currentStep = steps[currentStepIndex];
  const allExercisesCompleted =
    completedExercises.size === exercises.length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <button
          onClick={() => setLocation("/lessons")}
          className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Lessons
        </button>

        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{lesson.title}</h1>
            <p className="text-slate-400">{lesson.description}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Clock className="w-4 h-4" />
            {lesson.duration} min
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Lesson Progress</span>
              <span>
                {completedExercises.size}/{exercises.length}
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <motion.div
                className="bg-indigo-500 h-2 rounded-full transition-all"
                animate={{
                  width: `${(completedExercises.size / exercises.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <ErrorBanner
            message={error || "An error occurred"}
            title="Error"
            severity="error"
            onDismiss={() => setError(null)}
            autoDismissMs={0}
          />
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          {/* Introduction */}
          {currentStepIndex === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6"
            >
              <h2 className="text-xl font-bold text-white mb-4">Introduction</h2>
              <p className="text-slate-300 leading-relaxed">
                {content.introduction}
              </p>
            </motion.div>
          )}

          {/* Steps */}
          {currentStep && (
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                  {currentStepIndex}
                </div>
                <h2 className="text-xl font-bold text-white">{currentStep.title}</h2>
              </div>

              <p className="text-slate-300 mb-4">{currentStep.description}</p>

              {currentStep.videoUrl && (
                <div className="mb-4 bg-slate-700 rounded-lg aspect-video flex items-center justify-center">
                  <div className="text-center">
                    <Play className="w-12 h-12 text-indigo-400 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">Video Player</p>
                  </div>
                </div>
              )}

              {currentStep.tips && currentStep.tips.length > 0 && (
                <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-blue-300 mb-2">Tips:</h3>
                      <ul className="space-y-1">
                        {currentStep.tips.map((tip, idx) => (
                          <li key={idx} className="text-sm text-blue-200">
                            • {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Summary */}
          {currentStepIndex === steps.length && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6"
            >
              <h2 className="text-xl font-bold text-white mb-4">Summary</h2>
              <p className="text-slate-300 leading-relaxed">
                {content.summary}
              </p>
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <Button
              onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
              disabled={currentStepIndex === 0}
              variant="outline"
            >
              Previous
            </Button>

            <span className="text-sm text-slate-400">
              {currentStepIndex} / {steps.length + 1}
            </span>

            <Button
              onClick={() =>
                setCurrentStepIndex(
                  Math.min(steps.length, currentStepIndex + 1)
                )
              }
              disabled={currentStepIndex === steps.length}
            >
              Next
            </Button>
          </div>
        </motion.div>

        {/* Sidebar - Exercises */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 sticky top-20">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Exercises
            </h3>

            <div className="space-y-3 mb-6">
              {exercises.map((exercise) => {
                const isCompleted = completedExercises.has(exercise.id);

                return (
                  <motion.button
                    key={exercise.id}
                    onClick={() => handleCompleteExercise(exercise.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isCompleted
                        ? "bg-green-900/20 border-green-700/50"
                        : "bg-slate-700/50 border-slate-600 hover:border-indigo-500/50"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start gap-3">
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            isCompleted ? "text-green-300" : "text-white"
                          }`}
                        >
                          {exercise.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {exercise.type}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Complete Lesson Button */}
            <Button
              onClick={handleCompleteLesson}
              disabled={!allExercisesCompleted || isUpdating}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUpdating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Complete Lesson
                </>
              )}
            </Button>

            {!allExercisesCompleted && (
              <p className="text-xs text-slate-400 text-center mt-2">
                Complete all exercises to finish the lesson
              </p>
            )}

            {/* XP Reward */}
            <div className="mt-6 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-300">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">+150 XP when completed</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Wrapper component for lesson detail page
 */
export default function LessonDetailPage() {
  const [location] = useLocation();
  
  // Extract lessonId from URL
  const lessonId = location.split("/").pop() || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12">
      <LessonDetail lessonId={lessonId} />
    </div>
  );
}
