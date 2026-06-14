import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/cn';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t(
        isDark ? 'theme.switchToLight' : 'theme.switchToDark',
        isDark ? 'Switch to light mode' : 'Switch to dark mode',
      )}
      className={cn(
        'relative inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)]',
        'bg-surface-alt text-text-secondary',
        'hover:bg-border hover:text-text-primary',
        'transition-colors duration-150 ease-[var(--ease-out-quart)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        className,
      )}
    >
      <Sun
        size={18}
        className={cn(
          'absolute transition-all duration-300 ease-[var(--ease-out-quart)]',
          isDark
            ? 'rotate-90 scale-0 opacity-0'
            : 'rotate-0 scale-100 opacity-100',
        )}
        aria-hidden="true"
      />
      <Moon
        size={18}
        className={cn(
          'absolute transition-all duration-300 ease-[var(--ease-out-quart)]',
          isDark
            ? 'rotate-0 scale-100 opacity-100'
            : '-rotate-90 scale-0 opacity-0',
        )}
        aria-hidden="true"
      />
    </button>
  );
}
