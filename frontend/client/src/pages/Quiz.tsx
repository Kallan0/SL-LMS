/**
 * Quiz Page
 * 
 * Interactive quiz for lessons with multiple question types.
 * Tracks answers and provides scoring.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { Button } from "../components/ui/button";
import { useQuery, useMutation } from "../hooks/useQuery";
import { apiService } from "../services/api";
import { ErrorBanner } from "../components/ErrorBanner";

export interface QuizPageProps {
  lessonId: string;
}

/**
 * Quiz Page Component
 */
export function QuizPage({ lessonId }: QuizPageProps) {
  const [, setLocation] = useLocation();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch quiz questions
  const { data: questions = [], isLoading, error: questionsError } = useQuery(
    `quiz-${lessonId}`,
    () => apiService.getQuizQuestions(lessonId),
    { staleTime: 15 * 60 * 1000 } // 15 minutes
  );

  // Submit quiz mutation
  const { mutate: submitQuiz, isLoading: isSubmitting } = useMutation(
    (answersData: Record<string, string>) => apiService.submitQuiz(lessonId, answersData),
    {
      onSuccess: (result) => {
        setQuizResult(result);
        setShowResults(true);
      },
      onError: (err) => {
        setError(err.message);
        console.error("Failed to submit quiz:", err);
      },
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/20 mb-4">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-slate-400">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (questionsError || !questions || questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <ErrorBanner
          message="Failed to load quiz questions. Please try again."
          title="Loading Error"
          severity="error"
          onDismiss={() => setLocation("/lessons")}
          autoDismissMs={0}
        />
      </div>
    );
  }

  if (showResults && quizResult) {
    const percentage = Math.round(quizResult.score);
    const isPassed = percentage >= 70;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto px-4 py-12"
      >
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
              isPassed
                ? "bg-green-500/20 border border-green-500/50"
                : "bg-red-500/20 border border-red-500/50"
            }`}
          >
            {isPassed ? (
              <CheckCircle className="w-8 h-8 text-green-400" />
            ) : (
              <XCircle className="w-8 h-8 text-red-400" />
            )}
          </motion.div>

          <h2 className="text-3xl font-bold text-white mb-2">
            {isPassed ? "Great Job!" : "Keep Practicing"}
          </h2>

          <p className="text-slate-400 mb-6">
            {isPassed
              ? "You passed the quiz! You're making great progress."
              : "You need to score at least 70% to pass. Try again!"}
          </p>

          {/* Score Display */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">Score</p>
              <p className="text-3xl font-bold text-indigo-400">{percentage}%</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">Correct</p>
              <p className="text-3xl font-bold text-green-400">
                {quizResult.correctAnswers}/{quizResult.questionsAnswered}
              </p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">Time</p>
              <p className="text-3xl font-bold text-yellow-400">
                {Math.round(quizResult.timeSpent / 60)}m
              </p>
            </div>
          </div>

          {/* XP Reward */}
          {isPassed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 mb-8"
            >
              <p className="text-yellow-300 font-semibold">+100 XP Earned!</p>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={() => setLocation("/lessons")}
              variant="outline"
              className="text-slate-300 border-slate-600 hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lessons
            </Button>

            {!isPassed && (
              <Button
                onClick={() => {
                  setCurrentQuestionIndex(0);
                  setAnswers({});
                  setShowResults(false);
                  setQuizResult(null);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  const currentQuestion = questions && questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion.id];
  const isAnswered = currentAnswer !== undefined;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto px-4 py-12"
    >
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => setLocation("/lessons")}
          className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Lessons
        </button>

        {/* Progress */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Quiz</h1>
          <span className="text-sm text-slate-400">
            Question {currentQuestionIndex + 1} of {questions?.length || 0}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-700 rounded-full h-2">
          <motion.div
            className="bg-indigo-500 h-2 rounded-full"
            animate={{
              width: `${((currentQuestionIndex + 1) / (questions?.length || 1)) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Error Banner - Hidden for now */}
      {false && error && (
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

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-slate-800 rounded-lg p-8 border border-slate-700 mb-8"
        >
          <h2 className="text-xl font-bold text-white mb-6">
            {currentQuestion.question}
          </h2>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {currentQuestion?.options.map((option: any) => {
              const isSelected = currentAnswer === option.id;

              return (
                <motion.button
                  key={option.id}
                  onClick={() =>
                    setAnswers({ ...answers, [currentQuestion.id]: option.id })
                  }
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                      : "bg-slate-700/50 border-slate-600 text-slate-300 hover:border-indigo-500/50"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-500"
                          : "border-slate-500"
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <span>{option.text}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Explanation */}
          {currentQuestion?.explanation && (
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                <strong>Explanation:</strong> {currentQuestion.explanation}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0}
          variant="outline"
          className="text-slate-300 border-slate-600 hover:bg-slate-700"
        >
          Previous
        </Button>

        {currentQuestionIndex === (questions?.length || 0) - 1 ? (
          <Button
            onClick={() => {
              if (answers) submitQuiz(answers);
            }}
            disabled={!isAnswered || isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
            disabled={!isAnswered}
            className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </Button>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Wrapper component for quiz page
 */
export default function QuizPageWrapper() {
  const [location] = useLocation();
  
  // Extract lessonId from URL
  const lessonId = location.split("/").pop() || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12">
      <QuizPage lessonId={lessonId} />
    </div>
  );
}
