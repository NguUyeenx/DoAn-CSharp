import { useEffect, useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';
import { DEBOUNCE_MS } from '@/utils/constants';

interface SearchBarProps {
  query: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  query,
  onChange,
  placeholder,
  className,
}: SearchBarProps) {
  const { t } = useTranslation();
  const [localValue, setLocalValue] = useState(query);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstMount = useRef(true);

  // Sync internal state with external query updates
  useEffect(() => {
    setLocalValue(query);
  }, [query]);

  // Debounced update to the parent component
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      onChange(localValue);
    }, DEBOUNCE_MS || 300);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [localValue, onChange]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div
      className={cn(
        'relative flex items-center w-full max-w-xl transition-all duration-300 ease-[var(--ease-out-quart)]',
        'group focus-within:scale-[1.02]',
        className
      )}
    >
      <div className="absolute left-3.5 text-text-muted group-focus-within:text-primary transition-colors pointer-events-none">
        <Search size={18} />
      </div>

      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder || t('search.placeholder', 'Search street food...')}
        className={cn(
          'w-full h-11 pl-11 pr-10 rounded-full font-body text-base',
          'bg-surface-alt border border-border text-text-primary placeholder:text-text-muted',
          'hover:border-border-hover focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10',
          'transition-all duration-200 ease-[var(--ease-out-quart)] shadow-sm'
        )}
      />

      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className={cn(
            'absolute right-3.5 flex items-center justify-center h-6 w-6 rounded-full',
            'text-text-muted hover:text-text-primary hover:bg-surface',
            'transition-colors duration-150 ease-[var(--ease-out-quart)]'
          )}
          aria-label={t('search.clear', 'Clear search')}
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
