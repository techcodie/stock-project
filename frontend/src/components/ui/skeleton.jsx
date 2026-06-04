import { cn } from '../../lib/utils';

// shadcn/ui Skeleton
function Skeleton({ className, ...props }) {
  return <div className={cn('animate-pulse rounded-md bg-white/10', className)} {...props} />;
}

export { Skeleton };
