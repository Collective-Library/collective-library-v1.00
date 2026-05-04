import Link from "next/link";
import { listBooksAdmin, type AdminBookRow, type BookQualityFlag } from "@/lib/mastermind/books";
import { FilterRow, FilterPill } from "@/components/mastermind/filter-pills";
import { StatusBadge } from "@/components/ui/status-badge";
import type { BookStatus } from "@/types";
import { formatRelativeID } from "@/lib/format";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

const FLAG_LABEL: Record<BookQualityFlag, string> = {
  "no-cover": "Tanpa cover",
  "no-genre": "Tanpa genre",
  "no-isbn": "Tanpa ISBN",
  "no-description": "Tanpa deskripsi",
  "owner-missing": "Owner hilang",
  "duplicate-isbn": "ISBN duplikat",
  "duplicate-title-author": "Title+author duplikat",
};

type SP = {
  q?: string;
  status?: BookStatus | "all";
  flag?: BookQualityFlag | "any-flag" | "none" | "all";
};

export default async function BooksAdminPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const { q, status = "all", flag = "all" } = await searchParams;

  const flagOpt = flag === "all" ? undefined : flag;
  const rows = await listBooksAdmin({ search: q, status, flag: flagOpt });
  const allRows = await listBooksAdmin();

  const flagsCount = allRows.reduce(
    (acc, r) => {
      if (r.flags.length > 0) acc.anyFlag += 1;
      else acc.none += 1;
      return acc;
    },
    { anyFlag: 0, none: 0 },
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Book Intelligence
        </p>
        <h1 className="font-display text-display-xl text-ink leading-tight">
          {allRows.length} buku · {flagsCount.anyFlag} dengan quality flag.
        </h1>
        <p className="text-body text-ink-soft max-w-2xl">
          Quality flag = data yang missing atau duplikat. Click ke buku → detail
          + admin notes.
        </p>
      </header>

      <form action="/mastermind/books" method="GET" className="flex gap-2 flex-wrap">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Cari title, author, ISBN…"
          className="flex-1 min-w-[200px] h-11 px-3.5 bg-paper text-ink rounded-button border border-hairline-strong focus:outline-none focus:border-ink focus:border-2 focus:px-[13px]"
        />
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        {flag !== "all" && <input type="hidden" name="flag" value={flag} />}
        <button type="submit" className="inline-flex items-center h-11 px-5 rounded-pill bg-ink text-parchment text-body-sm font-semibold hover:bg-ink-soft">
          Cari
        </button>
      </form>

      <div className="flex flex-col gap-3">
        <FilterRow label="Status">
          <FilterPill href={hrefWith({ q, status: "all", flag })} active={status === "all"} label="Semua" />
          {(["sell", "lend", "trade", "unavailable"] as BookStatus[]).map((s) => (
            <FilterPill key={s} href={hrefWith({ q, status: s, flag })} active={status === s} label={s} />
          ))}
        </FilterRow>
        <FilterRow label="Quality">
          <FilterPill href={hrefWith({ q, status, flag: "all" })} active={flag === "all"} label={`Semua (${allRows.length})`} />
          <FilterPill href={hrefWith({ q, status, flag: "any-flag" })} active={flag === "any-flag"} label={`Ada flag (${flagsCount.anyFlag})`} />
          <FilterPill href={hrefWith({ q, status, flag: "none" })} active={flag === "none"} label={`Bersih (${flagsCount.none})`} />
          {(Object.keys(FLAG_LABEL) as BookQualityFlag[]).map((f) => (
            <FilterPill key={f} href={hrefWith({ q, status, flag: f })} active={flag === f} label={FLAG_LABEL[f]} />
          ))}
        </FilterRow>
      </div>

      {rows.length === 0 ? (
        <div className="bg-paper border border-hairline rounded-card-lg shadow-card p-10 text-center">
          <p className="font-display text-title-lg text-ink">Gak ada buku matching filter ini.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.book.id}>
              <BookRow row={r} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BookRow({ row }: { row: AdminBookRow }) {
  const b = row.book;
  return (
    <Link
      href={`/mastermind/books/${b.id}`}
      className="flex gap-3 bg-paper border border-hairline rounded-card hover:bg-cream/40 hover:shadow-card transition-colors p-3"
    >
      <div className="shrink-0 w-12 h-16 bg-cream rounded-button border border-hairline-soft overflow-hidden">
        {b.cover_url ? (
          <img src={b.cover_url} alt={b.title} width={48} height={64} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-caption">📕</div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <p className="text-body font-medium text-ink truncate">{b.title}</p>
          <StatusBadge status={b.status} />
        </div>
        <p className="text-caption text-muted truncate">
          {b.author}
          {row.owner ? ` · owned by ${row.owner.full_name ?? "@" + row.owner.username}` : " · ⚠ owner missing"}
          {" · "}
          {formatRelativeID(b.created_at)}
        </p>
        {row.flags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {row.flags.map((f) => (
              <span
                key={f}
                className={cn(
                  "inline-flex items-center h-5 px-1.5 rounded-pill text-[10px] font-semibold tracking-wide",
                  f === "owner-missing" || f.startsWith("duplicate")
                    ? "bg-(--color-okr-behind-bg) text-(--color-okr-behind)"
                    : "bg-(--color-okr-at-risk-bg) text-(--color-okr-at-risk)",
                )}
              >
                {FLAG_LABEL[f]}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function hrefWith(opts: SP): string {
  const params = new URLSearchParams();
  if (opts.q) params.set("q", opts.q);
  if (opts.status && opts.status !== "all") params.set("status", opts.status);
  if (opts.flag && opts.flag !== "all") params.set("flag", opts.flag);
  const qs = params.toString();
  return "/mastermind/books" + (qs ? `?${qs}` : "");
}
