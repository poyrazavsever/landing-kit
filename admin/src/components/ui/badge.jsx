import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap [&_svg]:size-3',
  {
    variants: {
      variant: {
        default: 'bg-accent text-accent-foreground',
        muted: 'bg-muted text-muted-foreground',
        new: 'bg-brand-2 text-brand-2-foreground',
        outline: 'border text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

function Badge({ className, variant, ...props }) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge };
