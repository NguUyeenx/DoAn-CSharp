import { api } from './client';
import type { Tour, TourListItem } from '@/types/api';

export const toursApi = {
  // Public
  getAll: (lang = 'en') =>
    api.get<TourListItem[]>('/tours', { params: { lang } }),

  getById: (id: number, lang = 'en') =>
    api.get<Tour>(`/tours/${id}`, { params: { lang } }),

  // Admin
  adminCreate: (data: any) =>
    api.post<Tour>('/admin/tours', data),

  adminUpdate: (id: number, data: any) =>
    api.put<Tour>(`/admin/tours/${id}`, data),

  adminDelete: (id: number) =>
    api.delete(`/admin/tours/${id}`),

  adminAddStop: (tourId: number, data: { poiId: number; stopOrder: number; transitionNote?: string }) =>
    api.post(`/admin/tours/${tourId}/stops`, data),

  adminRemoveStop: (tourId: number, poiId: number) =>
    api.delete(`/admin/tours/${tourId}/stops/${poiId}`),

  adminReorderStops: (tourId: number, orders: { poiId: number; stopOrder: number }[]) =>
    api.put(`/admin/tours/${tourId}/stops/reorder`, orders),
};
