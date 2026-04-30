import { Skeleton } from "@/components/ui/skeleton";

export default function BookDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <div className="relative -mx-4 md:-mx-6 mb-8 overflow-hidden rounded-none md:rounded-card-lg">
        <Skeleton className="h-56 md:h-72 rounded-none" />
        <div className="relative -mt-32 md:-mt-40 px-4 md:px-6 flex flex-col md:flex-row gap-6 items-end">
          <Skeleton className="w-32 md:w-48 aspect-[3/4] shrink-0" />
          <div className="flex-1 pb-2 flex flex-col gap-2">
            <Skeleton className="h-5 w-20 rounded-pill" />
            <Skeleton className="h-9 w-[80%] rounded-[4px]" />
            <Skeleton className="h-5 w-32 rounded-[4px]" />
          </div>
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        Sebentar, lagi narik info buku ini…
      </p>

      <div className="grid md:grid-cols-[1fr_320px] gap-8">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-20 rounded-card" />
          <Skeleton className="h-40 rounded-card" />
        </div>
        <Skeleton className="h-32 rounded-card-lg" />
      </div>
    </div>
  );
}
