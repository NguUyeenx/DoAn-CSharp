import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';
import { api } from '@/api/client';
import { Heart, MapPin, ArrowUpDown, ChevronDown } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  nameEn: string;
}

interface FilterPanelProps {
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  selectedPrice?: string | null;
  onPriceChange?: (price: string | null) => void;
  sortBy?: string;
  onSortByChange?: (sortBy: string) => void;
  showFavoritesOnly?: boolean;
  onShowFavoritesOnlyChange?: (show: boolean) => void;
  showNearbyOnly?: boolean;
  onShowNearbyOnlyChange?: (show: boolean) => void;
  className?: string;
}

// Fallback Vietnamese food categories
const FALLBACK_CATEGORIES: Category[] = [
  { id: 'all', name: 'Tất cả', nameEn: 'All' },
  { id: 'oc', name: 'Ốc', nameEn: 'Snails (Ốc)' },
  { id: 'lau', name: 'Lẩu', nameEn: 'Hotpot (Lẩu)' },
  { id: 'do-nuong', name: 'Đồ nướng', nameEn: 'BBQ & Grill' },
  { id: 'an-vat', name: 'Ăn vặt', nameEn: 'Street Snacks' },
  { id: 'banh-xeo', name: 'Bánh xèo', nameEn: 'Crepes (Bánh xèo)' },
  { id: 'bun-bo', name: 'Bún bò', nameEn: 'Beef Noodles' },
];

export default function FilterPanel({
  selectedCategory,
  onCategoryChange,
  selectedPrice = 'all',
  onPriceChange,
  sortBy = 'default',
  onSortByChange,
  showFavoritesOnly = false,
  onShowFavoritesOnlyChange,
  showNearbyOnly = false,
  onShowNearbyOnlyChange,
  className,
}: FilterPanelProps) {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const currentLang = i18n.language || 'en';

  useEffect(() => {
    // Attempt to fetch categories dynamically from backend, fallback to static list if fails
    api.get<Category[]>('/categories')
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          // Prepend "All" option to dynamic categories
          const allOption: Category = { id: 'all', name: 'Tất cả', nameEn: 'All' };
          setCategories([allOption, ...res.data]);
        }
      })
      .catch(() => {
        // Fallback silently if API has gap
        setCategories(FALLBACK_CATEGORIES);
      });
  }, []);

  return (
    <div className={cn('w-full py-2 bg-card', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Dropdowns Group (Category, Sort, Price) */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 min-w-0 flex-1">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-text-muted text-xs font-semibold font-display">Danh mục:</span>
            <div className="relative flex items-center">
              <select
                value={selectedCategory || 'all'}
                onChange={(e) => onCategoryChange(e.target.value === 'all' ? null : e.target.value)}
                className="appearance-none bg-transparent font-bold text-xs text-primary cursor-pointer outline-none border-none py-1 pr-4 font-display"
              >
                {categories.map((category) => {
                  const label = currentLang === 'vi' ? category.name : category.nameEn;
                  return (
                    <option key={category.id} value={category.id}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <ChevronDown size={10} className="absolute right-0 text-primary pointer-events-none" />
            </div>
          </div>

          {/* Divider */}
          <span className="h-3 w-[1px] bg-border/60 shrink-0 hidden sm:inline-block" />

          {/* Sort dropdown */}
          <div className="flex items-center gap-1.5 shrink-0">
            <ArrowUpDown size={13} className="text-text-muted shrink-0" />
            <div className="relative flex items-center">
              <select
                value={sortBy}
                onChange={(e) => onSortByChange?.(e.target.value)}
                className="appearance-none bg-transparent font-semibold text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer outline-none border-none py-1 pr-4 font-display"
              >
                <option value="default">{t('filter.sortDefault', 'Mặc định')}</option>
                <option value="rating">{t('filter.sortRating', 'Đánh giá tốt')}</option>
                <option value="distance">{t('filter.sortDistance', 'Gần đây nhất')}</option>
              </select>
              <ChevronDown size={10} className="absolute right-0 text-text-muted pointer-events-none" />
            </div>
          </div>

          {/* Divider */}
          <span className="h-3 w-[1px] bg-border/60 shrink-0 hidden sm:inline-block" />

          {/* Price dropdown */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-text-muted text-xs font-semibold font-display">Giá:</span>
            <div className="relative flex items-center">
              <select
                value={selectedPrice || 'all'}
                onChange={(e) => onPriceChange?.(e.target.value === 'all' ? null : e.target.value)}
                className="appearance-none bg-transparent font-bold text-xs text-primary cursor-pointer outline-none border-none py-1 pr-4 font-mono"
              >
                <option value="all">{t('filter.priceAll', 'Tất cả')}</option>
                <option value="1">$</option>
                <option value="2">$$</option>
                <option value="3">$$$</option>
              </select>
              <ChevronDown size={10} className="absolute right-0 text-primary pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Favorites and Distance Toggles */}
        <div className="flex items-center gap-1.5 shrink-0 border-l border-border/50 pl-2.5">
          {/* Favorites filter toggle */}
          <button
            type="button"
            onClick={() => onShowFavoritesOnlyChange?.(!showFavoritesOnly)}
            className={cn(
              'p-1.5 rounded-lg border transition-all duration-200 outline-none cursor-pointer',
              showFavoritesOnly
                ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                : 'border-border bg-card text-text-secondary hover:text-text-primary hover:border-border-hover'
            )}
            title={t('filter.favorites', 'Danh sách yêu thích')}
          >
            <Heart size={13} className={cn(showFavoritesOnly && 'fill-current')} />
          </button>

          {/* Distance filter (<1km) toggle */}
          <button
            type="button"
            onClick={() => onShowNearbyOnlyChange?.(!showNearbyOnly)}
            className={cn(
              'p-1.5 rounded-lg border transition-all duration-200 outline-none cursor-pointer',
              showNearbyOnly
                ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                : 'border-border bg-card text-text-secondary hover:text-text-primary hover:border-border-hover'
            )}
            title={t('filter.nearby', 'Khoảng cách gần (<1km)')}
          >
            <MapPin size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
