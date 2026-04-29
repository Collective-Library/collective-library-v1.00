import * as Sentry from "@sentry/nextjs";

/**
 * Next.js instrumentation hook — runs once per server start.
 * Initializes Sentry for the Node.js + Edge runtimes.
 *
 * The browser-side init is in `instrumentation-client.ts`.
 *
 * Activate by setting SENTRY_DSN (and NEXT_PUBLIC_SENTRY_DSN for client) in
 * .env.local / Vercel env. With no DSN set, Sentry is a no-op (free).
 */
export async function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return; // Sentry off until DSN is configured

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      environment: process.env.VERCEL_ENV ?? "development",
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      environment: process.env.VERCEL_ENV ?? "development",
    });
  }
}

/**
 * Capture errors thrown during a server-side request render.
 * Wires server actions / RSC errors into Sentry.
 */
export const onRequestError = Sentry.captureRequestError;
