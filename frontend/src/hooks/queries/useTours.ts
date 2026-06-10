import { useQuery } from "@tanstack/react-query";
import { tourApi } from "@/api/tour.api";

export const useTours = () => {
  return useQuery({
    queryKey: ["tours"],
    queryFn: () => tourApi.getAll(),
  });
};

export const useTourById = (id: number) => {
  return useQuery({
    queryKey: ["tour", id],
    queryFn: () => tourApi.getById(id),
    enabled: !!id,
  });
};

