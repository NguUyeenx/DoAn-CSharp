import { api } from './client';

export const visitorApi = {
  getStatus: (sessionId: string) =>
    api.get<any>(`/visitor/status?sessionId=${sessionId}`),
  activate: (data: { sessionId: string; code?: string; cardNumber: string; cardHolder: string; languageCode?: string }) =>
    api.post<any>('/visitor/activate', data),
  bookmark: (sessionId: string, poiId: number) =>
    api.post<any>('/visitor/bookmark', { sessionId, poiId }),
  unbookmark: (sessionId: string, poiId: number) =>
    api.delete<any>('/visitor/bookmark', { data: { sessionId, poiId } }),
};
