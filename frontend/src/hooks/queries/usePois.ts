import { useQuery } from "@tanstack/react-query";
import { poiApi } from "@/api/poi.api";
import type { SearchPOIParams } from "@/types/poi";

export const usePOIs = () => {
  return useQuery({
    queryKey: ["pois"],
    queryFn: () => poiApi.getAll(),
  });
};

export const useNearbyPOIs = (lat: number, lng: number, radius: number = 5, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["pois", "nearby", lat, lng, radius],
    queryFn: () => poiApi.getNearby(lat, lng, radius),
    enabled: enabled && !!lat && !!lng,
  });
};

export const usePOIBySlug = (slug: string, lang: string = "vi") => {
  return useQuery({
    queryKey: ["poi", slug, lang],
    queryFn: () => poiApi.getBySlug(slug, lang),
    enabled: !!slug,
  });
};

export const useSearchPOIs = (params: SearchPOIParams) => {
  return useQuery({
    queryKey: ["pois", "search", params],
    queryFn: () => poiApi.search(params),
  });
};

export const usePOIMenu = (id: number, lang: string = "vi") => {
  return useQuery({
    queryKey: ["poi", id, "menu", lang],
    queryFn: () => poiApi.getMenu(id, lang),
    enabled: !!id,
  });
};

