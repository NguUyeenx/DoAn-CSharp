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
  regenerateAllAudio: (languages?: string[]) => api.post<any>('/admin/audio/regenerate-all', { languages }),

  // Quiz questions CRUD
  getQuizQuestions: (poiId?: number) => api.get<any[]>('/admin/quiz', { params: poiId ? { poiId } : undefined }),
  createQuiz: (data: any) => api.post('/admin/quiz', data),
  updateQuiz: (id: number, data: any) => api.put(`/admin/quiz/${id}`, data),
  deleteQuiz: (id: number) => api.delete(`/admin/quiz/${id}`),

  // Category management
  getCategories: () => api.get<any[]>('/admin/categories'),
  createCategory: (data: any) => api.post('/admin/categories', data),
  updateCategory: (id: number, data: any) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id: number) => api.delete(`/admin/categories/${id}`),

  // Audit logs list
  getAuditLogs: () => api.get<any[]>('/admin/audit-logs'),

  // Visitor trip / visit logs list
  getVisitLogs: () => api.get<any[]>('/admin/visit-logs'),

  // Comprehensive Owner management
  getAllOwners: () => api.get<any[]>('/admin/owners'),
  createOwner: (data: any) => api.post('/admin/owners', data),
  deleteOwner: (id: number) => api.delete(`/admin/owners/${id}`),
  lockOwner: (id: number) => api.put(`/admin/owners/${id}/lock`),
  unlockOwner: (id: number) => api.put(`/admin/owners/${id}/unlock`),
  resetOwnerPassword: (id: number, data: { newPassword: string }) => api.put(`/admin/owners/${id}/reset-password`, data),

  // Comprehensive POI management
  updatePOIOwner: (id: number, data: { ownerId: number | null }) => api.put(`/admin/pois/${id}/owner`, data),
  restorePOI: (id: number) => api.post(`/admin/pois/${id}/restore`),
  saveCustomAudio: (poiId: number, data: { languageCode: string; filePath: string; durationSeconds: number }) =>
    api.post(`/admin/pois/${poiId}/custom-audio`, data),

  // Admin Notifications
  getNotifications: () => api.get<any[]>('/admin/notifications'),
  markNotificationRead: (id: number) => api.put(`/admin/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/admin/notifications/read-all'),
};
