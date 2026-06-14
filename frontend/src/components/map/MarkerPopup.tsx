import type { POIListItem, POI } from '@/types/poi';
import { Star, Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MarkerPopupProps {
  poi: POIListItem | POI;
  onDetailClick: (poi: POIListItem | POI) => void;
}

export default function MarkerPopup({ poi, onDetailClick }: MarkerPopupProps) {
  const { t } = useTranslation();

  // Emojis mapping for categories
  const getCategoryEmoji = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('ốc') || cat.includes('snail')) return '🐚';
    if (cat.includes('lẩu') || cat.includes('hotpot')) return '🍲';
    if (cat.includes('nướng') || cat.includes('bbq') || cat.includes('grill')) return '🍢';
    if (cat.includes('ăn vặt') || cat.includes('snack')) return '🍡';
    if (cat.includes('bánh mì')) return '🥖';
    if (cat.includes('nước') || cat.includes('uống') || cat.includes('drink') || cat.includes('beer')) return '🥤';
    return '🍴';
  };

  return (
    <div className="w-full flex flex-col overflow-hidden text-text-primary bg-card">
      {/* Cover Image */}
      <div className="relative w-full h-32 bg-surface-alt">
        {poi.imageUrl ? (
          <img
            src={poi.imageUrl}
            alt={poi.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
            <span className="text-3xl" role="img" aria-hidden="true">
              {getCategoryEmoji(poi.category)}
            </span>
          </div>
        )}
        {/* Category Badge */}
        <div className="absolute top-2 left-2 bg-card/90 backdrop-blur-xs px-2 py-0.5 rounded-[var(--radius-sm)] border border-border/80 text-xs font-semibold flex items-center gap-1 shadow-sm">
          <span>{getCategoryEmoji(poi.category)}</span>
          <span className="text-text-secondary capitalize">{poi.category}</span>
        </div>
      </div>

      {/* Information Container */}
      <div className="p-3 flex flex-col gap-2">
        <h3 className="font-display font-bold text-sm tracking-tight line-clamp-1 leading-snug">
          {poi.name}
        </h3>

        {/* Rating and Reviews */}
        <div className="flex items-center gap-1 text-xs">
          <div className="flex items-center gap-0.5 text-primary">
            <Star size={12} className="fill-current" />
            <span className="font-bold text-text-primary">
              {poi.rating > 0 ? poi.rating.toFixed(1) : t('poi.noRating', 'New')}
            </span>
          </div>
          {poi.reviewCount > 0 && (
            <span className="text-text-muted">
              ({poi.reviewCount} {t('poi.reviews', 'reviews')})
            </span>
          )}
        </div>

        {/* Short Description */}
        {'shortDescription' in poi && poi.shortDescription && (
          <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
            {poi.shortDescription}
          </p>
        )}

        {/* View Details Button */}
        <button
          type="button"
          onClick={() => onDetailClick(poi)}
          className="mt-1 w-full h-8 rounded-[var(--radius-md)] bg-primary text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-primary-hover active:scale-[0.98] transition-all cursor-pointer shadow-sm outline-none"
        >
          <Compass size={13} />
          <span>{t('poi.viewDetails', 'Xem chi tiết')}</span>
        </button>
      </div>
    </div>
  );
}
