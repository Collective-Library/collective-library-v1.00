"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import type { FeedbackCategory } from "@/types";

/**
 * Floating "Cerita ke kita" chip — always-there but never-intrusive. Lives
 * fixed in the corner across every page. Click → modal form. No timed
 * popups, no auto-triggers. Permission marketing > interruption marketing.
 *
 * On mobile we move it slightly higher to avoid covering the BottomNav.
 */
export function FeedbackChip() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Hide on /admin and /mastermind (admins triage there, don't want their
  // own chip noise) + hide on auth pages (less noise during a moment we
  // want them focused).
  const hidden =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/mastermind") ||
    pathname?.startsWith("/auth/callback") ||
    pathname === "/auth/logout";

  if (hidden) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Kasih masukan"
        title="Cerita ke kita"
        className="fixed bottom-20 md:bottom-5 right-4 md:right-5 z-30 inline-flex items-center justify-center w-11 h-11 sm:w-auto sm:px-4 sm:gap-2 rounded-pill bg-ink text-parchment text-body-sm font-semibold shadow-card-hover hover:bg-ink-soft transition-colors"
      >
        <ChatIcon />
        <span className="hidden sm:inline">Cerita ke kita</span>
      </button>
      {open && <FeedbackModal onClose={() => setOpen(false)} />}
    </>
  );
}

const CATEGORIES: { slug: FeedbackCategory; label: string; emoji: string; hint: string }[] = [
  {
    slug: "idea",
    label: "Ide / fitur",
    emoji: "💡",
    hint: "Sesuatu yang lo bayangin keren ada di sini.",
  },
  {
    slug: "bug",
    label: "Bug / error",
    emoji: "🐛",
    hint: "Ada yang error, ngeselin, atau gak jalan.",
  },
  {
    slug: "friction",
    label: "Friksi / susah",
    emoji: "😕",
    hint: "Sesuatu yang harusnya gampang tapi ribet.",
  },
  {
    slug: "appreciation",
    label: "Apresiasi",
    emoji: "❤️",
    hint: "Yang udah keren, biar tau apa yang harus dijaga.",
  },
  { slug: "other", label: "Lain-lain", emoji: "✋", hint: "Apapun yang gak masuk kategori atas." },
];

function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [category, setCategory] = useState<FeedbackCategory>("idea");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Esc closes
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (message.trim().length < 3) {
      setError("Pesan minimal 3 karakter.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          message: message.trim(),
          attachments: attachments.trim() || null,
          page_url:
            typeof window !== "undefined"
              ? window.location.pathname + window.location.search
              : null,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Gagal kirim — coba lagi.");
      }
      toast.success("Masukan tersampaikan. Makasih ✓", { duration: 4000 });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const activeCategory = CATEGORIES.find((c) => c.slug === category);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4"
    >
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-md bg-parchment rounded-card-lg shadow-card-hover border border-hairline-strong p-6 md:p-8 mb-4 sm:mb-0">
        <button
          type="button"
          aria-label="Tutup"
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 inline-flex items-center justify-center rounded-pill text-muted hover:bg-cream hover:text-ink-soft transition-colors"
        >
          <CloseIcon />
        </button>

        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Kasih masukan
        </p>
        <h2
          id="feedback-title"
          className="mt-2 font-display text-display-md text-ink leading-tight"
        >
          Cerita ke kita.
        </h2>
        <p className="mt-3 text-body-sm text-ink-soft leading-relaxed">
          Apapun — ide gila, bug ngeselin, friksi kecil, atau apresiasi yang bikin lo balik. Kita
          baca semua. Gak janjiin instant balik, tapi setiap masukan masuk backlog product.
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          {/* Category radio cards */}
          <div className="flex flex-col gap-2">
            <p className="text-caption font-medium text-ink-soft">Kategori</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {CATEGORIES.map((c) => {
                const active = category === c.slug;
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => setCategory(c.slug)}
                    className={
                      "inline-flex items-center justify-center gap-1 h-9 px-2 rounded-pill text-caption font-medium transition-colors " +
                      (active
                        ? "bg-ink text-parchment border border-ink"
                        : "bg-paper text-ink-soft border border-hairline hover:bg-cream")
                    }
                    aria-pressed={active}
                  >
                    <span aria-hidden>{c.emoji}</span>
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
            {activeCategory && (
              <p className="text-caption text-muted -mt-1">{activeCategory.hint}</p>
            )}
          </div>

          {/* Message */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fb-msg" className="text-caption font-medium text-ink-soft">
              Pesan lo
            </label>
            <textarea
              id="fb-msg"
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder="Tulis sebebasnya. Spesifik > umum. Cerita pengalaman > kasih solusi."
              className="w-full px-3.5 py-3 bg-paper text-ink rounded-button border border-hairline-strong focus:outline-none focus:border-ink focus:border-2 focus:px-[13px] focus:py-[11px] transition-colors resize-y"
            />
            <p className="text-caption text-muted text-right">{message.length}/2000</p>
          </div>

          {/* Attachments (optional) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fb-attachments" className="text-caption font-medium text-ink-soft">
              Link Lampiran <span className="text-muted">(opsional)</span>
            </label>
            <textarea
              id="fb-attachments"
              value={attachments}
              onChange={(e) => setAttachments(e.target.value)}
              rows={2}
              placeholder="https://...&#10;https://..."
              className="w-full px-3.5 py-2 bg-paper text-ink rounded-button border border-hairline-strong focus:outline-none focus:border-ink text-body-sm transition-colors resize-none"
            />
            <p className="text-[10px] text-muted italic">
              Pisahin pake baris baru kalau lebih dari satu.
            </p>
          </div>

          {error && <p className="text-caption text-(--color-error)">{error}</p>}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center h-11 px-5 rounded-pill bg-paper text-ink-soft text-body-sm font-medium border border-hairline-strong hover:bg-cream transition-colors"
            >
              Tutup
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center h-11 px-5 rounded-pill bg-ink text-parchment text-body-sm font-semibold hover:bg-ink-soft transition-colors disabled:opacity-50"
            >
              {submitting ? "Mengirim…" : "Kirim →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChatIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
