"use client";

import { useState } from "react";
import { toast } from "sonner";

/** Copy-to-clipboard button for the Signal detail page share row. */
export function CopySignalLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const liveUrl =
      typeof window !== "undefined" ? `${window.location.origin}${new URL(url).pathname}` : url;
    try {
      await navigator.clipboard.writeText(liveUrl);
      setCopied(true);
      toast.success("Link Signal tersalin ✓");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal nyalin link.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-pill
        bg-ink text-parchment text-body-sm font-medium
        hover:bg-ink-soft transition-colors"
    >
      <LinkIcon />
      {copied ? "Tersalin ✓" : "Copy Link"}
    </button>
  );
}

function LinkIcon() {
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
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
