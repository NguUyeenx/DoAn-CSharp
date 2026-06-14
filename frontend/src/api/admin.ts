import { api } from './client';
import type { Language } from '@/types/api';

export const adminApi = {
  // Languages
  getLanguages: () => api.get<Language[]>('/admin/languages'),
  toggleLanguageStatus: (code: string, isActive: boolean) =>
    api.put(`/admin/languages/${code}/status`, { isActive }),
  setDefaultLanguage: (code: string) =>
    api.put(`/admin/languages/${code}/default`),

  // Owner approval management
  getPendingOwners: () => api.get<any[]>('/admin/owners/pending'),
  approveOwner: (id: number) => api.put(`/admin/owners/${id}/approve`),
  rejectOwner: (id: number, reason: string) =>
    api.put(`/admin/owners/${id}/reject`, { reason }),

  // POI status management
  getPOIs: (params?: { lang?: string }) => api.get<any[]>('/admin/pois', { params }),
  getPendingPOIs: () => api.get<any[]>('/admin/pois/pending'),
  updatePOIStatus: (id: number, status: string) =>
    api.put(`/admin/pois/${id}/status`, { status }),

  // Audio files management
  getAudioFiles: () => api.get<any[]>('/admin/audio'),
  deleteAudio: (id: number) => api.delete(`/admin/audio/${id}`),
  regenerateAudio: (id: number) => api.post(`/admin/audio/${id}/regenerate`),

  // Quiz questions CRUD
  createQuiz: (data: any) => api.post('/admin/quiz', data),
  updateQuiz: (id: number, data: any) => api.put(`/admin/quiz/${id}`, data),
  deleteQuiz: (id: number) => api.delete(`/admin/quiz/${id}`),

  // Audit logs list
  getAuditLogs: () => api.get<any[]>('/admin/audit-logs'),
};
