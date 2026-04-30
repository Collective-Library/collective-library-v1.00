"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Compact share button — icon-only pill, parchment-themed. Web Share API
 * on mobile (native sheet), copy + WhatsApp menu fallback on desktop.
 *
 * URL resolution: server-side prop is a fallback; we override with
 * `window.location.origin` at hydration so the button always reflects the
 * deployment the user is actually on (avoids stale NEXT_PUBLIC_APP_URL).
 */
export function ShareProfileButton({
  url: serverUrl,
  username,
  fullName,
  bookCount,
  city,
}: {
  url: string;
  username: string | null;
  fullName: string;
  bookCount: number;
  city: string;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(serverUrl);

  // Client-side override — guarantees the share URL matches the live origin.
  useEffect(() => {
    if (typeof window !== "undefined" && username) {
      setUrl(`${window.location.origin}/profile/${username}`);
    }
  }, [username]);

  const shareText = `Cek rak buku ${fullName} di Collective Library — ${bookCount} buku, ${city}.\n\n${url}`;

  async function nativeShare() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: `${fullName} · Collective Library`, text: shareText, url });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link profil tersalin ✓");
    } catch {
      toast.error("Gagal nyalin link.");
    }
  }

  function shareWhatsapp() {
    const u = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(u, "_blank", "noopener,noreferrer");
  }

  async function handleClick() {
    const usedNative = await nativeShare();
    if (!usedNative) setOpen((v) => !v);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        aria-label="Share profile"
        title="Share profile"
        className="inline-flex items-center justify-center w-10 h-10 rounded-pill bg-paper text-ink-soft border border-hairline-strong hover:bg-cream hover:text-ink transition-colors"
      >
        <ShareIcon size={18} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-card-lg bg-paper border border-hairline shadow-modal overflow-hidden z-50">
          <button
            type="button"
            onClick={() => {
              copyLink();
              setOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 text-body-sm text-ink hover:bg-cream"
          >
            Copy link
          </button>
          <button
            type="button"
            onClick={() => {
              shareWhatsapp();
              setOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 text-body-sm text-ink hover:bg-cream border-t border-hairline-soft"
          >
            Share via WhatsApp
          </button>
        </div>
      )}
    </div>
  );
}

function ShareIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
