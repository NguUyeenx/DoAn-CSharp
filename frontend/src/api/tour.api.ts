import { apiClient } from "@/lib/axios";

export interface TourStop {
  id: number;
  poiId: number;
  orderIndex: number;
  timeAtStopMinutes: number;
  distanceFromPrevious: number;
  poi?: any;
}

export interface Tour {
  id: number;
  title: string;
  description: string;
  estimatedDurationMinutes: number;
  totalDistanceKm: number;
  tourStops?: TourStop[];
}

export const tourApi = {
  getAll: async (): Promise<Tour[]> => {
    const { data } = await apiClient.get("/tours");
    return data;
  },
  
  getById: async (id: number): Promise<Tour> => {
    const { data } = await apiClient.get(`/tours/${id}`);
    return data;
  }
};

