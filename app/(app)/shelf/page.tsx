import Link from "next/link";
import { listShelfBooks, getShelfCounts, getRecentBookActivity } from "@/lib/books";
import { BookGrid } from "@/components/books/book-grid";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { ButtonLink } from "@/components/ui/button";
import { STATUS_FILTER_OPTIONS } from "@/lib/status";
import { cn } from "@/lib/cn";
import type { BookStatus } from "@/types";

export const dynamic = "force-dynamic";

type SP = { status?: string; q?: string };

export default async function ShelfPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { status, q } = await searchParams;
  const filter = (STATUS_FILTER_OPTIONS.find((o) => o.value === status)?.value ?? "all") as BookStatus | "all";

  const [books, counts, activity] = await Promise.all([
    listShelfBooks({ status: filter, search: q }),
    getShelfCounts(),
    // Activity widget only on the unfiltered "all" view — keeps the filtered
    // browsing experience clean.
    filter === "all" && !q ? getRecentBookActivity(4) : Promise.resolve([]),
  ]);

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

      {/* Mobile add CTA fallback */}
      <div className="md:hidden mt-2">
        <ButtonLink href="/book/add" fullWidth>+ Tambah Buku</ButtonLink>
      </div>
    </div>
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
