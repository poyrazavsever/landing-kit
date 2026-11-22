import { cn } from '@/lib/utils';

function Card({ className, ...props }) {
  return (
    <div
      data-slot="card"
      className={cn(
        'rounded-xl border bg-card text-card-foreground',
        'shadow-[0_1px_2px_rgba(14,21,37,0.04),0_10px_28px_-16px_rgba(14,21,37,0.18)]',
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }) {
  return (
    <div
      data-slot="card-header"
      className={cn('flex flex-col gap-1 p-5 pb-0', className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }) {
  return (
    <h2
      data-slot="card-title"
      className={cn('text-lg font-semibold leading-tight', className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }) {
  return (
    <p
      data-slot="card-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }) {
  return <div data-slot="card-content" className={cn('p-5', className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
