import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // Allow remote images from public book metadata APIs and our Supabase
  // storage. This is enforced by `next/image` (remote URLs must match one of
  // these patterns, otherwise Next will reject the request).
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "covers.openlibrary.org" },
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "https", hostname: "books.googleusercontent.com" },
      // Behold.so CDN for the Instagram feed strip on the landing page
      { protocol: "https", hostname: "behold.pictures" },
      { protocol: "https", hostname: "**.behold.pictures" },
      // OAuth provider avatars — Google + Discord set photo_url straight to
      // their CDNs on first signup (handled by handle_new_user trigger).
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "cdn.discordapp.com" },
      ...(supabaseHost ? [{ protocol: "https" as const, hostname: supabaseHost }] : []),
    ],
  },

  /**
   * English-first route aliases.
   *
   * Phase 1 goal: surface English URLs in the navigation while preserving
   * existing Indonesian routes (shared in chats, bookmarks, RSS feeds).
   * Rewrites mask the destination — `/library` stays as `/library` in the URL
   * bar but renders the `/shelf` page underneath. Old routes (`/shelf`,
   * `/aktivitas`, etc.) keep working directly with zero redirect overhead.
   *
   * Reminder: rewrites run AFTER middleware/proxy. proxy.ts must gate both
   * the English alias AND the underlying Indonesian path for auth — see
   * proxy.ts `isAppRoute` for the union list.
   */
  async rewrites() {
    return [
      { source: "/library", destination: "/shelf" },
      { source: "/library/:path*", destination: "/shelf/:path*" },
      { source: "/activity", destination: "/aktivitas" },
      { source: "/activity/:path*", destination: "/aktivitas/:path*" },
      { source: "/discover", destination: "/search" },
      { source: "/discover/:path*", destination: "/search/:path*" },
      { source: "/members", destination: "/anggota" },
      { source: "/members/:path*", destination: "/anggota/:path*" },
      { source: "/map", destination: "/peta" },
      { source: "/map/:path*", destination: "/peta/:path*" },
    ];
  },

  // Strict security headers. CSP allows the image hosts above + inline styles
  // for the few inline-style props we set. Tighten further once we audit.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
