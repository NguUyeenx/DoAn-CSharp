import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toast: (options: Omit<Toast, 'id'>) => string;
  success: (message: string, title?: string, duration?: number) => string;
  error: (message: string, title?: string, duration?: number) => string;
  info: (message: string, title?: string, duration?: number) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

const ICON_MAP = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const VARIANT_BORDER_STYLES = {
  success: 'border-accent/20 dark:border-accent/30',
  error: 'border-danger/20 dark:border-danger/30',
  info: 'border-border',
};

const VARIANT_ICON_STYLES = {
  success: 'text-accent',
  error: 'text-danger',
  info: 'text-primary',
};

function ToastItem({ toast, onClose }: ToastItemProps) {
  const { title, message, variant = 'info', duration = 4000 } = toast;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const Icon = ICON_MAP[variant];
  const borderStyle = VARIANT_BORDER_STYLES[variant];
  const iconStyle = VARIANT_ICON_STYLES[variant];

  return (
    <div
      role="alert"
      className={cn(
        'pointer-events-auto relative flex w-full gap-3 rounded-[16px] border bg-card p-4 shadow-lg transition-all duration-300',
        'animate-slide-in-top md:animate-slide-in-right',
        borderStyle
      )}
    >
      <div className={cn('mt-0.5 shrink-0', iconStyle)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 pr-4">
        {title && (
          <h4 className="font-display text-sm font-semibold text-text-primary leading-tight mb-0.5">
            {title}
          </h4>
        )}
        <p className="text-sm text-text-secondary leading-relaxed">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-text-muted hover:text-text-primary transition-colors rounded-full p-1 hover:bg-surface-alt focus-visible:ring-2 focus-visible:outline-none"
        aria-label="Close toast"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-alt rounded-b-[16px] overflow-hidden">
        <div
          className={cn(
            'h-full origin-left animate-progress',
            variant === 'success' && 'bg-accent',
            variant === 'error' && 'bg-danger',
            variant === 'info' && 'bg-primary'
          )}
          style={{
            animationDuration: `${duration}ms`,
          }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((options: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...options, id }]);
    return id;
  }, []);

  const success = useCallback((message: string, title?: string, duration?: number) => {
    return toast({ message, title, duration, variant: 'success' });
  }, [toast]);

  const error = useCallback((message: string, title?: string, duration?: number) => {
    return toast({ message, title, duration, variant: 'error' });
  }, [toast]);

  const info = useCallback((message: string, title?: string, duration?: number) => {
    return toast({ message, title, duration, variant: 'info' });
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, dismiss }}>
      {children}
      <div
        className="fixed top-4 left-4 right-4 md:left-auto md:right-4 z-50 flex flex-col gap-3 pointer-events-none max-w-sm md:w-96"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
