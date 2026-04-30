import Link from "next/link";
import { listMembersAdmin, type AdminMemberRow } from "@/lib/mastermind/users";
import { FilterRow, FilterPill } from "@/components/mastermind/filter-pills";
import { ScoreBadge } from "@/components/mastermind/score-badge";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeID } from "@/lib/format";

export const dynamic = "force-dynamic";

type Filter = "all" | "complete" | "incomplete" | "no-book" | "no-photo" | "admin" | "dormant";
type Sort = "newest" | "oldest" | "potential" | "books" | "activity";

const FILTER_LABEL: Record<Filter, string> = {
  all: "Semua",
  complete: "Profil lengkap",
  incomplete: "Profil belum lengkap",
  "no-book": "Belum punya buku",
  "no-photo": "Belum ada foto",
  admin: "Admin",
  dormant: "Dormant (30d)",
};

const SORT_LABEL: Record<Sort, string> = {
  newest: "Terbaru",
  oldest: "Terlama",
  potential: "Potensi tertinggi",
  books: "Banyak buku",
  activity: "Banyak aktivitas",
};

type SP = { q?: string; filter?: Filter; sort?: Sort };

export default async function UsersAdminPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const { q, filter = "all", sort = "newest" } = await searchParams;
  const rows = await listMembersAdmin({ search: q, filter, sort });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          User Intelligence
        </p>
        <h1 className="font-display text-display-xl text-ink leading-tight">
          {rows.length} anggota.
        </h1>
        <p className="text-body text-ink-soft max-w-2xl">
          Server-role read — semua profil ke-list, RLS by-passed (admin gate
          udah aman di layout). Setiap baris kasih completion + potential
          score (penjelasan ada di hover).
        </p>
      </header>

      <form action="/mastermind/users" method="GET" className="flex gap-2 flex-wrap">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Cari nama, username, IG, kota…"
          className="flex-1 min-w-[200px] h-11 px-3.5 bg-paper text-ink rounded-button border border-hairline-strong focus:outline-none focus:border-ink focus:border-2 focus:px-[13px]"
        />
        {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
        {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
        <button
          type="submit"
          className="inline-flex items-center h-11 px-5 rounded-pill bg-ink text-parchment text-body-sm font-semibold hover:bg-ink-soft"
        >
          Cari
        </button>
      </form>

      <div className="flex flex-col gap-3">
        <FilterRow label="Filter">
          {(Object.keys(FILTER_LABEL) as Filter[]).map((f) => (
            <FilterPill
              key={f}
              href={hrefWith({ q, filter: f, sort })}
              active={filter === f}
              label={FILTER_LABEL[f]}
            />
          ))}
        </FilterRow>
        <FilterRow label="Sort">
          {(Object.keys(SORT_LABEL) as Sort[]).map((s) => (
            <FilterPill
              key={s}
              href={hrefWith({ q, filter, sort: s })}
              active={sort === s}
              label={SORT_LABEL[s]}
            />
          ))}
        </FilterRow>
      </div>

      {rows.length === 0 ? (
        <div className="bg-paper border border-hairline rounded-card-lg shadow-card p-10 text-center">
          <p className="font-display text-title-lg text-ink">Gak ada hasil.</p>
          <p className="mt-2 text-body text-muted">Coba reset filter atau ubah search.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.profile.id}>
              <UserRow row={r} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function UserRow({ row }: { row: AdminMemberRow }) {
  const p = row.profile;
  return (
    <Link
      href={`/mastermind/users/${p.id}`}
      className="block bg-paper border border-hairline rounded-card hover:bg-cream/40 hover:shadow-card transition-colors p-4"
    >
      <div className="flex items-center gap-3">
        <Avatar src={p.photo_url} name={p.full_name} size={44} isAdmin={p.is_admin} />
        <div className="flex-1 min-w-0">
          <p className="text-body font-medium text-ink truncate">
            {p.full_name ?? p.username ?? "—"}
            {p.username && (
              <span className="ml-2 text-caption text-muted font-normal">@{p.username}</span>
            )}
          </p>
          <p className="text-caption text-muted truncate">
            {[p.city, p.address_area].filter(Boolean).join(" · ") || "—"}
            {p.profession && ` · ${p.profession}`}
            {" · joined "}{formatRelativeID(p.created_at)}
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1 text-caption text-muted">
          <span>{row.bookCount} buku · {row.activityLast30d} act 30d</span>
          <div className="flex gap-1">
            <ScoreBadge score={row.completion.score} label="Profile" factors={row.completion.factors} />
            <ScoreBadge score={row.potential.score} label="Potential" factors={row.potential.factors} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function hrefWith(opts: { q?: string; filter: Filter; sort: Sort }): string {
  const params = new URLSearchParams();
  if (opts.q) params.set("q", opts.q);
  if (opts.filter !== "all") params.set("filter", opts.filter);
  if (opts.sort !== "newest") params.set("sort", opts.sort);
  const qs = params.toString();
  return "/mastermind/users" + (qs ? `?${qs}` : "");
}
