/**
 * Returns the canonical base URL for shareable links (WhatsApp messages, OG tags, etc).
 *
 * Resolution order:
 * 1. NEXT_PUBLIC_APP_URL — set this in production for stable URLs
 * 2. VERCEL_URL (server-only, auto-injected by Vercel) — falls back to current deployment URL
 * 3. localhost:3000 — local dev
 *
 * Server-only usage (since VERCEL_URL is not exposed to client). For client, the
 * caller should pass an absolute URL or use window.location.origin.
 */
export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** Builds an absolute URL to a user's public profile, e.g. for WhatsApp prefills. */
export function profileUrl(username: string | null | undefined): string {
  if (!username) return getAppUrl();
  return `${getAppUrl()}/profile/${username}`;
}
