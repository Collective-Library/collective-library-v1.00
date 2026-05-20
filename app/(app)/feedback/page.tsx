import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/lib/feedback-constants";
import type { FeedbackCategory, FeedbackStatus, FeedbackItem } from "@/types";
import FeedbackRow from "@/components/feedback/feedback-row";
import { FilterPill, FilterRow, hrefWith } from "@/components/feedback/feedback-filter";
import { Pagination } from "@/components/feedback/feedback-pagination";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My feedback",
};

type SP = {
  status?: FeedbackStatus | "all";
  category?: FeedbackCategory | "all";
  page?: string;
};

const PAGE_SIZE = 10;

export default async function ReportsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { status = "all", category = "all", page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Main data query — filter by user_id explicitly + RLS policy
  let query = supabase
    .from("feedback")
    .select("id, category, message, status, attachments, page_url, created_at", {
      count: "exact",
    })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (status !== "all") query = query.eq("status", status);
  if (category !== "all") query = query.eq("category", category);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  // Counts for filter pill badges (also filtered by user_id)
  const counts: Record<FeedbackStatus | "all", number> = {
    all: 0,
    new: 0,
    triaged: 0,
    planned: 0,
    shipped: 0,
    wontfix: 0,
  };
  let countsQuery = supabase.from("feedback").select("status").eq("user_id", user.id);
  if (category !== "all") countsQuery = countsQuery.eq("category", category);
  const { data: countsData } = await countsQuery;
  for (const row of countsData ?? []) {
    counts.all += 1;
    counts[(row.status as FeedbackStatus) ?? "new"] += 1;
  }

  const reports = (data ?? []) as FeedbackItem[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-display-xl text-ink leading-tight">My Feedback</h1>
        <p className="mt-2 text-body text-ink-soft max-w-xl">
          Pantau status feedback yang pernah kamu kirim.
        </p>
        <p className="mt-2 text-body text-ink-soft max-w-xl">
          {error
            ? "Gagal narik feedback — cek Supabase RLS / auth state."
            : `${reports.length} item ditampilin (filter: ${status} · ${category}).`}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <FilterRow label="Status">
          <FilterPill
            href={hrefWith({ status: "all", category }, "/feedback")}
            active={status === "all"}
            label={`Semua (${counts.all})`}
          />
          {(Object.keys(STATUS_LABELS) as FeedbackStatus[]).map((s) => (
            <FilterPill
              key={s}
              href={hrefWith({ status: s, category }, "/feedback")}
              active={status === s}
              label={`${STATUS_LABELS[s]} (${counts[s]})`}
            />
          ))}
        </FilterRow>
        <FilterRow label="Kategori">
          <FilterPill
            href={hrefWith({ status, category: "all" }, "/feedback")}
            active={category === "all"}
            label="Semua"
          />
          {(Object.keys(CATEGORY_LABELS) as FeedbackCategory[]).map((c) => (
            <FilterPill
              key={c}
              href={hrefWith({ status, category: c }, "/feedback")}
              active={category === c}
              label={CATEGORY_LABELS[c]}
            />
          ))}
        </FilterRow>
      </div>

      {error ? (
        <div className="rounded-card-lg border border-hairline bg-paper p-10 text-center">
          <p className="font-display text-title-lg text-ink">Gagal memuat feedback</p>
          <p className="mt-2 text-body text-muted">Coba lagi beberapa saat.</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-card-lg border border-hairline bg-paper p-10 text-center">
          <p className="font-display text-title-lg text-ink">Belum ada feedback</p>
          <p className="mt-2 text-body text-muted">
            Feedback yang kamu kirim lewat &quot;Cerita ke kita&quot; bakal muncul di sini.
          </p>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {reports.map((r) => (
              <li key={r.id} id={r.id}>
                <FeedbackRow row={r} />
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              totalReports={count ?? 0}
              status={status}
              category={category}
              rangeStart={(page - 1) * PAGE_SIZE + 1}
              rangeEnd={Math.min(page * PAGE_SIZE, count ?? 0)}
            />
          )}
        </>
      )}
    </div>
  );
}
