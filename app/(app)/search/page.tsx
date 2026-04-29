import Link from "next/link";
import { searchBooks } from "@/lib/books";
import { BookGrid } from "@/components/books/book-grid";
import { ButtonLink } from "@/components/ui/button";
import { SearchInput } from "./search-input";

export const dynamic = "force-dynamic";

type SP = { q?: string };

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { q } = await searchParams;
  const trimmed = q?.trim() ?? "";
  const results = trimmed.length >= 2 ? await searchBooks(trimmed) : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">Cari</p>
        <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
          Cari buku, author, atau judul
        </h1>
      </div>

      <SearchInput defaultValue={trimmed} />

      {trimmed.length === 0 ? (
        <EmptyState>
          Ketik judul buku atau nama author yang lo cari.
        </EmptyState>
      ) : trimmed.length < 2 ? (
        <EmptyState>Minimal 2 karakter ya.</EmptyState>
      ) : results.length === 0 ? (
        <NoResults query={trimmed} />
      ) : (
        <>
          <p className="text-body-sm text-muted">
            {results.length} buku ditemukan untuk <span className="font-semibold text-ink-soft">&ldquo;{trimmed}&rdquo;</span>.
          </p>
          <BookGrid books={results} />
        </>
      )}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-card-lg border border-hairline bg-paper p-10 text-center">
      <p className="text-body text-muted">{children}</p>
    </div>
  );
}

function NoResults({ query }: { query: string }) {
  const wtbHref = `/wanted/add?title=${encodeURIComponent(query)}`;
  return (
    <div className="rounded-card-lg border border-hairline bg-paper p-10 text-center">
      <p className="font-display text-title-lg text-ink">
        Belum ada yang punya &ldquo;{query}&rdquo;.
      </p>
      <p className="mt-2 text-body text-muted max-w-md mx-auto">
        Buat WTB request — anggota yang punya buku ini bisa langsung kontak lo.
      </p>
      <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
        <ButtonLink href={wtbHref}>+ Buat WTB Request</ButtonLink>
        <ButtonLink href="/shelf" variant="secondary">Browse rak</ButtonLink>
      </div>
    </div>
  );
}
