import Link from "next/link";
import { listShelfBooks, getShelfCounts } from "@/lib/books";
import { listActivity } from "@/lib/activity";
import { BookGrid } from "@/components/books/book-grid";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { ButtonLink } from "@/components/ui/button";
import { STATUS_FILTER_OPTIONS } from "@/lib/status";
import { cn } from "@/lib/cn";
import type { BookStatus } from "@/types";

export const dynamic = "force-dynamic";

type SP = { status?: string; q?: string; page?: string };

const PAGE_SIZE = 24;

export default async function ShelfPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { status, q, page: pageStr } = await searchParams;
  const filter = (STATUS_FILTER_OPTIONS.find((o) => o.value === status)?.value ?? "all") as BookStatus | "all";
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);

  const [{ books, total }, counts, activity] = await Promise.all([
    listShelfBooks({ status: filter, search: q, page, pageSize: PAGE_SIZE }),
    getShelfCounts(),
    // Activity widget only on the unfiltered "all" view, page 1 — keeps the
    // filtered browsing experience clean.
    filter === "all" && !q && page === 1 ? listActivity(4) : Promise.resolve([]),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-caption text-muted uppercase tracking-wide font-semibold">Rak Kolektif</p>
          <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
            Buku-buku komunitas
          </h1>
          <p className="mt-2 text-body-lg text-ink-soft max-w-xl">
            Jelajahi rak buku anggota Collective Library — tukar, pinjam, atau beli langsung dari pemiliknya.
          </p>
        </div>
        <div className="hidden md:block">
          <ButtonLink href="/book/add">+ Tambah Buku</ButtonLink>
        </div>
      </div>

      {/* Activity feed — only on the default unfiltered view */}
      {activity.length > 0 && <ActivityFeed items={activity} />}

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <StatCell label="Dijual" value={counts.sell} />
        <StatCell label="Dipinjamkan" value={counts.lend} />
        <StatCell label="Ditukar" value={counts.trade} />
        <StatCell label="Koleksi" value={counts.unavailable} />
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
        {STATUS_FILTER_OPTIONS.map((opt) => {
          const active = filter === opt.value;
          const params = new URLSearchParams();
          if (opt.value !== "all") params.set("status", opt.value);
          if (q) params.set("q", q);
          const href = "/shelf" + (params.toString() ? `?${params}` : "");
          return (
            <Link
              key={opt.value}
              href={href}
              className={cn(
                "shrink-0 inline-flex items-center h-9 px-4 rounded-pill text-body-sm font-medium transition-colors",
                active
                  ? "bg-ink text-parchment"
                  : "bg-paper text-ink-soft border border-hairline hover:bg-cream",
              )}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      {/* Grid */}
      <BookGrid books={books} />

      {/* Pagination — only when there's actually a 2nd page */}
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

      {/* Mobile add CTA fallback */}
      <div className="md:hidden mt-2">
        <ButtonLink href="/book/add" fullWidth>+ Tambah Buku</ButtonLink>
      </div>
    </div>
  );
}

function buildPageHref(opts: {
  page: number;
  status: BookStatus | "all";
  q?: string;
}): string {
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
        Buku <span className="font-semibold text-ink-soft">{rangeStart}–{rangeEnd}</span> dari{" "}
        <span className="font-semibold text-ink-soft">{totalBooks}</span>
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
      <p className="mt-1 text-caption text-muted">{label}</p>
    </div>
  );
}
