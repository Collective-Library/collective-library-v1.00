import { Skeleton } from "@/components/ui/skeleton";

export default function AnggotaLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-20 rounded-[4px]" />
        <Skeleton className="h-9 w-72 rounded-[4px]" />
        <Skeleton className="h-4 w-96 max-w-full rounded-[4px] mt-1" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-pill" />
        ))}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        Sebentar, lagi narik daftar anggota…
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-paper border border-hairline rounded-card-lg p-5 shadow-card flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <Skeleton className="w-12 h-12 rounded-pill" />
              <div className="flex flex-col gap-1.5 flex-1">
                <Skeleton className="h-4 w-32 rounded-[4px]" />
                <Skeleton className="h-3 w-24 rounded-[4px]" />
                <Skeleton className="h-3 w-40 rounded-[4px]" />
              </div>
            </div>
            <Skeleton className="h-3.5 w-full rounded-[4px]" />
            <Skeleton className="h-3.5 w-[60%] rounded-[4px]" />
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-20 rounded-pill" />
              <Skeleton className="h-5 w-16 rounded-pill" />
            </div>
            <div className="pt-2 border-t border-hairline-soft flex items-center justify-between">
              <Skeleton className="h-3 w-12 rounded-[4px]" />
              <Skeleton className="h-3 w-24 rounded-[4px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
