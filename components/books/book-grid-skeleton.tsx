import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton state for the Collective Shelf book grid. */
export function BookGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-7">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <Skeleton className="aspect-[3/4] w-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-[85%] rounded-[4px]" />
            <Skeleton className="h-3 w-[60%] rounded-[4px]" />
            <div className="flex items-center justify-between gap-2 mt-1">
              <Skeleton className="h-4 w-24 rounded-[4px]" />
              <Skeleton className="h-3 w-12 rounded-[4px]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
