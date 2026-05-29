"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Props {
  /** Event id — currently unused but reserved for future per-event analytics. */
  eventId: string;
  title: string;
  /** ISO timestamp from `event.starts_at`. */
  startsAt: string;
  /** Event timezone (e.g. "Asia/Jakarta"). */
  timezone: string;
  /** Absolute event URL — caller passes `${getAppUrl()}/event/${id}`. */
  eventUrl: string;
  /** Optional hashtag array from `event.hashtags` (migration 0022). */
  hashtags?: string[] | null;
}

/**
 * Manual X / Twitter share for an event. Intent-only — no API integration,
 * no DB write, no paste-back input. Composes a 280-char-aware template the
 * host or admin can copy or open in X compose. The host posts manually
 * from the community X account (@collectivelibrary.id).
 *
 * Why intent-only: the `events` table has no `x_posted_url` column (only
 * Manifest has one, per migration 0023). Recording the posted URL for
 * events would require a schema change, which Slice 7B intentionally
 * defers — see `docs/audits/distribution-layer-audit.md`.
 *
 * Visibility / past-event checks are enforced by the calling page, not
 * here. This component renders unconditionally when mounted.
 */
export function ShareToXButton({ title, startsAt, timezone, eventUrl, hashtags }: Props) {
  const [copying, setCopying] = useState(false);

  const dateLabel = new Date(startsAt).toLocaleString("id-ID", {
    timeZone: timezone || "Asia/Jakarta",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // First 1–3 hashtags, slug-safe. Skips empties.
  const hashtagsLine = (hashtags ?? [])
    .slice(0, 3)
    .map((h) => "#" + h.replace(/[^a-z0-9]/gi, ""))
    .filter((s) => s.length > 1)
    .join(" ");

  // Compose: title \n date \n url \n hashtags (if any).
  const base = `${title}\n${dateLabel}\n${eventUrl}`;
  const full = hashtagsLine ? `${base}\n${hashtagsLine}` : base;
  const overLimit = full.length > 280;
  // If over limit, drop hashtags first; if still over, hard-truncate the title.
  const fallback = overLimit && base.length <= 280 ? base : null;
  const trimmed = fallback ?? (overLimit ? full.slice(0, 277) + "..." : full);

  async function copyText() {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(trimmed);
      toast.success("Template di-copy. Sekarang paste ke X.");
    } catch {
      toast.error("Gagal copy. Coba select manual.");
    } finally {
      setCopying(false);
    }
  }

  function openInX() {
    const url = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(trimmed);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-caption text-muted uppercase tracking-wide font-semibold">Share ke X</p>
      <pre className="whitespace-pre-wrap break-words text-body-sm text-ink bg-cream/50 border border-hairline rounded-card p-3 font-sans leading-relaxed">
        {trimmed}
      </pre>
      <p className={"text-caption " + (overLimit ? "text-amber-700" : "text-muted")}>
        {trimmed.length} / 280 char{overLimit && " · otomatis di-truncate"}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={copyText} disabled={copying}>
          Copy text
        </Button>
        <Button onClick={openInX}>Open in X</Button>
      </div>
    </div>
  );
}
