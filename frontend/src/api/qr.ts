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

  adminDeleteQR: (id: number) =>
    api.delete(`/admin/qr/${id}`),
};
