import { cn } from '../../lib/utils';

// shadcn/ui Label
function Label({ className, ...props }) {
  return (
    <label
      className={cn(
        'text-sm font-medium leading-none text-foreground/90 peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  );
}

export { Label };
