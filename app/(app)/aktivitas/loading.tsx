import { ActivityFeedListSkeleton } from "@/components/activity/activity-feed-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function AktivitasLoading() {
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-32 rounded-[4px]" />
        <Skeleton className="h-9 w-64 rounded-[4px]" />
        <Skeleton className="h-4 w-96 max-w-full rounded-[4px] mt-1" />
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        Sebentar, lagi narik aktivitas terbaru…
      </p>
      <ActivityFeedListSkeleton />
    </div>
  );
}
