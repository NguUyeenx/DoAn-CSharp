import type { POIListItem } from '@/types/poi';
import { Star, Heart, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistance } from '@/utils/format';

interface POICardProps {
  poi: POIListItem;
  onClick?: () => void;
  onToggleFavorite?: (id: number, isFavorite: boolean) => void;
}

export default function POICard({ poi, onClick, onToggleFavorite }: POICardProps) {
  const { t } = useTranslation();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(poi.id, !poi.isFavorite);
    }
  };

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
    <div
      onClick={onClick}
      className={`
        group flex flex-col sm:flex-row gap-4 p-3 bg-card border border-border rounded-[var(--radius-lg)] shadow-sm
        hover:shadow-md hover:border-border-hover hover:-translate-y-0.5
        transition-all duration-300 ease-[var(--ease-out-quart)] cursor-pointer select-none
      `}
    >
      {/* Cover image container — full-width on mobile, fixed side column on sm+ */}
      <div className="relative w-full h-36 sm:w-28 sm:h-28 shrink-0 rounded-[var(--radius-md)] overflow-hidden bg-surface-alt">
        {poi.imageUrl ? (
          <img
            src={poi.imageUrl}
            alt={poi.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
            <span className="text-3xl" role="img" aria-hidden="true">
              {getCategoryEmoji(poi.category)}
            </span>
          </div>
        )}

        {/* Floating Category tag overlaid on image */}
        <div className="absolute top-2 left-2 bg-card/90 backdrop-blur-xs px-2 py-0.5 rounded-[var(--radius-sm)] border border-border/80 text-xs font-semibold flex items-center gap-1 shadow-sm">
          <span>{getCategoryEmoji(poi.category)}</span>
          <span className="text-text-secondary capitalize">{poi.category}</span>
        </div>
      </div>

      {/* Main card details */}
      <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
        <div className="flex flex-col gap-1">
          {/* Header Row: Title & Favorite Button */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-bold text-base tracking-tight leading-snug text-text-primary group-hover:text-primary transition-colors line-clamp-1">
              {poi.name}
            </h3>

            {/* Favorite Toggle Button */}
            <button
              type="button"
              onClick={handleFavoriteClick}
              className={`
                p-1.5 rounded-full border border-border hover:border-border-hover bg-card hover:bg-surface-alt transition-all cursor-pointer outline-none active:scale-90
                ${poi.isFavorite ? 'text-danger border-danger-light bg-danger/5 hover:bg-danger/10' : 'text-text-muted hover:text-text-primary'}
              `}
              aria-label={poi.isFavorite ? t('poi.removeFavorite', 'Remove from favorites') : t('poi.addFavorite', 'Add to favorites')}
            >
              <Heart
                size={15}
                className={poi.isFavorite ? 'fill-current animate-scale-in' : ''}
              />
            </button>
          </div>

          {/* Rating, Reviews & Category (Desktop) */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Category tag on desktop */}
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-surface-alt text-text-secondary font-semibold rounded-[var(--radius-sm)] border border-border capitalize">
              <span>{getCategoryEmoji(poi.category)}</span>
              <span>{poi.category}</span>
            </span>

            {/* Rating Stars */}
            <div className="flex items-center gap-0.5 text-primary">
              <Star size={12} className="fill-current" />
              <span className="font-bold text-text-primary">
                {poi.rating > 0 ? poi.rating.toFixed(1) : t('poi.noRating', 'New')}
              </span>
            </div>
            {poi.reviewCount > 0 && (
              <span className="text-text-muted">
                {poi.reviewCount} {t('poi.reviews', 'reviews')}
              </span>
            )}

            {/* Price Badge */}
            {poi.priceRange && (
              <span className="inline-flex items-center px-1.5 py-0.5 bg-primary/10 text-primary font-bold rounded-[var(--radius-sm)] text-[10px] border border-primary/20">
                {poi.priceRange === '1' && t('filter.priceBudget', 'Bình dân')}
                {poi.priceRange === '2' && t('filter.priceMidrange', 'Trung bình')}
                {poi.priceRange === '3' && t('filter.priceUpscale', 'Khá')}
              </span>
            )}
          </div>

          {/* Description summary */}
          <p className="text-xs sm:text-sm text-text-secondary line-clamp-2 leading-relaxed mt-0.5">
            {poi.shortDescription}
          </p>
        </div>

        {/* Footer info: Distance & Approval status if present */}
        <div className="flex items-center justify-between gap-4 border-t border-border/40 mt-3 pt-2 text-xs">
          {/* Distance */}
          {poi.distanceMeters !== undefined && poi.distanceMeters !== null && (
            <div className="flex items-center gap-1 text-text-secondary font-medium">
              <MapPin size={13} className="text-primary" />
              <span>{formatDistance(poi.distanceMeters)}</span>
            </div>
          )}

          {/* Status Badge (for owner dashboard / review states if needed) */}
          {poi.approvalStatus && poi.approvalStatus !== 'approved' && (
            <span
              className={`
                px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider
                ${
                  poi.approvalStatus === 'pending'
                    ? 'bg-secondary/10 border-secondary text-secondary-light'
                    : 'bg-danger/10 border-danger text-danger-light'
                }
              `}
            >
              {poi.approvalStatus}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
