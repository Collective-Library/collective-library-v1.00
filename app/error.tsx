"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Public-page error boundary. Anything inside / (about, privacy, etc.)
 * crashes here instead of taking the whole site down. Reports to Sentry
 * for triage. Reset reruns the segment.
 */
export default function GlobalRouteError({
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
    <div className="min-h-screen bg-parchment text-ink flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Aduh
        </p>
        <h1 className="mt-2 font-display text-display-lg text-ink leading-tight">
          Ada yang error.
        </h1>
        <p className="mt-3 text-body text-ink-soft">
          Sesuatu yang gak diduga terjadi. Tim udah dapet notif, sambil lo
          coba lagi tombol di bawah.
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
            href="/"
            className="inline-flex items-center justify-center h-11 px-5 rounded-pill bg-paper text-ink-soft text-body-sm font-medium border border-hairline-strong hover:bg-cream transition-colors"
          >
            Balik ke beranda
          </a>
        </div>
      </div>
    </div>
  );
}
