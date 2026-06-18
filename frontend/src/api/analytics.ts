import { api } from './client';
import type { AnalyticsSummary, VisitCreateRequest, UpdateLanguageRequest } from '@/types/api';

export const analyticsApi = {
  logVisit: (data: VisitCreateRequest) => api.post('/analytics/visit', data),

  updateVisitLanguage: (data: UpdateLanguageRequest) => api.post('/analytics/update-language', data),

  getDashboard: () => api.get<AnalyticsSummary>('/analytics/dashboard'),

  getSummary: () => api.get<AnalyticsSummary>('/analytics/summary'),
};
