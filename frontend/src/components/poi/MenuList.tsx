import type { MenuItem } from '@/types/poi';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';

interface MenuListProps {
  items: MenuItem[];
}

export default function MenuList({ items }: MenuListProps) {
  const { t, i18n } = useTranslation();

  // Sort menu items by display order
  const sortedItems = [...items].sort((a, b) => a.displayOrder - b.displayOrder);

  // Helper to resolve localized name and description
  const getItemName = (item: MenuItem) => {
    return i18n.language === 'vi' ? item.localizedName || item.name : item.name || item.localizedName;
  };

  const getItemDesc = (item: MenuItem) => {
    return i18n.language === 'vi' ? item.localizedDescription : '';
  };

  if (sortedItems.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-text-muted bg-surface-alt rounded-[var(--radius-md)] border border-dashed border-border">
        {t('menu.noItems', 'No menu items available')}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h4 className="font-display font-bold text-sm tracking-tight text-text-primary uppercase border-b border-border/40 pb-1.5 mb-1">
        {t('menu.title', 'Menu Đặc Sản')}
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sortedItems.map((item) => {
          const name = getItemName(item);
          const desc = getItemDesc(item);
          const isAvailable = item.isAvailable;

          return (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-3 p-2 rounded-[var(--radius-md)] border border-border bg-card shadow-xs transition-colors',
                !isAvailable && 'opacity-65 bg-surface-alt/50 border-border/50'
              )}
            >
              {/* Food Image */}
              <div className="relative w-16 h-16 rounded-[var(--radius-sm)] overflow-hidden bg-surface-alt shrink-0">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary text-xl">
                    🍲
                  </div>
                )}
                
                {/* Out of Stock overlay overlay */}
                {!isAvailable && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white uppercase tracking-wider bg-danger px-1 py-0.5 rounded-[var(--radius-sm)]">
                      {t('menu.soldOut', 'Hết')}
                    </span>
                  </div>
                )}
              </div>

              {/* Food Details */}
              <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                <div>
                  <h5 className="font-display font-semibold text-sm text-text-primary line-clamp-1 leading-snug">
                    {name}
                  </h5>
                  {desc && (
                    <p className="text-[11px] text-text-secondary line-clamp-1 leading-relaxed mt-0.5">
                      {desc}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <span className="font-display font-bold text-sm text-primary">
                    {formatPrice(item.price, item.currency)}
                  </span>
                  
                  {!isAvailable && (
                    <span className="text-[10px] text-text-muted font-semibold bg-surface px-1.5 py-0.5 rounded-[var(--radius-sm)]">
                      {t('menu.unavailable', 'Hết món')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
