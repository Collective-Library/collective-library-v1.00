import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/url";

/**
 * Sitemap — public surfaces only. Auth-gated routes (/shelf, /book/[id],
 * /profile/[username], /anggota, /aktivitas, /peta) intentionally excluded
 * because anon visitors hit /auth/login on those. If we ever make book or
 * profile detail public-readable, fold them in.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getAppUrl();
  const now = new Date();

  // Static public routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/auth/register`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${base}/auth/login`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/feed.xml`, lastModified: now, changeFrequency: "daily", priority: 0.5 },
    { url: `${base}/feed.json`, lastModified: now, changeFrequency: "daily", priority: 0.5 },
  ];

  // Public-opted member profiles (show_on_map=true). Their pages are still
  // auth-gated for now, but the URLs exist + we'll likely flip to public
  // detail soon — registering them ensures discovery is ready.
  try {
    const supabase = await createClient();
    const { data: members } = await supabase
      .from("profiles_public")
      .select("username, updated_at")
      .eq("show_on_map", true)
      .not("username", "is", null)
      .limit(500);

    const memberRoutes: MetadataRoute.Sitemap =
      (members ?? []).map((m) => ({
        url: `${base}/profile/${m.username as string}`,
        lastModified: m.updated_at ? new Date(m.updated_at as string) : now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));

    return [...staticRoutes, ...memberRoutes];
  } catch (err) {
    console.error("[sitemap] member fetch failed", err);
    return staticRoutes;
  }
}
