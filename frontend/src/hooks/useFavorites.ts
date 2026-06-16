import { useState, useEffect } from 'react';

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('vk_favorites');
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (e) {
        setFavorites([]);
      }
    }
  }, []);

  const toggleFavorite = (poiId: number) => {
    setFavorites((prev) => {
      const isFav = prev.includes(poiId);
      const newFavs = isFav ? prev.filter((id) => id !== poiId) : [...prev, poiId];
      localStorage.setItem('vk_favorites', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  const isFavorite = (poiId: number) => favorites.includes(poiId);

  return { favorites, toggleFavorite, isFavorite };
}
