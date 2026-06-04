import { forwardRef } from 'react';
import { motion as Motion } from 'motion/react';
import { cn } from '../../lib/utils';

// shadcn/ui Button — variants applied with cn() instead of cva to keep the
// dependency surface small. Base + variant + size class strings match shadcn.
const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer';

const variants = {
  default:
    'bg-primary text-primary-foreground shadow-lg shadow-emerald-500/20 hover:bg-primary/90 hover:shadow-emerald-500/30',
  destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
  outline: 'border border-border bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
};

const sizes = {
  default: 'h-9 px-4 py-2',
  sm: 'h-8 rounded-md px-3 text-xs',
  lg: 'h-11 rounded-md px-8 text-base',
  icon: 'h-9 w-9',
};

const Button = forwardRef(function Button(
  { className, variant = 'default', size = 'default', type = 'button', disabled, ...props },
  ref,
) {
  return (
    <Motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
});

export { Button };
