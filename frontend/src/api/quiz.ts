import { api } from './client';
import type { QuizQuestion, QuizSubmission, QuizResult } from '@/types/api';

export const quizApi = {
  getQuiz: (poiId: number, lang?: string) => {
    const query = lang ? `?lang=${lang}` : '';
    return api.get<QuizQuestion[]>(`/pois/${poiId}/quiz${query}`);
  },

  submitQuizAnswer: (data: QuizSubmission, lang?: string) => {
    const query = lang ? `?lang=${lang}` : '';
    return api.post<QuizResult>(`/quiz/submit${query}`, data);
  },
};
