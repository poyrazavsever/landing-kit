import { cn } from '@/lib/utils';

const fieldBase = [
  'w-full min-w-0 rounded-lg border border-input bg-card px-3.5 text-base shadow-xs outline-none',
  'transition-[color,box-shadow] placeholder:text-muted-foreground/80',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25',
  'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
].join(' ');

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn('flex h-12', fieldBase, className)}
      {...props}
    />
  );
}

function Textarea({ className, ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn('flex min-h-28 py-3', fieldBase, className)}
      {...props}
    />
  );
}

export { Input, Textarea };
