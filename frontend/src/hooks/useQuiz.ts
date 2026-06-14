import { useState, useCallback } from 'react';
import { quizApi } from '@/api/quiz';
import type { QuizQuestion, QuizResult } from '@/types/api';
import { useLanguage } from '@/contexts/LanguageContext';

export function useQuiz() {
  const { language } = useLanguage();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const [score, setScore] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);
  const [submissionsCount, setSubmissionsCount] = useState<number>(0);

  const loadQuiz = useCallback(
    async (poiId: number) => {
      setLoading(true);
      setError(null);
      setQuestions([]);
      setCurrentQuestionIndex(0);
      setQuizResult(null);
      setScore(0);
      setCompleted(false);
      setSubmissionsCount(0);

      try {
        const { data } = await quizApi.getQuiz(poiId, language);
        setQuestions(data);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [language]
  );

  const submitAnswer = useCallback(
    async (selectedOption: string) => {
      const currentQuestion = questions[currentQuestionIndex];
      if (!currentQuestion) return null;

      setLoading(true);
      setError(null);
      try {
        const { data } = await quizApi.submitQuizAnswer(
          {
            quizQuestionId: currentQuestion.id,
            selectedOption,
          },
          language
        );

        setQuizResult(data);
        setSubmissionsCount((prev) => prev + 1);

        if (data.isCorrect) {
          setScore((prev) => prev + 1);
        }

        return data;
      } catch (err: any) {
        setError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [questions, currentQuestionIndex, language]
  );

  const nextQuestion = useCallback(() => {
    setQuizResult(null);
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setCompleted(true);
    }
  }, [currentQuestionIndex, questions.length]);

  const resetQuiz = useCallback(() => {
    setCurrentQuestionIndex(0);
    setQuizResult(null);
    setScore(0);
    setCompleted(false);
    setSubmissionsCount(0);
  }, []);

  const currentQuestion = questions[currentQuestionIndex] || null;

  return {
    questions,
    currentQuestionIndex,
    currentQuestion,
    quizResult,
    loading,
    error,
    score,
    completed,
    submissionsCount,
    loadQuiz,
    submitAnswer,
    nextQuestion,
    resetQuiz,
  };
}

export default useQuiz;
