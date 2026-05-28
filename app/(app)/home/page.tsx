import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listActivity } from "@/lib/activity";
import { getCommunityStats } from "@/lib/stats";
import { getUpcomingEvents } from "@/lib/events";
import { getRecentManifests } from "@/lib/manifests";
import { listPublicSpots } from "@/lib/spots";
import { HomeGreeting } from "@/components/home/HomeGreeting";
import { HomeModuleGrid, type HomeSignals } from "@/components/home/HomeModuleGrid";
import { HomeActivityPreview } from "@/components/home/HomeActivityPreview";

export const metadata: Metadata = {
  title: "Home — Collective Library",
  description: "Today in your knowledge network.",
};

/**
 * /home — authenticated ecosystem cockpit.
 *
 * Per Slice 3A scope: shows live signals for every major surface
 * (Library, Members, Events, Activity, Map, Wanted, Manifest, Spots)
 * via the existing lib helpers. No new analytics helpers, no DB
 * migrations, no fake personalization, no redirect changes.
 *
 * The auth gate runs in `app/(app)/layout.tsx`; this page guarantees
 * a non-null profile via that gate. The defensive `if (!profile)`
 * narrows the type so TypeScript is happy and a layout regression
 * would surface as a redirect, not a crash.
 */
export default async function HomePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/login?next=/home");

  const supabase = await createClient();
  const userCity = profile.city?.trim() || null;

  // Parallel-fetch every signal + the two tiny user-scoped count queries
  // inline. Anything that's not easy from existing helpers becomes a warm
  // empty state in HomeModuleGrid — never fake data.
  const [
    stats,
    upcomingEvents,
    activity,
    recentManifests,
    publicSpots,
    userBookCountRes,
    nearbyMembersCountRes,
  ] = await Promise.all([
    getCommunityStats(),
    getUpcomingEvents(6),
    listActivity(6),
    getRecentManifests(1),
    listPublicSpots(),
    supabase
      .from("books")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", profile.id)
      .eq("is_hidden", false),
    userCity
      ? supabase
          .from("profiles_public")
          .select("*", { count: "exact", head: true })
          .ilike("city", userCity)
          .not("username", "is", null)
      : Promise.resolve({ count: null as number | null }),
  ]);

  const latest = recentManifests[0] ?? null;
  const latestManifestTopic = latest
    ? latest.topic?.trim() || latest.body.trim().slice(0, 60) || null
    : null;

  const signals: HomeSignals = {
    userBookCount: userBookCountRes.count ?? 0,
    totalMembers: stats.total_members,
    nearbyMembersCount: nearbyMembersCountRes.count ?? null,
    upcomingEventsCount: upcomingEvents.length,
    activityRecentCount: activity.length,
    publicSpotsCount: publicSpots.length,
    activeWanted: stats.active_wanted,
    latestManifestTopic,
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-4">
      <HomeGreeting profile={profile} />
      <HomeModuleGrid signals={signals} userCity={userCity} />
      <HomeActivityPreview items={activity} />
      <ContributionCTA />
    </div>
  );
}

/**
 * Closing CTA. Inline rather than its own component — it's only used here
 * and has no internal state.
 */
function ContributionCTA() {
  return (
    <section className="rounded-card-lg border border-hairline bg-paper p-5 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="font-display text-title-lg text-ink leading-tight">Mau nambah sinyal?</h2>
          <p className="text-caption text-ink-soft">
            Satu kontribusi kecil bikin network ini makin hidup.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/book/add"
            className="inline-flex items-center h-9 px-4 rounded-pill bg-ink text-parchment text-body-sm font-medium hover:bg-ink-soft transition-colors"
          >
            + Tambah buku
          </Link>
          <Link
            href="/wanted/add"
            className="inline-flex items-center h-9 px-4 rounded-pill bg-cream text-ink text-body-sm font-medium hover:bg-cream/70 transition-colors"
          >
            Cari buku
          </Link>
          <Link
            href="/event"
            className="inline-flex items-center h-9 px-4 rounded-pill bg-cream text-ink text-body-sm font-medium hover:bg-cream/70 transition-colors"
          >
            RSVP event
          </Link>
          <Link
            href="/manifest/new"
            className="inline-flex items-center h-9 px-4 rounded-pill bg-cream text-ink text-body-sm font-medium hover:bg-cream/70 transition-colors"
          >
            Tulis manifest
          </Link>
        </div>
      </div>
    </section>
  );
}
