import { BookGridSkeleton } from "@/components/books/book-grid-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end gap-5 mb-7">
        <Skeleton className="w-[88px] h-[88px] rounded-pill" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-9 w-72 max-w-full rounded-[4px]" />
          <Skeleton className="h-4 w-48 rounded-[4px]" />
          <Skeleton className="h-4 w-96 max-w-full rounded-[4px] mt-2" />
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        Sebentar, lagi nyusun rak orang ini…
      </p>
      <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-7">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-card" />
        ))}
      </div>
      <Skeleton className="h-7 w-32 rounded-[4px] mb-4" />
      <BookGridSkeleton count={8} />
    </div>
  );
}
