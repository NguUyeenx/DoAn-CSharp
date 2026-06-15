import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import ThemeToggle from '@/components/ui/ThemeToggle';
import SearchBar from '@/components/search/SearchBar';
import { cn } from '@/utils/cn';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  showSearch?: boolean;
}

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
];

export default function Header({
  searchQuery,
  onSearchChange,
  showSearch = true,
}: HeaderProps) {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, role, setLoginModalOpen } = useAuth();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setLangMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-surface/85 backdrop-blur-md border-b border-border/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Branding - Logo + Title */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-[10px] bg-primary flex items-center justify-center text-white transition-transform group-hover:scale-105 shadow-md">
            {/* Custom street food bowl SVG logo */}
            <svg
              xmlns="http://www.w3.org/2005/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <path d="M12 2v3M9 3v2M15 3v2" />
              <path d="M3 12h18M3 12a9 9 0 0 0 18 0" />
              <path d="M18 12V8a3 3 0 0 0-3-3H9a3 3 0 0 0-3 3v4" />
            </svg>
          </div>
          <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight text-text-primary group-hover:text-primary transition-colors">
            VK <span className="font-medium text-text-secondary">Food Explorer</span>
          </span>
        </Link>

        {/* Search Bar - Desktop Only */}
        {showSearch && onSearchChange !== undefined && searchQuery !== undefined ? (
          <div className="hidden md:flex flex-1 justify-center max-w-lg xl:max-w-xl">
            <SearchBar
              query={searchQuery}
              onChange={onSearchChange}
              placeholder={t('header.searchPlaceholder', 'Find food or locations...')}
            />
          </div>
        ) : (
          <div className="hidden md:block flex-1" />
        )}

        {/* Utilities: Theme + Language Selection */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Custom Language Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setLangMenuOpen((prev) => !prev)}
              className={cn(
                'flex items-center gap-1.5 h-9 px-3 rounded-[var(--radius-md)] text-sm font-medium border border-border cursor-pointer',
                'bg-card text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors select-none outline-none',
                langMenuOpen && 'border-primary text-text-primary ring-2 ring-primary/10'
              )}
              aria-label={t('header.selectLanguage', 'Select Language')}
              aria-expanded={langMenuOpen}
            >
              <span className="text-base" role="img" aria-hidden="true">
                {currentLang.flag}
              </span>
              <span className="hidden sm:inline">{currentLang.label}</span>
              <ChevronDown
                size={14}
                className={cn(
                  'transition-transform duration-200 text-text-muted group-hover:text-text-secondary',
                  langMenuOpen && 'rotate-180 text-primary'
                )}
              />
            </button>

            {/* Language Menu Dropdown List */}
            {langMenuOpen && (
              <div
                className={cn(
                  'absolute right-0 mt-1.5 w-40 rounded-[var(--radius-md)] border border-border bg-card shadow-lg py-1 z-50',
                  'animate-slide-in-top origin-top-right'
                )}
              >
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => selectLanguage(lang.code)}
                    className={cn(
                      'flex items-center gap-2.5 w-full text-left px-3 py-2 text-sm font-medium cursor-pointer',
                      'text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-colors outline-none',
                      lang.code === i18n.language && 'text-primary bg-primary/5 font-semibold'
                    )}
                  >
                    <span className="text-base" role="img" aria-hidden="true">
                      {lang.flag}
                    </span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Login/Register or Dashboard Button */}
          {isAuthenticated ? (
            <Link
              to={role === 'admin' ? '/admin' : '/owner'}
              className="hidden md:flex items-center justify-center h-9 px-4 rounded-[var(--radius-md)] text-sm font-semibold border border-primary text-primary hover:bg-primary/5 transition-colors outline-none cursor-pointer"
            >
              {role === 'admin'
                ? t('nav.adminDashboard', 'Bảng quản trị')
                : t('nav.ownerDashboard', 'Kênh đối tác')}
            </Link>
          ) : (
            <button
              onClick={() => setLoginModalOpen(true)}
              className="hidden md:flex items-center justify-center h-9 px-4 rounded-[var(--radius-md)] text-sm font-semibold text-white bg-primary hover:bg-primary-hover shadow-sm transition-colors outline-none cursor-pointer"
            >
              {t('nav.loginRegister', 'Đăng nhập / Đăng ký')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
