import { api } from './client';
import type { Translation } from '@/types/api';

export const translationsApi = {
  getTranslation: (poiId: number, lang: string) =>
    api.get<Translation>(`/translations/${poiId}/${lang}`),

  createTranslation: (dto: Translation) =>
    api.post<Translation>('/translations', dto),
};
