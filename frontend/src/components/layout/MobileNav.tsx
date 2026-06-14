import { Link, useLocation } from 'react-router-dom';
import { Map, List, Compass, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

export default function MobileNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const path = location.pathname;

  // Determine active tab index
  let activeIndex = 0;
  if (path.startsWith('/pois') || path.startsWith('/list')) {
    activeIndex = 1;
  } else if (path.startsWith('/tours')) {
    activeIndex = 2;
  } else if (
    path.startsWith('/owner') ||
    path.startsWith('/admin') ||
    path.startsWith('/login')
  ) {
    activeIndex = 3;
  }

  const navItems = [
    {
      label: t('nav.map', 'Map'),
      to: '/',
      icon: Map,
    },
    {
      label: t('nav.list', 'List'),
      to: '/pois',
      icon: List,
    },
    {
      label: t('nav.tours', 'Tours'),
      to: '/tours',
      icon: Compass,
    },
    {
      label: t('nav.owner', 'Owner'),
      to: '/owner',
      icon: User,
    },
  ];

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[45] md:hidden',
        'bg-surface/90 backdrop-blur-lg border-t border-border/80 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]',
        'pb-[max(env(safe-area-inset-bottom),12px)] pt-2'
      )}
    >
      <div className="relative max-w-md mx-auto px-4 flex justify-between items-center">
        {/* Sliding indicator line at the top of the nav */}
        <div
          className="absolute top-0 left-4 right-4 h-[3px] pointer-events-none"
          style={{ width: 'calc(100% - 32px)' }}
        >
          <div
            className="h-full bg-primary rounded-full transition-all duration-300 ease-[var(--ease-out-quart)]"
            style={{
              width: '25%',
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />
        </div>

        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeIndex === index;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center justify-center w-20 py-1 gap-1 text-center select-none cursor-pointer',
                'transition-all duration-200 ease-[var(--ease-out-quart)] outline-none',
                isActive
                  ? 'text-primary scale-105 font-semibold font-display'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              <Icon
                size={20}
                className={cn(
                  'transition-transform duration-200',
                  isActive && 'stroke-[2.5px]'
                )}
              />
              <span className="text-[10px] tracking-wide uppercase font-medium leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
