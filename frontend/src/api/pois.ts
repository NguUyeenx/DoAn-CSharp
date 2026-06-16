import { api } from './client';
import type { POI, POIListItem } from '@/types/poi';

export const poisApi = {
  getAll: (params?: { category?: string; q?: string; lang?: string }) =>
    api.get<POIListItem[]>('/pois', { params }),

  search: (q: string, lang = 'en') =>
    api.get<POIListItem[]>('/pois/search', { params: { q, lang } }),

  getNearby: (lat: number, lng: number, r = 500, lang = 'en') =>
    api.get<POIListItem[]>('/pois/nearby', { params: { lat, lng, r, lang } }),

  getById: (id: number, lang = 'en') =>
    api.get<POI>(`/pois/${id}`, { params: { lang } }),

  getBySlug: (slug: string, lang = 'en') =>
    api.get<POI>(`/pois/slug/${slug}`, { params: { lang } }),

  // Admin
  create: (data: Partial<POI>) => api.post<POI>('/pois', data),
  update: (id: number, data: Partial<POI>) =>
    api.put<POI>(`/pois/${id}`, data),
  delete: (id: number) => api.delete(`/pois/${id}`),
  restore: (id: number) => api.post(`/pois/${id}/restore`),

  submitReview: (id: number, data: { visitorName: string; visitorPhone: string; rating: number; comment?: string }) =>
    api.post(`/pois/${id}/reviews`, data),
};
