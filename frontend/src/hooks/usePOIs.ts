import { useState, useCallback } from 'react';
import { poisApi } from '@/api/pois';
import type { POI, POIListItem } from '@/types/poi';
import { useLanguage } from '@/contexts/LanguageContext';

export function usePOIs() {
  const { language } = useLanguage();
  const [pois, setPois] = useState<POIListItem[]>([]);
  const [nearbyPOIs, setNearbyPOIs] = useState<POIListItem[]>([]);
  const [poi, setPoi] = useState<POI | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPOIs = useCallback(
    async (params?: { category?: string; q?: string }, silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const { data } = await poisApi.getAll({
          ...params,
          lang: language,
        });
        setPois(data);
      } catch (err: any) {
        setError(err);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [language]
  );

  const fetchNearbyPOIs = useCallback(
    async (lat: number, lng: number, radius = 500) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await poisApi.getNearby(lat, lng, radius, language);
        setNearbyPOIs(data);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [language]
  );

  const fetchPOIById = useCallback(
    async (id: number) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await poisApi.getById(id, language);
        setPoi(data);
        return data;
      } catch (err: any) {
        setError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [language]
  );

  const fetchPOIBySlug = useCallback(
    async (slug: string) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await poisApi.getBySlug(slug, language);
        setPoi(data);
        return data;
      } catch (err: any) {
        setError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [language]
  );

  return {
    pois,
    nearbyPOIs,
    poi,
    loading,
    error,
    fetchPOIs,
    fetchNearbyPOIs,
    fetchPOIById,
    fetchPOIBySlug,
    setPoi,
  };
}

export default usePOIs;
