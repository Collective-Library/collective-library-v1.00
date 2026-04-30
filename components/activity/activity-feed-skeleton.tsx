import { Skeleton } from "@/components/ui/skeleton";

export function ActivityFeedSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <section className="rounded-card-lg border border-hairline bg-paper p-4 md:p-5">
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="w-5 h-5 rounded-pill" />
        <Skeleton className="h-3 w-32 rounded-[4px]" />
      </div>
      <ul className="flex flex-col divide-y divide-hairline-soft">
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 py-2.5">
            <Skeleton className="w-7 h-7 rounded-pill" />
            <div className="flex-1 flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-[70%] rounded-[4px]" />
              <Skeleton className="h-3 w-16 rounded-[4px]" />
            </div>
            <Skeleton className="w-8 h-11 rounded-[4px]" />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Long-format skeleton for the /aktivitas page. */
export function ActivityFeedListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="bg-paper border border-hairline rounded-card-lg p-4 md:p-5 shadow-card"
        >
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="w-9 h-9 rounded-pill" />
            <div className="flex-1 flex flex-col gap-1">
              <Skeleton className="h-3.5 w-32 rounded-[4px]" />
              <Skeleton className="h-3 w-20 rounded-[4px]" />
            </div>
            <Skeleton className="h-3 w-14 rounded-[4px]" />
          </div>
          <Skeleton className="h-3 w-48 rounded-[4px] mb-3" />
          <div className="flex gap-4">
            <Skeleton className="w-20 h-28 md:w-24 md:h-32" />
            <div className="flex-1 flex flex-col gap-2 justify-center">
              <Skeleton className="h-5 w-[90%] rounded-[4px]" />
              <Skeleton className="h-3.5 w-[60%] rounded-[4px]" />
              <Skeleton className="h-5 w-16 rounded-pill mt-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
