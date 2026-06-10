import { apiClient } from "@/lib/axios";
import type { POI, SearchPOIParams } from "@/types/poi";

export const poiApi = {
  getAll: async (): Promise<POI[]> => {
    const { data } = await apiClient.get("/pois");
    return data;
  },

  getNearby: async (lat: number, lng: number, radius: number = 5): Promise<POI[]> => {
    const { data } = await apiClient.get(`/pois/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
    return data;
  },

  getBySlug: async (slug: string, lang: string = "vi"): Promise<POI> => {
    const { data } = await apiClient.get(`/pois/slug/${slug}?lang=${lang}`);
    return data;
  },

  search: async (params: SearchPOIParams): Promise<POI[]> => {
    const query = new URLSearchParams();
    if (params.query) query.append("q", params.query);
    if (params.categoryId) query.append("category", params.categoryId.toString());
    if (params.latitude) query.append("lat", params.latitude.toString());
    if (params.longitude) query.append("lng", params.longitude.toString());
    if (params.radiusKm) query.append("radius", params.radiusKm.toString());

    const { data } = await apiClient.get(`/pois?${query.toString()}`);
    return data;
  },
  
  getMenu: async (id: number, lang: string = "vi") => {
    const { data } = await apiClient.get(`/pois/${id}/menu?lang=${lang}`);
    return data;
  },

  generateAudio: async (text: string, lang: string, poiId: number): Promise<{ url: string }> => {
    const { data } = await apiClient.get(`/audio/generate?text=${encodeURIComponent(text)}&lang=${lang}&poiId=${poiId}`);
    return data;
  }
};

