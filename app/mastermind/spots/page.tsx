import Link from "next/link";
import {
  SPOT_STATUS_OPTIONS,
  SPOT_TYPE_OPTIONS,
  countSpotsByStatus,
  listSpotsAdmin,
} from "@/lib/spots";
import type { SpotStatus, SpotType } from "@/types";
import { FilterPill, FilterRow } from "@/components/mastermind/filter-pills";
import { SpotActiveToggle, SpotStatusControl } from "@/components/spots/spot-controls";
import { formatRelativeID } from "@/lib/format";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

type SP = {
  q?: string;
  status?: SpotStatus | "all";
  type?: SpotType | "all";
};

export default async function SpotsAdminPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { q, status = "all", type = "all" } = await searchParams;

  const [rows, counts] = await Promise.all([
    listSpotsAdmin({ status, type, search: q }),
    countSpotsByStatus(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Library Nodes · admin
        </p>
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <h1 className="font-display text-display-xl text-ink leading-tight">
            Spots ({rows.length})
          </h1>
          <Link
            href="/mastermind/spots/new"
            className="inline-flex items-center h-10 px-5 rounded-pill bg-ink text-parchment text-body-sm font-semibold hover:bg-ink-soft"
          >
            + Bikin Spot
          </Link>
        </div>
        <p className="text-body text-ink-soft max-w-2xl">
          Tempat fisik tempat buku, event, dan komunitas hidup di dunia nyata — cafe, rak buku
          publik (Nawala-style), ruang komunitas, kampus, partner. Default{" "}
          <code className="font-mono text-caption">needs_audit</code>; admin promote ke{" "}
          <code className="font-mono text-caption">active</code> biar muncul di future surface.
          Public <code className="font-mono text-caption">/spots</code> belum dibuild.
        </p>
      </header>

      {/* Search */}
      <form action="/mastermind/spots" method="GET" className="flex gap-2 flex-wrap">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Cari nama, slug, deskripsi…"
          className="flex-1 min-w-[200px] h-11 px-3.5 bg-paper text-ink rounded-button border border-hairline-strong focus:outline-none focus:border-ink focus:border-2 focus:px-[13px]"
        />
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        {type !== "all" && <input type="hidden" name="type" value={type} />}
        <button
          type="submit"
          className="inline-flex items-center h-11 px-5 rounded-pill bg-ink text-parchment text-body-sm font-semibold hover:bg-ink-soft"
        >
          Cari
        </button>
      </form>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <FilterRow label="Status">
          <FilterPill
            href={hrefWith({ q, status: "all", type })}
            active={status === "all"}
            label="Semua"
            count={counts.all}
          />
          {SPOT_STATUS_OPTIONS.map((o) => (
            <FilterPill
              key={o.value}
              href={hrefWith({ q, status: o.value, type })}
              active={status === o.value}
              label={o.label}
              count={counts[o.value]}
            />
          ))}
        </FilterRow>
        <FilterRow label="Tipe">
          <FilterPill
            href={hrefWith({ q, status, type: "all" })}
            active={type === "all"}
            label="Semua"
          />
          {SPOT_TYPE_OPTIONS.map((o) => (
            <FilterPill
              key={o.value}
              href={hrefWith({ q, status, type: o.value })}
              active={type === o.value}
              label={`${o.emoji} ${o.label}`}
            />
          ))}
        </FilterRow>
      </div>

      {/* List */}
      {rows.length === 0 ? (
        <div className="bg-paper border border-hairline rounded-card-lg shadow-card p-10 text-center">
          <p className="font-display text-title-lg text-ink">Belum ada Spot.</p>
          <p className="mt-2 text-body text-muted max-w-md mx-auto">
            Mulai dengan satu cafe atau rak buku publik yang lo udah kenal. Anti-empty-state: target
            3 Spot real sebelum public surface dibuka.
          </p>
          <Link
            href="/mastermind/spots/new"
            className="mt-4 inline-flex items-center h-10 px-5 rounded-pill bg-ink text-parchment text-body-sm font-semibold hover:bg-ink-soft"
          >
            + Bikin Spot pertama
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => {
            const typeOpt = SPOT_TYPE_OPTIONS.find((t) => t.value === r.type);
            return (
              <li key={r.id}>
                <div
                  className={cn(
                    "bg-paper border border-hairline rounded-card hover:bg-cream/40 hover:shadow-card transition-colors p-4",
                    "flex flex-col sm:flex-row sm:items-center gap-3"
                  )}
                >
                  <Link
                    href={`/mastermind/spots/${r.id}`}
                    className="flex-1 min-w-0 flex items-center gap-3"
                  >
                    <span
                      aria-hidden
                      className="shrink-0 w-10 h-10 rounded-button bg-cream/80 flex items-center justify-center text-lg"
                    >
                      {typeOpt?.emoji ?? "✨"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium text-ink truncate">
                        {r.name}
                        <span className="ml-2 text-caption text-muted font-mono font-normal">
                          {r.slug}
                        </span>
                      </p>
                      <p className="text-caption text-muted truncate">
                        {typeOpt?.label ?? r.type}
                        {" · "}
                        {r.city}
                        {" · "}
                        {formatRelativeID(r.created_at)}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <SpotStatusControl spotId={r.id} status={r.status} />
                    <SpotActiveToggle spotId={r.id} isActive={r.is_active} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function hrefWith(opts: {
  q?: string;
  status: SpotStatus | "all";
  type: SpotType | "all";
}): string {
  const params = new URLSearchParams();
  if (opts.q) params.set("q", opts.q);
  if (opts.status !== "all") params.set("status", opts.status);
  if (opts.type !== "all") params.set("type", opts.type);
  const qs = params.toString();
  return "/mastermind/spots" + (qs ? `?${qs}` : "");
}
