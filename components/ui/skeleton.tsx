import { cn } from "@/lib/cn";

/**
 * Soft shimmer placeholder. Uses an animated gradient that matches the
 * parchment palette — feels like paper warming up, not a generic gray bar.
 */
export function Skeleton({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-card bg-cream", className)}
      aria-hidden
      {...rest}
    />
  );
}
