import Link from "next/link";
import Image from "next/image";
import { listWantedAdmin, type AdminWantedRow } from "@/lib/mastermind/requests";
import { FilterRow, FilterPill } from "@/components/mastermind/filter-pills";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeID } from "@/lib/format";
import type { WantedStatus } from "@/types";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<WantedStatus, string> = {
  open: "Open",
  fulfilled: "Fulfilled",
  closed: "Closed",
};

const STATUS_TONE: Record<WantedStatus, string> = {
  open: "bg-(--color-wanted-bg) text-(--color-wanted)",
  fulfilled: "bg-(--color-okr-on-track-bg) text-(--color-okr-on-track)",
  closed: "bg-(--color-unavailable-bg) text-(--color-unavailable)",
};

type SP = { q?: string; status?: WantedStatus | "all" };

export default async function WantedAdminPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const { q, status = "all" } = await searchParams;
  const { rows, counts } = await listWantedAdmin({ search: q, status });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Buku Dicari (WTB) · Admin view
        </p>
        <h1 className="font-display text-display-xl text-ink leading-tight">
          {counts.open} open · {counts.fulfilled} fulfilled · {counts.closed} closed.
        </h1>
        <p className="text-body text-ink-soft max-w-2xl">
          Lihat semua wanted requests dari komunitas. Status changes saat ini lewat
          requester di /wanted (atau via Supabase Studio kalau perlu admin override).
        </p>
      </header>

      <form action="/mastermind/requests" method="GET" className="flex gap-2 flex-wrap">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Cari title atau author…"
          className="flex-1 min-w-[200px] h-11 px-3.5 bg-paper text-ink rounded-button border border-hairline-strong focus:outline-none focus:border-ink focus:border-2 focus:px-[13px]"
        />
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <button type="submit" className="inline-flex items-center h-11 px-5 rounded-pill bg-ink text-parchment text-body-sm font-semibold hover:bg-ink-soft">
          Cari
        </button>
      </form>

      <FilterRow label="Status">
        <FilterPill href={hrefWith({ q, status: "all" })} active={status === "all"} label={`Semua (${counts.total})`} />
        {(["open", "fulfilled", "closed"] as WantedStatus[]).map((s) => (
          <FilterPill key={s} href={hrefWith({ q, status: s })} active={status === s} label={`${STATUS_LABEL[s]} (${counts[s]})`} />
        ))}
      </FilterRow>

      {rows.length === 0 ? (
        <div className="bg-paper border border-hairline rounded-card-lg shadow-card p-10 text-center">
          <p className="font-display text-title-lg text-ink">Gak ada wanted request matching.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.wanted.id}>
              <WantedRow row={r} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WantedRow({ row }: { row: AdminWantedRow }) {
  const w = row.wanted;
  return (
    <article className="flex gap-3 bg-paper border border-hairline rounded-card-lg shadow-card p-4">
      <div className="shrink-0 w-12 h-16 bg-cream rounded-button border border-hairline-soft overflow-hidden">
        {w.cover_url ? (
          <Image src={w.cover_url} alt={w.title} width={48} height={64} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted">📕</div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <p className="text-body font-medium text-ink truncate">{w.title}</p>
          <span className={cn("inline-flex items-center h-5 px-2 rounded-pill text-[10px] font-semibold tracking-wide", STATUS_TONE[w.status])}>
            {STATUS_LABEL[w.status]}
          </span>
        </div>
        {w.author && <p className="text-caption text-muted truncate">by {w.author}</p>}
        {w.notes && <p className="mt-1 text-caption italic text-ink-soft whitespace-pre-wrap">{w.notes}</p>}
        <div className="flex items-center gap-2 mt-1.5">
          {row.requester ? (
            <Link
              href={`/mastermind/users/${row.requester.id}`}
              className="flex items-center gap-1.5 text-caption text-ink-soft hover:text-ink"
            >
              <Avatar src={row.requester.photo_url} name={row.requester.full_name} size={20} />
              <span className="truncate">
                {row.requester.full_name ?? `@${row.requester.username}`}
              </span>
            </Link>
          ) : (
            <span className="text-caption text-muted">requester unknown</span>
          )}
          <span className="text-caption text-muted">· {formatRelativeID(w.created_at)}</span>
          {w.max_budget && (
            <span className="text-caption text-muted">
              · max Rp {w.max_budget.toLocaleString("id-ID")}
            </span>
          )}
          {w.city && <span className="text-caption text-muted">· {w.city}</span>}
        </div>
      </div>
    </article>
  );
}

function hrefWith(opts: SP): string {
  const params = new URLSearchParams();
  if (opts.q) params.set("q", opts.q);
  if (opts.status && opts.status !== "all") params.set("status", opts.status);
  const qs = params.toString();
  return "/mastermind/requests" + (qs ? `?${qs}` : "");
}
