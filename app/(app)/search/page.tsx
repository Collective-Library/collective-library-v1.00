import Link from "next/link";
import { searchBooks } from "@/lib/books";
import { BookGrid } from "@/components/books/book-grid";
import { ButtonLink } from "@/components/ui/button";
import { SearchInput } from "./search-input";

export const dynamic = "force-dynamic";

type SP = { q?: string };

// Curated suggestions when the search box is empty. Picked to span 5 different
// genres — each one a one-tap path into a populated corner of the catalog.
const SAMPLE_QUERIES: { q: string; emoji: string; label: string }[] = [
  { q: "Sapiens", emoji: "🧠", label: "Sapiens" },
  { q: "Tere Liye", emoji: "📖", label: "Tere Liye" },
  { q: "Atomic Habits", emoji: "🌱", label: "Atomic Habits" },
  { q: "Pramoedya", emoji: "🇮🇩", label: "Pramoedya" },
  { q: "Murakami", emoji: "🌌", label: "Murakami" },
  { q: "filsafat", emoji: "📜", label: "filsafat" },
];

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
        <p className="mt-2 text-body text-ink-soft max-w-xl">
          Cari di rak komunitas. Yang udah lo type bakal di-match ke judul + author.
        </p>
      </div>

      <SearchInput defaultValue={trimmed} />

      {trimmed.length === 0 ? (
        <EmptySearchState />
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

/**
 * Helpful empty state when no query yet. Three layers of help:
 * 1. What can I search? (functional explainer)
 * 2. Sample queries (one-tap examples — fastest path to a result)
 * 3. Alternate paths (browse all, post WTB)
 */
function EmptySearchState() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-card-lg border border-hairline bg-paper p-6 md:p-8">
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Cara nyari
        </p>
        <h2 className="mt-1.5 font-display text-title-lg text-ink leading-tight">
          Apa yang bisa lo cari?
        </h2>
        <ul className="mt-4 flex flex-col gap-2 text-body-sm text-ink-soft">
          <li>
            <span className="font-medium text-ink">Judul buku</span> — &ldquo;Sapiens&rdquo;,
            &ldquo;Atomic Habits&rdquo;, &ldquo;Bumi Manusia&rdquo;
          </li>
          <li>
            <span className="font-medium text-ink">Nama author</span> — &ldquo;Pramoedya&rdquo;,
            &ldquo;Tere Liye&rdquo;, &ldquo;Murakami&rdquo;
          </li>
          <li>
            <span className="font-medium text-ink">Multi-keyword</span> juga bisa: &ldquo;harari sapiens&rdquo;,
            &ldquo;tere liye negeri&rdquo;.
          </li>
        </ul>
      </div>

      <div>
        <p className="text-caption font-semibold text-muted uppercase tracking-wide mb-3">
          Coba pencarian populer
        </p>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_QUERIES.map((s) => (
            <Link
              key={s.q}
              href={`/search?q=${encodeURIComponent(s.q)}`}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-pill bg-paper text-ink-soft border border-hairline-strong hover:bg-cream hover:text-ink transition-colors text-body-sm font-medium"
            >
              <span aria-hidden>{s.emoji}</span>
              <span>{s.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-card-lg border border-hairline bg-cream/40 p-5 text-center">
        <p className="text-body-sm text-ink-soft">
          Belum nemu yang lo mau?{" "}
          <Link href="/shelf" className="text-ink font-medium underline underline-offset-4">
            Browse rak komunitas
          </Link>{" "}
          atau{" "}
          <Link href="/wanted/add" className="text-ink font-medium underline underline-offset-4">
            posting WTB request
          </Link>
          .
        </p>
      </div>
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
