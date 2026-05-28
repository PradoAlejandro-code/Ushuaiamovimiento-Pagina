import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-surface-secondary border border-border-base/50", className)}
      {...props} />
  );
}

export { Skeleton }
