import {
  ShelfIcon,
  MemberIcon,
  EventIcon,
  ActivityIcon,
  MapIcon,
  WantedIcon,
  ManifestIcon,
  SpotIcon,
  ExploreIcon,
} from "@/components/layout/nav-icons";
import { HomeModuleCard } from "./HomeModuleCard";

/**
 * Live signals fed to the module grid. Each field is either a real value
 * or a sentinel `null`/`0` so the grid can show a warm empty state
 * instead of fake data. Source: `app/(app)/home/page.tsx`.
 */
export interface HomeSignals {
  /** Number of public, non-hidden books on the current user's shelf. */
  userBookCount: number;
  /** Total members in the directory (used as fallback when no `userCity`). */
  totalMembers: number;
  /** Members in the user's city (case-insensitive). `null` if no `userCity`. */
  nearbyMembersCount: number | null;
  /** Upcoming events (scheduled + not yet started). */
  upcomingEventsCount: number;
  /** Count of activities in the recent feed (used as a freshness signal). */
  activityRecentCount: number;
  /** Active + public Spots (post-RLS filter). */
  publicSpotsCount: number;
  /** Open WTB requests across the community. */
  activeWanted: number;
  /** Topic of the latest approved manifest, if any. */
  latestManifestTopic: string | null;
}

/**
 * The /home cockpit module grid. Primary row exposes Library / Members /
 * Events / Activity / Map / See More. Secondary row exposes Wanted /
 * Manifest / Spots. Map is rendered with `emphasis="feature"` so it
 * reads as the social discovery surface, not a utility.
 *
 * Mobile-first: 2-up on phones, 3-up on tablet+. Each card shows a live
 * signal where data supports it, or a warm empty-state string.
 *
 * No new analytics, no algorithmic ranking, no fake personalization.
 */
export function HomeModuleGrid({
  signals,
  userCity,
}: {
  signals: HomeSignals;
  userCity: string | null;
}) {
  const librarySignal =
    signals.userBookCount > 0
      ? `${signals.userBookCount} buku di rak lo`
      : "Tambahin buku pertama lo";

  const membersSignal =
    signals.nearbyMembersCount !== null && userCity
      ? `${signals.nearbyMembersCount} pembaca di ${userCity}`
      : `${signals.totalMembers} anggota komunitas`;

  const eventsSignal =
    signals.upcomingEventsCount > 0
      ? `${signals.upcomingEventsCount} acara mendatang`
      : "Belum ada yang dijadwalin";

  const activitySignal =
    signals.activityRecentCount > 0
      ? `${signals.activityRecentCount} sinyal terbaru`
      : "Belum ada gerakan";

  const mapSignal = userCity ? `Temuin pembaca di ${userCity}` : "Temuin pembaca di sekitar lo";

  const wantedSignal =
    signals.activeWanted > 0
      ? `${signals.activeWanted} buku lagi dicari`
      : "Belum ada permintaan terbuka";

  const manifestSignal = signals.latestManifestTopic
    ? signals.latestManifestTopic
    : "Belum ada yang nulis minggu ini";

  const spotsSignal =
    signals.publicSpotsCount > 0
      ? `${signals.publicSpotsCount} tempat aktif`
      : "Spots publik segera tayang";

  return (
    <div className="space-y-4">
      {/* Primary grid — 2 col on mobile, 3 col on tablet+. */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <HomeModuleCard
          label="My Library"
          signal={librarySignal}
          icon={ShelfIcon}
          href="/library"
        />
        <HomeModuleCard label="Members" signal={membersSignal} icon={MemberIcon} href="/members" />
        <HomeModuleCard label="Events" signal={eventsSignal} icon={EventIcon} href="/event" />
        <HomeModuleCard
          label="Activity"
          signal={activitySignal}
          icon={ActivityIcon}
          href="/activity"
        />
        <HomeModuleCard
          label="Map"
          signal={mapSignal}
          icon={MapIcon}
          href="/map"
          emphasis="feature"
          badge="People"
        />
        <HomeModuleCard
          label="See More"
          signal="Aktivitas penuh + semua surface"
          icon={ExploreIcon}
          href="/activity"
        />
      </div>

      {/* Secondary row. */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <HomeModuleCard
          label="Wanted"
          signal={wantedSignal}
          icon={WantedIcon}
          href="/wanted"
          emphasis="secondary"
        />
        <HomeModuleCard
          label="Manifest"
          signal={manifestSignal}
          icon={ManifestIcon}
          href="/manifest"
          emphasis="secondary"
        />
        <HomeModuleCard
          label="Spots"
          signal={spotsSignal}
          icon={SpotIcon}
          href="/spots"
          emphasis="secondary"
        />
      </div>
    </div>
  );
}
