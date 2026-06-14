import { api } from './client';

export const audioApi = {
  getAudioUrl: (text: string, lang: string, poiId: number) =>
    api.get<{ url: string }>('/audio/generate', {
      params: { text, lang, poiId },
    }),
};
