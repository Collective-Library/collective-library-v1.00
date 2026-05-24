import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/lib/feedback-constants";
import type { FeedbackCategory, FeedbackStatus } from "@/types";
import FeedbackRow, { FeedbackRowWithUser } from "@/components/feedback/feedback-row";
import { FilterPill, FilterRow, hrefWith } from "@/components/feedback/feedback-filter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin · Feedback",
  robots: { index: false, follow: false },
};

type SP = {
  status?: FeedbackStatus | "all";
  category?: FeedbackCategory | "all";
};

export default async function AdminFeedbackPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { status = "all", category = "all" } = await searchParams;

  const supabase = await createClient();
  let query = supabase
    .from("feedback")
    .select("*, user:profiles_public!feedback_user_id_fkey(full_name, username)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status !== "all") query = query.eq("status", status);
  if (category !== "all") query = query.eq("category", category);

  const { data, error } = await query;

  // Aggregate counts by status (over all categories of current category filter)
  const counts: Record<FeedbackStatus | "all", number> = {
    all: 0,
    new: 0,
    triaged: 0,
    planned: 0,
    shipped: 0,
    wontfix: 0,
  };
  let countsQuery = supabase.from("feedback").select("status");
  if (category !== "all") countsQuery = countsQuery.eq("category", category);
  const { data: countsData } = await countsQuery;
  for (const row of countsData ?? []) {
    counts.all += 1;
    counts[(row.status as FeedbackStatus) ?? "new"] += 1;
  }

  type Row = FeedbackRowWithUser & {
    user:
      | { full_name: string | null; username: string | null }
      | { full_name: string | null; username: string | null }[]
      | null;
  };
  const rows: FeedbackRowWithUser[] = ((data ?? []) as unknown as Row[]).map((r) => ({
    ...(r as FeedbackRowWithUser),
    user: Array.isArray(r.user) ? (r.user[0] ?? null) : r.user,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">Admin</p>
        <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">Feedback inbox</h1>
        <p className="mt-2 text-body text-ink-soft max-w-xl">
          {error
            ? "Gagal narik feedback — cek Supabase RLS / auth state."
            : `${rows.length} item ditampilin (filter: ${status} · ${category}).`}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <FilterRow label="Status">
          <FilterPill
            href={hrefWith({ status: "all", category }, "/admin/feedback")}
            active={status === "all"}
            label={`Semua (${counts.all})`}
          />
          {(Object.keys(STATUS_LABELS) as FeedbackStatus[]).map((s) => (
            <FilterPill
              key={s}
              href={hrefWith({ status: s, category }, "/admin/feedback")}
              active={status === s}
              label={`${STATUS_LABELS[s]} (${counts[s]})`}
            />
          ))}
        </FilterRow>
        <FilterRow label="Kategori">
          <FilterPill
            href={hrefWith({ status, category: "all" }, "/admin/feedback")}
            active={category === "all"}
            label="Semua"
          />
          {(Object.keys(CATEGORY_LABELS) as FeedbackCategory[]).map((c) => (
            <FilterPill
              key={c}
              href={hrefWith({ status, category: c }, "/admin/feedback")}
              active={category === c}
              label={CATEGORY_LABELS[c]}
            />
          ))}
        </FilterRow>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-card-lg border border-hairline bg-paper p-10 text-center">
          <p className="font-display text-title-lg text-ink">Inbox bersih.</p>
          <p className="mt-2 text-body text-muted">Gak ada feedback yang cocok di filter ini.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.id} id={r.id}>
              <FeedbackRow row={r} isAdmin={true} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
