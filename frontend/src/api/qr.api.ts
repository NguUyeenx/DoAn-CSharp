import { apiClient } from "@/lib/axios";
import type { POI } from "@/types/poi";

export const qrApi = {
  scanQR: async (code: string): Promise<POI> => {
    const { data } = await apiClient.get(`/qr/${code}`);
    return data;
  }
};

