import { api } from './client';

export const qrApi = {
  scanQRCode: (code: string, sessionId: string, lang?: string) => {
    const langParam = lang ? `&lang=${lang}` : '';
    return api.get(`/qr/${code}?sessionId=${sessionId}${langParam}`);
  },

  adminGenerateQR: (poiId: number) =>
    api.post(`/admin/pois/${poiId}/generate-qr`),

  adminGetPOIQR: (poiId: number) =>
    api.get(`/admin/pois/${poiId}/qr`),

  adminGetAllQR: () =>
    api.get('/admin/qr'),

  adminToggleQRStatus: (id: number, isActive: boolean) =>
    api.put(`/admin/qr/${id}/status`, isActive),
};
