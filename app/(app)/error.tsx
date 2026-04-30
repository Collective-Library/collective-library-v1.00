"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Error boundary for the auth-gated app shell. Keeps the TopBar + BottomNav
 * intact (rendered by layout above this) so users can navigate elsewhere
 * after a single page errors.
 */
export default function AppRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 text-center">
      <p className="text-caption text-muted uppercase tracking-wide font-semibold">
        Halaman ini error
      </p>
      <h1 className="mt-2 font-display text-display-lg text-ink leading-tight max-w-md">
        Ada yang gak beres di sini.
      </h1>
      <p className="mt-3 text-body text-ink-soft max-w-md">
        Coba reload, atau navigasi ke halaman lain via menu di bawah. Tim
        udah dapet notif otomatis.
      </p>
      {error.digest && (
        <p className="mt-2 text-caption text-muted font-mono">
          ID: {error.digest}
        </p>
      )}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center h-11 px-5 rounded-pill bg-ink text-parchment text-body-sm font-semibold hover:bg-ink-soft transition-colors"
        >
          Coba lagi
        </button>
        <a
          href="/shelf"
          className="inline-flex items-center justify-center h-11 px-5 rounded-pill bg-paper text-ink-soft text-body-sm font-medium border border-hairline-strong hover:bg-cream transition-colors"
        >
          Balik ke rak
        </a>
      </div>
    </div>
  );
}
