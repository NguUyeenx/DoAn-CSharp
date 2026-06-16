import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOutsideClick?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-[calc(100vw-2rem)] md:max-w-5xl h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)]',
};

let openModalsCount = 0;

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  size = 'md',
  closeOnOutsideClick = true,
}: ModalProps) {
  const previousActiveElement = React.useRef<HTMLElement | null>(null);
  const onCloseRef = React.useRef(onClose);

  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    if (document.activeElement instanceof HTMLElement) {
      previousActiveElement.current = document.activeElement;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    openModalsCount++;
    if (openModalsCount === 1) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      
      openModalsCount--;
      if (openModalsCount === 0) {
        document.body.style.overflow = '';
      }

      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-fade-in cursor-pointer"
        onClick={closeOnOutsideClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Dialog Content Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={cn(
          'relative w-full bg-card rounded-[16px] border border-border shadow-xl p-6 animate-scale-in focus:outline-none z-10 flex flex-col max-h-full',
          sizeClasses[size],
          className
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors rounded-full p-1.5 hover:bg-surface-alt focus-visible:ring-2 focus-visible:outline-none"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        {title && (
          <h3
            id="modal-title"
            className="font-display text-lg font-semibold text-text-primary mb-4 leading-tight"
          >
            {title}
          </h3>
        )}

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}
