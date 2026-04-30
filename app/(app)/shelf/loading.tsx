import { ActivityFeedSkeleton } from "@/components/activity/activity-feed-skeleton";
import { BookGridSkeleton } from "@/components/books/book-grid-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ShelfLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24 rounded-[4px]" />
          <Skeleton className="h-9 w-72 rounded-[4px]" />
          <Skeleton className="h-4 w-96 max-w-full rounded-[4px] mt-1" />
        </div>
      </div>
      <ActivityFeedSkeleton />
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-card" />
        ))}
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-pill" />
        ))}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        Sebentar, lagi nyusun rak komunitas…
      </p>
      <BookGridSkeleton />
    </div>
  );
}
