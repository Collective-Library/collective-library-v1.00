"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";

/**
 * Login-nudge modal — anon visitors who try to drill into a book or member
 * card on the landing page get this invitation instead of a hard auth-wall.
 *
 * Voice: Seth-Godin-flavored. Permission marketing, tribe-over-crowd,
 * specific over generic. Warm but exclusive.
 *
 * Pattern: server `app/page.tsx` decides `isAnon = !user` and renders
 *   <LoginNudgeProvider isAnon={isAnon}>{landing}</LoginNudgeProvider>
 * Inside the strips, swap `<Link>` for `<GatedLink>` (in ./gated-link.tsx),
 * which calls `nudge()` instead of navigating when isAnon is true.
 */

interface LoginNudgeContext {
  isAnon: boolean;
  nudge: () => void;
}

const Ctx = createContext<LoginNudgeContext>({
  isAnon: false,
  nudge: () => {},
});

export function useLoginNudge(): LoginNudgeContext {
  return useContext(Ctx);
}

export function LoginNudgeProvider({
  isAnon,
  children,
}: {
  isAnon: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const nudge = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  // Esc closes
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <Ctx.Provider value={{ isAnon, nudge }}>
      {children}
      {open && <Modal onClose={close} />}
    </Ctx.Provider>
  );
}

function Modal({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus the dialog when it opens, for screen readers + keyboard
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-nudge-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
      />

      {/* Card */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-md bg-parchment rounded-card-lg shadow-card-hover border border-hairline-strong p-6 md:p-8 outline-none mb-4 sm:mb-0"
      >
        {/* Close X */}
        <button
          type="button"
          aria-label="Tutup popup"
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 inline-flex items-center justify-center rounded-pill text-muted hover:bg-cream hover:text-ink-soft transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Undangan
        </p>
        <h2
          id="login-nudge-title"
          className="mt-2 font-display text-display-md md:text-display-lg text-ink leading-tight"
          style={{ letterSpacing: "-0.4px" }}
        >
          Komunitas ini hidup dari dalam.
        </h2>
        <p className="mt-4 text-body text-ink-soft leading-relaxed">
          Buat baca lengkap detail buku atau profil anggota, gabung dulu.
          Gratis selamanya — no take-rate, no spam, no algoritma yang ngakalin
          perhatian lo.
        </p>
        <p className="mt-3 text-body-sm text-muted italic">
          Yang dicari: pembaca yang capek scroll WA grup.
        </p>

        <div className="mt-7 flex flex-col gap-2.5">
          <Link
            href="/auth/register"
            onClick={onClose}
            className="inline-flex items-center justify-center h-11 px-5 rounded-pill bg-ink text-parchment text-body-sm font-semibold hover:bg-ink-soft transition-colors"
          >
            Daftar dulu →
          </Link>
          <Link
            href="/auth/login"
            onClick={onClose}
            className="inline-flex items-center justify-center h-11 px-5 rounded-pill bg-paper text-ink-soft text-body-sm font-medium border border-hairline-strong hover:bg-cream transition-colors"
          >
            Udah punya? Masuk
          </Link>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full text-center text-caption text-muted hover:text-ink-soft underline underline-offset-4"
        >
          Lanjut ngintip dari luar
        </button>
      </div>
    </div>
  );
}
