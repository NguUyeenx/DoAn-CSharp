import { api } from './client';
import type { UploadResult } from '@/types/api';

function uploadFile(endpoint: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return api.post<UploadResult>(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export const uploadApi = {
  uploadPOIImage: (file: File) => uploadFile('/upload/image/poi', file),

  uploadMenuImage: (file: File) => uploadFile('/upload/image/menu', file),

  uploadAudio: (file: File) => uploadFile('/upload/audio', file),

  deleteFile: (filePath: string) =>
    api.delete('/upload', { params: { filePath } }),
};
