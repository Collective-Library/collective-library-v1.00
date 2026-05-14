import { FeedbackStatusControl } from "@/app/admin/feedback/status-control";
import { cn } from "@/lib/cn";
import { CATEGORY_LABELS, STATUS_LABELS, STATUS_TONE } from "@/lib/feedback-constants";
import { formatRelativeID } from "@/lib/format";
import { FeedbackItem } from "@/types";
import Link from "next/link";

export interface FeedbackRowWithUser extends FeedbackItem {
  user?: { full_name: string | null; username: string | null } | null;
}

interface FeedbackRowProps {
  row: FeedbackRowWithUser;
  isAdmin?: boolean;
}

export default function FeedbackRow({ row, isAdmin = false }: FeedbackRowProps) {
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

      {isAdmin && (
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
      )}

      {/* Status control + internal note (client component) */}
      {isAdmin && (
        <FeedbackStatusControl
          id={row.id}
          currentStatus={row.status}
          currentNote={row.internal_note ?? ""}
        />
      )}
    </article>
  );
}
