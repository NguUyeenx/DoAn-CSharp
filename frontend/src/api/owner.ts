import { api } from './client';
import type { POI, MenuItem } from '@/types/poi';

export const ownerApi = {
  getMyPOIs: (lang?: string) => {
    const query = lang ? `?lang=${lang}` : '';
    return api.get<POI[]>(`/owner/pois${query}`);
  },

  getMyPOI: (id: number, lang?: string) => {
    const query = lang ? `?lang=${lang}` : '';
    return api.get<POI>(`/owner/pois/${id}${query}`);
  },

  createPOI: (dto: any) =>
    api.post<POI>('/owner/pois', dto),

  updatePOI: (id: number, dto: any) =>
    api.put<POI>(`/owner/pois/${id}`, dto),

  createMenuItem: (dto: any) =>
    api.post<MenuItem>('/owner/menu-items', dto),

  updateMenuItem: (id: number, dto: any) =>
    api.put<MenuItem>(`/owner/menu-items/${id}`, dto),

  deleteMenuItem: (id: number) =>
    api.delete(`/owner/menu-items/${id}`),

  toggleMenuAvailability: (id: number, isAvailable: boolean) =>
    api.put(`/owner/menu-items/${id}/availability`, isAvailable),

  addPOIImages: (poiId: number, urls: string[]) =>
    api.post(`/owner/pois/${poiId}/images`, urls),

  deletePOIImage: (poiId: number, imageId: number) =>
    api.delete(`/owner/pois/${poiId}/images/${imageId}`),

  setCoverImage: (poiId: number, imageId: number) =>
    api.put(`/owner/pois/${poiId}/cover-image`, imageId),

  reorderPOIImages: (poiId: number, orders: any) =>
    api.put(`/owner/pois/${poiId}/images/reorder`, orders),

  getOwnerDashboard: () =>
    api.get('/owner/dashboard'),

  getOwnerDashboardCharts: () =>
    api.get('/owner/dashboard/charts'),

  getNotifications: () =>
    api.get('/notifications'),

  markNotificationRead: (id: number) =>
    api.put(`/notifications/${id}/read`),

  getUnreadCount: () =>
    api.get('/notifications/unread-count'),

  saveCustomAudio: (poiId: number, data: { languageCode: string; filePath: string; durationSeconds: number }) =>
    api.post(`/owner/pois/${poiId}/custom-audio`, data),

  deletePOI: (id: number) =>
    api.delete(`/owner/pois/${id}`),

  getPOIQRs: (poiId: number) =>
    api.get<any[]>(`/owner/pois/${poiId}/qr`),

  generatePOIQR: (poiId: number) =>
    api.post<any>(`/owner/pois/${poiId}/generate-qr?baseUrl=${encodeURIComponent(window.location.origin)}`),

  deletePOIQR: (id: number) =>
    api.delete(`/owner/qr/${id}`),
};
