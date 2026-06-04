import { cn } from '../../lib/utils';

// shadcn/ui Badge, plus success/danger variants for gain/loss and buy/sell.
const base =
  'inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors';

const variants = {
  default: 'border-transparent bg-primary text-primary-foreground',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
  destructive: 'border-transparent bg-destructive text-destructive-foreground',
  outline: 'text-foreground',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  danger: 'border-red-500/30 bg-red-500/10 text-red-400',
};

function Badge({ className, variant = 'default', ...props }) {
  return <span className={cn(base, variants[variant], className)} {...props} />;
}

export { Badge };
