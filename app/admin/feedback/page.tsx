import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/cn";
import { formatRelativeID } from "@/lib/format";
import type { FeedbackCategory, FeedbackStatus, FeedbackItem } from "@/types";
import { FeedbackStatusControl } from "./status-control";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin · Feedback",
  robots: { index: false, follow: false },
};

type SP = {
  status?: FeedbackStatus | "all";
  category?: FeedbackCategory | "all";
};

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  idea: "💡 Ide",
  bug: "🐛 Bug",
  friction: "😕 Friksi",
  appreciation: "❤️ Apresiasi",
  other: "✋ Lain",
};

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: "Baru",
  triaged: "Triaged",
  planned: "Planned",
  shipped: "Shipped",
  wontfix: "Won't fix",
};

const STATUS_TONE: Record<FeedbackStatus, string> = {
  new: "bg-(--color-wanted-bg) text-(--color-wanted)",
  triaged: "bg-cream text-ink-soft border border-hairline",
  planned: "bg-(--color-trade-bg) text-(--color-trade)",
  shipped: "bg-(--color-lend-bg) text-(--color-lend)",
  wontfix: "bg-(--color-unavailable-bg) text-(--color-unavailable)",
};

interface FeedbackRowWithUser extends FeedbackItem {
  user?: { full_name: string | null; username: string | null } | null;
}

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
            href={hrefWith({ status: "all", category })}
            active={status === "all"}
            label={`Semua (${counts.all})`}
          />
          {(Object.keys(STATUS_LABELS) as FeedbackStatus[]).map((s) => (
            <FilterPill
              key={s}
              href={hrefWith({ status: s, category })}
              active={status === s}
              label={`${STATUS_LABELS[s]} (${counts[s]})`}
            />
          ))}
        </FilterRow>
        <FilterRow label="Kategori">
          <FilterPill
            href={hrefWith({ status, category: "all" })}
            active={category === "all"}
            label="Semua"
          />
          {(Object.keys(CATEGORY_LABELS) as FeedbackCategory[]).map((c) => (
            <FilterPill
              key={c}
              href={hrefWith({ status, category: c })}
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
              <FeedbackRow row={r} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FeedbackRow({ row }: { row: FeedbackRowWithUser }) {
  const userName = row.user?.full_name ?? row.user?.username ?? (row.user_id ? "anggota" : "anon");
  const handle = row.user?.username ? `@${row.user.username}` : null;

  const attachmentLinks = row.attachments
    ? row.attachments
        .split(/[\n,]+/)
        .map((link) => link.trim())
        .filter(Boolean)
    : [];

  return (
    <article className="bg-paper border border-hairline rounded-card-lg shadow-card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-body-sm font-semibold text-ink">
            {CATEGORY_LABELS[row.category]}
          </span>
          <span
            className={cn(
              "inline-flex items-center h-6 px-2.5 rounded-pill text-[11px] font-semibold",
              STATUS_TONE[row.status]
            )}
          >
            {STATUS_LABELS[row.status]}
          </span>
        </div>
        <span className="text-caption text-muted font-mono">
          {formatRelativeID(row.created_at)}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-body text-ink whitespace-pre-wrap leading-relaxed">{row.message}</p>

        {attachmentLinks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachmentLinks.map((link, idx) => (
              <a
                key={idx}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center h-7 px-3 rounded-pill bg-cream text-ink-soft text-[11px] font-medium border border-hairline-strong hover:bg-parchment hover:text-ink transition-colors"
              >
                📎 Link {idx + 1}
              </a>
            ))}
          </div>
        )}
      </div>

      <dl className="flex flex-wrap gap-x-5 gap-y-1 text-caption text-muted border-t border-hairline-soft pt-3">
        <div>
          <span className="uppercase tracking-wide font-semibold text-[11px]">User · </span>
          {row.user?.username ? (
            <Link
              href={`/profile/${row.user.username}`}
              target="_blank"
              className="text-ink-soft underline underline-offset-4 hover:text-ink"
            >
              {userName}
              {handle ? ` (${handle})` : ""}
            </Link>
          ) : (
            <span className="text-ink-soft">{userName}</span>
          )}
        </div>
        {row.email && (
          <div>
            <span className="uppercase tracking-wide font-semibold text-[11px]">Email · </span>
            <a
              href={`mailto:${row.email}`}
              className="text-ink-soft underline underline-offset-4 hover:text-ink"
            >
              {row.email}
            </a>
          </div>
        )}
        {row.page_url && (
          <div>
            <span className="uppercase tracking-wide font-semibold text-[11px]">Page · </span>
            <code className="text-ink-soft text-[12px]">{row.page_url}</code>
          </div>
        )}
      </dl>

      {/* Status control + internal note (client component) */}
      <FeedbackStatusControl
        id={row.id}
        currentStatus={row.status}
        currentNote={row.internal_note ?? ""}
      />
    </article>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">{label}</p>
      <div className="flex gap-2 overflow-x-auto scrollbar-none">{children}</div>
    </div>
  );
}

function FilterPill({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 inline-flex items-center h-9 px-4 rounded-pill text-body-sm font-medium transition-colors",
        active
          ? "bg-ink text-parchment"
          : "bg-paper text-ink-soft border border-hairline hover:bg-cream"
      )}
    >
      {label}
    </Link>
  );
}

function hrefWith(opts: SP): string {
  const params = new URLSearchParams();
  if (opts.status && opts.status !== "all") params.set("status", opts.status);
  if (opts.category && opts.category !== "all") params.set("category", opts.category);
  const qs = params.toString();
  return "/admin/feedback" + (qs ? `?${qs}` : "");
}
