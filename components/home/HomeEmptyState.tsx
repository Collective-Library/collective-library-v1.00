import Link from "next/link";

/**
 * Warm, founder-voice empty state. Used by the /home activity preview
 * when there's no activity to show, and as a general fallback.
 *
 * Per BRAND_AND_VOICE.md empty-state pattern: warm acknowledgment +
 * small invitation + clear next step. No "No data" / "Nothing here yet".
 */
export function HomeEmptyState({
  title,
  cta,
  action,
}: {
  title: string;
  cta?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="rounded-card-lg border border-hairline-soft bg-paper px-5 py-6 text-center space-y-2">
      <p className="text-body-sm font-medium text-ink">{title}</p>
      {cta && <p className="text-caption text-muted leading-snug">{cta}</p>}
      {action && (
        <div className="pt-1">
          <Link
            href={action.href}
            className="inline-flex items-center h-9 px-4 rounded-pill bg-ink text-parchment text-body-sm font-medium hover:bg-ink-soft transition-colors"
          >
            {action.label}
          </Link>
        </div>
      )}
    </div>
  );
}
