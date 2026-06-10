import { apiClient } from "@/lib/axios";
import type { POI } from "@/types/poi";

export interface DashboardStats {
  totalViews: number;
  totalScans: number;
  totalAudioListens: number;
  activePoisCount: number;
}

export const ownerApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get("/owner/dashboard");
    return data;
  },

  getMyPois: async (): Promise<POI[]> => {
    const { data } = await apiClient.get("/owner/pois");
    return data;
  },

  createPoi: async (poiData: any): Promise<POI> => {
    const { data } = await apiClient.post("/owner/pois", poiData);
    return data;
  },

  updatePoi: async (id: number, poiData: any): Promise<POI> => {
    const { data } = await apiClient.put(`/owner/pois/${id}`, poiData);
    return data;
  },

  deletePoi: async (id: number): Promise<void> => {
    await apiClient.delete(`/owner/pois/${id}`);
  },
};

