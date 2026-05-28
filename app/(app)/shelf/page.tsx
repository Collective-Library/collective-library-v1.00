import Link from "next/link";
import type { Metadata } from "next";
import { listShelfBooks, getShelfCounts } from "@/lib/books";
import { BookGrid } from "@/components/books/book-grid";
import { ShelfClientWrapper } from "@/components/books/shelf-client-wrapper";
import { ButtonLink } from "@/components/ui/button";
import { STATUS_FILTER_OPTIONS } from "@/lib/status";
import type { BookStatus } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rak Kolektif",
  description:
    "Buku-buku komunitas Collective Library — tukar, pinjam, atau beli langsung dari pemiliknya.",
};

type SP = { status?: string; q?: string; page?: string };

const PAGE_SIZE = 24;

export default async function ShelfPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { status, q, page: pageStr } = await searchParams;
  const filter = (STATUS_FILTER_OPTIONS.find((o) => o.value === status)?.value ?? "all") as
    | BookStatus
    | "all";
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);

  // Slice 3B: ecosystem widgets (events + activity) moved to /home. /shelf is
  // now the focused books surface. A small cross-link CTA points to /home on
  // the default unfiltered view (same condition that gated the side panels).
  const showHomeCta = filter === "all" && !q && page === 1;
  const [{ books, total }, counts] = await Promise.all([
    listShelfBooks({ status: filter, search: q, page, pageSize: PAGE_SIZE }),
    getShelfCounts(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-caption text-muted uppercase tracking-wide font-semibold">
            Rak Kolektif
          </p>
          <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
            Buku-buku komunitas
          </h1>
          <p className="mt-2 text-body-lg text-ink-soft max-w-xl">
            Jelajahi rak buku anggota Collective Library — tukar, pinjam, atau beli langsung dari
            pemiliknya.
          </p>
        </div>
        <div className="hidden md:block">
          <ButtonLink href="/book/add">+ Tambah Buku</ButtonLink>
        </div>
      </div>

      {/* Slice 3B cross-link to /home — page-1 unfiltered only, slim banner,
          subtle treatment so /shelf doesn't feel like home again. */}
      {showHomeCta && (
        <Link
          href="/home"
          className="group flex items-center justify-between gap-3 rounded-card-lg border border-hairline-soft bg-cream/60 px-4 py-3 hover:bg-cream transition-colors"
        >
          <div className="min-w-0">
            <p className="text-body-sm font-semibold text-ink leading-tight">
              Lihat yang lagi terjadi di komunitas
            </p>
            <p className="text-caption text-muted leading-snug mt-0.5">
              Activity, event, map, manifest, dan spots sekarang ada di Home.
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center h-8 px-3 rounded-pill bg-ink text-parchment text-caption font-medium group-hover:bg-ink-soft transition-colors">
            Buka Home →
          </span>
        </Link>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <StatCell label="Dijual" value={counts.sell} />
        <StatCell label="Dipinjam" value={counts.lend} />
        <StatCell label="Ditukar" value={counts.trade} />
        <StatCell label="Koleksi" value={counts.unavailable} />
      </div>

      {/* Filter pills + grid — client wrapper gives instant optimistic feedback
          and fades the grid while the server re-renders on filter change. */}
      <ShelfClientWrapper filter={filter} q={q}>
        <BookGrid books={books} />
        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            status={filter}
            q={q}
            totalBooks={total}
            rangeStart={(page - 1) * PAGE_SIZE + 1}
            rangeEnd={Math.min(page * PAGE_SIZE, total)}
          />
        )}
      </ShelfClientWrapper>

      {/* Mobile add CTA fallback */}
      <div className="md:hidden mt-2">
        <ButtonLink href="/book/add" fullWidth>
          + Tambah Buku
        </ButtonLink>
      </div>
    </div>
  );
}

function buildPageHref(opts: { page: number; status: BookStatus | "all"; q?: string }): string {
  const params = new URLSearchParams();
  if (opts.status !== "all") params.set("status", opts.status);
  if (opts.q) params.set("q", opts.q);
  if (opts.page > 1) params.set("page", String(opts.page));
  const qs = params.toString();
  return "/shelf" + (qs ? `?${qs}` : "");
}

function Pagination({
  page,
  totalPages,
  status,
  q,
  totalBooks,
  rangeStart,
  rangeEnd,
}: {
  page: number;
  totalPages: number;
  status: BookStatus | "all";
  q?: string;
  totalBooks: number;
  rangeStart: number;
  rangeEnd: number;
}) {
  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3 pt-2 border-t border-hairline-soft"
    >
      <p className="text-caption text-muted">
        Buku{" "}
        <span className="font-semibold text-ink-soft">
          {rangeStart}–{rangeEnd}
        </span>{" "}
        dari <span className="font-semibold text-ink-soft">{totalBooks}</span>
      </p>
      <div className="flex items-center gap-2">
        <PaginationLink
          href={buildPageHref({ page: prev, status, q })}
          disabled={!hasPrev}
          ariaLabel="Halaman sebelumnya"
        >
          ← Sebelumnya
        </PaginationLink>
        <span className="text-caption text-muted px-2 hidden sm:inline">
          Hal. {page} / {totalPages}
        </span>
        <PaginationLink
          href={buildPageHref({ page: next, status, q })}
          disabled={!hasNext}
          ariaLabel="Halaman selanjutnya"
        >
          Selanjutnya →
        </PaginationLink>
      </div>
    </nav>
  );
}

function PaginationLink({
  href,
  disabled,
  ariaLabel,
  children,
}: {
  href: string;
  disabled: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span
        aria-label={ariaLabel}
        aria-disabled="true"
        className="inline-flex items-center h-9 px-4 rounded-pill text-body-sm font-medium bg-cream text-muted-soft cursor-not-allowed"
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="inline-flex items-center h-9 px-4 rounded-pill text-body-sm font-medium bg-paper text-ink-soft border border-hairline hover:bg-cream transition-colors"
    >
      {children}
    </Link>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-paper border border-hairline rounded-card px-3 py-3 sm:px-4 sm:py-4">
      <p className="font-display text-display-md text-ink leading-none">{value}</p>
      <p className="mt-1 text-caption text-muted leading-tight truncate">{label}</p>
    </div>
  );
}
