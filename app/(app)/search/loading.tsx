import { BookGridSkeleton } from "@/components/books/book-grid-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-12 rounded-[4px]" />
        <Skeleton className="h-9 w-80 max-w-full rounded-[4px]" />
      </div>
      <Skeleton className="h-14 w-full rounded-pill" />
      <p className="sr-only" role="status" aria-live="polite">
        Sebentar, lagi nyari buku…
      </p>
      <BookGridSkeleton count={6} />
    </div>
  );
}
