import { api } from './client';
import type { AnalyticsSummary, VisitCreateRequest } from '@/types/api';

export const analyticsApi = {
  logVisit: (data: VisitCreateRequest) => api.post('/analytics/visit', data),

  getDashboard: () => api.get<AnalyticsSummary>('/analytics/dashboard'),

  getSummary: () => api.get<AnalyticsSummary>('/analytics/summary'),
};
