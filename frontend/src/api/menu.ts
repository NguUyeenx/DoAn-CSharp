import { api } from './client';
import type { MenuItem } from '@/types/poi';

export const menuApi = {
  getByPOI: (poiId: number, lang = 'en') =>
    api.get<MenuItem[]>(`/pois/${poiId}/menu`, { params: { lang } }),
};
