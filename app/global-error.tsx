"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Last-resort error boundary — catches errors that escape root layout.
 * Must include its own <html> + <body> because it replaces the layout.
 *
 * Reach here = something is severely broken. Keep markup minimal so the
 * fallback itself can't crash.
 */
export default function GlobalError({
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
    <html lang="id">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#F0E8D8",
          color: "#3D2E1F",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <p
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: "#8B7355",
              fontWeight: 600,
            }}
          >
            Error fatal
          </p>
          <h1
            style={{
              marginTop: 8,
              fontSize: 36,
              fontWeight: 600,
              lineHeight: 1.1,
            }}
          >
            Aplikasi crash.
          </h1>
          <p
            style={{
              marginTop: 12,
              fontSize: 16,
              color: "#5A4632",
            }}
          >
            Sesuatu yang gak diduga bikin halaman gak bisa dirender.
          </p>
          {error.digest && (
            <p
              style={{
                marginTop: 8,
                fontSize: 12,
                fontFamily: "monospace",
                color: "#8B7355",
              }}
            >
              ID: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              padding: "12px 24px",
              borderRadius: 999,
              background: "#3D2E1F",
              color: "#F0E8D8",
              fontSize: 14,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
