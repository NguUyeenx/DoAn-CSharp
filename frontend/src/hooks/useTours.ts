import { useState, useCallback } from 'react';
import { toursApi } from '@/api/tours';
import type { Tour, TourListItem } from '@/types/api';
import { useLanguage } from '@/contexts/LanguageContext';

export function useTours() {
  const { language } = useLanguage();
  const [tours, setTours] = useState<TourListItem[]>([]);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTours = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await toursApi.getAll(language);
      setTours(data);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [language]);

  const fetchTourById = useCallback(
    async (id: number) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await toursApi.getById(id, language);
        setSelectedTour(data);
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
    tours,
    selectedTour,
    loading,
    error,
    fetchTours,
    fetchTourById,
    setSelectedTour,
  };
}

export default useTours;
