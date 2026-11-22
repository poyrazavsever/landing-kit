import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn('animate-pulse rounded-lg bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
