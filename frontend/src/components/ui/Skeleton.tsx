import { cn } from '@/utils/cn';

type SkeletonVariant = 'text' | 'card' | 'image' | 'circle';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
}

const variantDefaults: Record<SkeletonVariant, { w: string; h: string; rounded: string }> = {
  text: { w: '100%', h: '1em', rounded: 'rounded-md' },
  card: { w: '100%', h: '200px', rounded: 'rounded-[var(--radius-md)]' },
  image: { w: '100%', h: '160px', rounded: 'rounded-[var(--radius-lg)]' },
  circle: { w: '48px', h: '48px', rounded: 'rounded-full' },
};

export default function Skeleton({
  variant = 'text',
  width,
  height,
  className,
}: SkeletonProps) {
  const defaults = variantDefaults[variant];

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'animate-shimmer bg-surface-alt',
        defaults.rounded,
        className,
      )}
      style={{
        width: width ?? defaults.w,
        height: height ?? defaults.h,
        backgroundImage:
          'linear-gradient(90deg, transparent 0%, var(--color-border) 50%, transparent 100%)',
        backgroundSize: '400px 100%',
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}

/**
 * Pre-composed skeleton matching the POICard layout:
 * horizontal card with image left, content right.
 */
export function POICardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex gap-3 rounded-[var(--radius-md)] bg-card p-3',
        className,
      )}
      role="status"
      aria-label="Loading POI"
    >
      {/* Image */}
      <Skeleton variant="image" width={100} height={100} className="shrink-0" />

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-2 py-1">
        <Skeleton variant="text" width="70%" height={18} />
        <Skeleton variant="text" width="40%" height={14} />
        <Skeleton variant="text" width="100%" height={14} />
        <Skeleton variant="text" width="60%" height={14} />
      </div>
    </div>
  );
}
