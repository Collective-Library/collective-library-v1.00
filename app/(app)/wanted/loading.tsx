import { Skeleton } from "@/components/ui/skeleton";

export default function WantedLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-20 rounded-[4px]" />
          <Skeleton className="h-9 w-72 rounded-[4px]" />
          <Skeleton className="h-4 w-96 max-w-full rounded-[4px] mt-1" />
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        Sebentar, lagi narik permintaan komunitas…
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-paper border border-hairline rounded-card-lg shadow-card p-5 md:p-6 flex flex-col gap-4"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-pill" />
              <div className="flex flex-col gap-1.5 flex-1">
                <Skeleton className="h-3.5 w-32 rounded-[4px]" />
                <Skeleton className="h-3 w-24 rounded-[4px]" />
              </div>
              <Skeleton className="h-5 w-14 rounded-pill" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-[80%] rounded-[4px]" />
              <Skeleton className="h-4 w-[50%] rounded-[4px]" />
            </div>
            <Skeleton className="h-12 w-full rounded-pill" />
          </div>
        ))}
      </div>
    </div>
  );
}
