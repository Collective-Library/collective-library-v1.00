import { BookCard } from "./book-card";
import type { BookWithOwner } from "@/types";

export function BookGrid({ books }: { books: BookWithOwner[] }) {
  if (books.length === 0) {
    return (
      <div className="rounded-card-lg border border-hairline bg-paper p-10 text-center">
        <p className="font-display text-title-lg text-ink">
          Rak ini lagi nunggu buku pertama.
        </p>
        <p className="mt-2 text-body text-muted max-w-md mx-auto">
          Buku yang lo selesai baca tahun ini, gimana?
        </p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-7">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
