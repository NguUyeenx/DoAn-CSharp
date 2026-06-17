import { useVisitor } from '@/contexts/VisitorContext';

export function useFavorites() {
  const { bookmarks, toggleBookmark } = useVisitor();

  const toggleFavorite = (poiId: number) => {
    toggleBookmark(poiId);
  };

  const isFavorite = (poiId: number) => bookmarks.includes(poiId);

  return { favorites: bookmarks, toggleFavorite, isFavorite };
}
