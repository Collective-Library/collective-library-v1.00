import * as Sentry from "@sentry/nextjs";

/**
 * Browser-side Sentry init. Runs once when the app boots in the browser.
 * No-op if NEXT_PUBLIC_SENTRY_DSN is unset — Sentry is free until you wire it up.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.5,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
