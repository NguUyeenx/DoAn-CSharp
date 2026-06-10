import { apiClient } from "@/lib/axios";
import type { MenuItem } from "@/types/poi";

export const menuApi = {
  getByPoi: async (poiId: number): Promise<MenuItem[]> => {
    const { data } = await apiClient.get(`/owner/pois/${poiId}/menu`);
    return data;
  },

  create: async (poiId: number, itemData: any): Promise<MenuItem> => {
    const { data } = await apiClient.post(`/owner/pois/${poiId}/menu`, itemData);
    return data;
  },

  update: async (poiId: number, id: number, itemData: any): Promise<MenuItem> => {
    const { data } = await apiClient.put(`/owner/pois/${poiId}/menu/${id}`, itemData);
    return data;
  },

  delete: async (poiId: number, id: number): Promise<void> => {
    await apiClient.delete(`/owner/pois/${poiId}/menu/${id}`);
  },
};

