"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  /** Public URL to the manifest detail (for backlink in the X post). */
  manifestUrl: string;
  /** Manifest body for the X post. */
  body: string;
  /** Optional topic/hashtag suggestion. */
  topic: string | null;
  /** Whether the post is for an anonymous manifest (changes attribution copy). */
  isAnonymous: boolean;
  /** Author display name for non-anon attribution. */
  authorDisplay: string | null;
  /** Manifest id — for /api/manifest/[id]/mark-x-posted */
  manifestId: string;
  /** Existing X URL if already posted */
  initialXPostedUrl: string | null;
  /** Show admin-only "mark posted" input */
  isAdmin: boolean;
}

/**
 * Copy-paste workflow for getting a manifesto onto X (@collectivelibrary.id).
 * No Twitter/X API integration — admin manually paste-posts (Phase 1 is
 * intentionally low-tech, gated on behavior not speculation). Once posted,
 * admin pastes the X URL back here to record the backlink.
 */
export function ManifestXTemplate({
  manifestUrl,
  body,
  topic,
  isAnonymous,
  authorDisplay,
  manifestId,
  initialXPostedUrl,
  isAdmin,
}: Props) {
  const [xPostedUrl, setXPostedUrl] = useState(initialXPostedUrl ?? "");
  const [postedInput, setPostedInput] = useState(initialXPostedUrl ?? "");
  const [saving, setSaving] = useState(false);

  // Compose X-friendly text. X char limit is 280.
  // Keep body, add hashtag, then short link.
  const attribution = isAnonymous ? "" : authorDisplay ? `— ${authorDisplay}\n\n` : "";
  const hashtag = topic
    ? "\n\n#" + topic.replace(/[^a-z0-9]/gi, "")
    : "";
  const fullText = `"${body}"\n\n${attribution}${manifestUrl}${hashtag}`;
  const overLimit = fullText.length > 280;
  const trimmed = overLimit ? fullText.slice(0, 277) + "..." : fullText;

  async function copyTemplate() {
    try {
      await navigator.clipboard.writeText(trimmed);
      toast.success("Template di-copy! Sekarang paste ke X.");
    } catch {
      toast.error("Gagal copy. Coba select manual.");
    }
  }

  function openXIntent() {
    const url = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(trimmed);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function markPosted() {
    if (!postedInput.trim()) {
      toast.error("Paste URL X dulu.");
      return;
    }
    if (!/^https?:\/\/(x\.com|twitter\.com)\//.test(postedInput.trim())) {
      toast.error("URL harus dari x.com atau twitter.com.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/manifests/${manifestId}/mark-x-posted`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ x_posted_url: postedInput.trim() }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? `Gagal record X URL (HTTP ${res.status})`);
        return;
      }
      setXPostedUrl(postedInput.trim());
      toast.success("Tercatat — manifesto ada backlink ke X sekarang.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-card-lg border border-hairline bg-paper p-4 md:p-5 flex flex-col gap-4">
      <div>
        <p className="text-caption text-muted uppercase tracking-wide font-semibold mb-2">
          Share ke X
        </p>
        <p className="text-caption text-muted leading-relaxed">
          Copy template di bawah ke X account komunitas. Phase 1 manual — biar admin tetep punya kontrol editorial.
        </p>
      </div>

      <pre className="whitespace-pre-wrap break-words text-body-sm text-ink bg-cream/50 border border-hairline rounded-card p-3 font-sans leading-relaxed">
        {trimmed}
      </pre>
      <p className={"text-caption " + (overLimit ? "text-amber-700" : "text-muted")}>
        {trimmed.length} / 280 char {overLimit && "· otomatis di-truncate"}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={copyTemplate}>
          📋 Copy text
        </Button>
        <Button onClick={openXIntent}>
          𝕏 Buka di X
        </Button>
      </div>

      {isAdmin && (
        <div className="pt-3 border-t border-hairline flex flex-col gap-2">
          <p className="text-caption text-muted uppercase tracking-wide font-semibold">
            Setelah posted, record URL
          </p>
          <div className="flex gap-2">
            <Input
              type="url"
              value={postedInput}
              onChange={(e) => setPostedInput(e.target.value)}
              placeholder="https://x.com/collectivelibrary.id/status/..."
            />
            <Button variant="secondary" onClick={markPosted} disabled={saving}>
              {saving ? "..." : "Save"}
            </Button>
          </div>
          {xPostedUrl && (
            <p className="text-caption text-ink-soft">
              Tersimpan:{" "}
              <a
                href={xPostedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                {xPostedUrl}
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
