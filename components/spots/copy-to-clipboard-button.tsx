"use client";

import { useState } from "react";
import { toast } from "sonner";

/**
 * Small clipboard-copy button for the public Spot detail page and the admin
 * Spot edit page (Slice 5 — QR-friendly stable URL).
 *
 * `path` is a relative path like `/spots/foo`. We resolve `origin` on click
 * via `window.location.origin` so the copied URL always matches the live
 * deployment (no stale `NEXT_PUBLIC_APP_URL` issues — same pattern as
 * `ShareProfileButton`).
 */
export function CopyToClipboardButton({
  path,
  label = "Copy link",
}: {
  path: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    try {
      const url = `${window.location.origin}${path}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link disalin. Tinggal tempel ke QR generator / WhatsApp.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal copy — coba manual.");
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-live="polite"
      className="shrink-0 inline-flex items-center gap-1.5 h-auto px-3.5 bg-ink text-parchment text-body-sm font-semibold hover:bg-ink-soft transition-colors"
    >
      {copied ? (
        <>
          <CheckIcon /> Tersalin
        </>
      ) : (
        <>
          <CopyIcon /> {label}
        </>
      )}
    </button>
  );
}

function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
