import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

type BadgeVariant = 'category' | 'price' | 'status';
type StatusColor = 'active' | 'inactive' | 'pending';

interface BadgeProps {
  variant?: BadgeVariant;
  /** Custom color (hex) for the category dot */
  color?: string;
  /** Status sub-variant, only applies when variant='status' */
  status?: StatusColor;
  children: ReactNode;
  className?: string;
}

const statusStyles: Record<StatusColor, string> = {
  active: 'bg-accent/15 text-accent',
  inactive: 'bg-text-muted/15 text-text-muted',
  pending: 'bg-secondary text-text-primary',
};

export default function Badge({
  variant = 'category',
  color,
  status = 'active',
  children,
  className,
}: BadgeProps) {
  if (variant === 'status') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5',
          'text-xs font-medium',
          statusStyles[status],
          className,
        )}
      >
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            status === 'active' && 'bg-accent',
            status === 'inactive' && 'bg-text-muted',
            status === 'pending' && 'bg-secondary',
          )}
          aria-hidden="true"
        />
        {children}
      </span>
    );
  }

  if (variant === 'price') {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5',
          'bg-primary/10 text-primary text-xs font-semibold tabular-nums',
          className,
        )}
      >
        {children}
      </span>
    );
  }

  // category (default)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5',
        'bg-surface-alt text-text-secondary text-xs font-medium',
        'dark:bg-card',
        className,
      )}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color ?? 'var(--color-primary)' }}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}
