/**
 * Single source of truth for navigation. Consumed by DesktopNav,
 * HamburgerMenu, BottomNav, AvatarMenu, and ExploreDropdown.
 *
 * Slice 2 of the ecosystem alignment initiative — see
 * `docs/audits/nav-audit.md` for the full design rationale.
 *
 * Important:
 * - `/home` is NOT in this file yet. It lands in Slice 3A together with
 *   the `/home` route itself.
 * - English-first hrefs (`/library`, `/activity`, `/members`, `/map`,
 *   `/discover`) are preferred — they go through one-way rewrites in
 *   `next.config.ts` so the legacy Indonesian URLs still resolve directly.
 * - Active-state matchers cover BOTH the English alias AND the legacy
 *   Indonesian path so highlighting works regardless of which URL the
 *   user lands on.
 */

import type { ComponentType } from "react";
import {
  type NavIconProps,
  HomeIcon,
  ShelfIcon,
  ActivityIcon,
  EventIcon,
  MemberIcon,
  ManifestIcon,
  MapIcon,
  SpotIcon,
  WantedIcon,
  SearchIcon,
  AddIcon,
  FeedbackIcon,
  MastermindIcon,
  MarketIcon,
} from "./nav-icons";

type Icon = ComponentType<NavIconProps>;
export type NavMatch = (pathname: string) => boolean;

export interface NavSurface {
  /** Stable key — used as React key and for analytics. */
  id: string;
  /** English-first short label. */
  label: string;
  /** Optional Indonesian subcopy (used by HamburgerMenu and ExploreDropdown). */
  description?: string;
  /** Canonical href. Prefer the English alias where it exists. */
  href: string;
  /** Icon component from `./nav-icons`. */
  icon: Icon;
  /** Pathname matcher for active-state highlight. */
  match: NavMatch;
}

export interface HamburgerItem extends NavSurface {
  /** Visual "Soon" pill, non-clickable. */
  comingSoon?: boolean;
}

export interface HamburgerGroup {
  id: string;
  label: string;
  /** Only visible to `profile.is_admin === true`. */
  adminOnly?: boolean;
  items: HamburgerItem[];
}

export interface BottomNavItem extends NavSurface {
  /** Center-CTA styling (ink-bg pill). Only `Add` uses this today. */
  prominent?: boolean;
}

// ─────────────────────────── Matchers ───────────────────────────
// Each matcher covers both the English alias and the Indonesian legacy
// path. Keep them as standalone helpers so consumers can reuse them
// without going through the full NAV_ITEMS list.

export const matchers = {
  home: (p: string) => p === "/home" || p.startsWith("/home/"),
  library: (p: string) =>
    p === "/" ||
    p === "/library" ||
    p.startsWith("/library/") ||
    p === "/shelf" ||
    p.startsWith("/shelf/") ||
    p.startsWith("/book/"),
  activity: (p: string) => p.startsWith("/activity") || p.startsWith("/aktivitas"),
  events: (p: string) => p.startsWith("/event"),
  members: (p: string) => p.startsWith("/members") || p.startsWith("/anggota"),
  // Carve-out: /admin/manifests should NOT highlight the user-facing
  // Manifest item (that's the moderation route, separate surface).
  manifest: (p: string) => p.startsWith("/manifest") && !p.startsWith("/admin/manifests"),
  wanted: (p: string) => p.startsWith("/wanted"),
  discover: (p: string) => p.startsWith("/discover") || p.startsWith("/search"),
  map: (p: string) => p.startsWith("/map") || p.startsWith("/peta"),
  spots: (p: string) => p === "/spots" || p.startsWith("/spots/"),
  feedback: (p: string) => p === "/feedback" || p.startsWith("/feedback/"),
  mastermind: (p: string) => p.startsWith("/mastermind"),
  adminFeedback: (p: string) => p.startsWith("/admin/feedback"),
  adminManifests: (p: string) => p.startsWith("/admin/manifests"),
  addBook: (p: string) => p.startsWith("/book/add"),
} as const;

// ──────────────────── Desktop primary nav (lg+) ────────────────────
// 5 surfaces total: Library, Activity, Events, Members, plus the
// Explore dropdown (rendered separately so the dropdown can manage
// its own open state).

export const desktopPrimaryNav: NavSurface[] = [
  { id: "d-home", label: "Home", href: "/home", icon: HomeIcon, match: matchers.home },
  { id: "d-library", label: "Library", href: "/library", icon: ShelfIcon, match: matchers.library },
  {
    id: "d-activity",
    label: "Activity",
    href: "/activity",
    icon: ActivityIcon,
    match: matchers.activity,
  },
  { id: "d-events", label: "Events", href: "/event", icon: EventIcon, match: matchers.events },
  {
    id: "d-members",
    label: "Members",
    href: "/members",
    icon: MemberIcon,
    match: matchers.members,
  },
];

// ──────────────── Explore dropdown (lg+, secondary) ────────────────
// Surfaces that don't earn a top-level pill but need desktop
// discoverability. Pre-Slice 2, Map and Spots had no entry point
// on lg+ at all (they were only in the hamburger which is hidden
// on lg+).

export const exploreDropdownItems: NavSurface[] = [
  {
    id: "e-discover",
    label: "Discover",
    description: "Cari judul, author, atau owner",
    href: "/discover",
    icon: SearchIcon,
    match: matchers.discover,
  },
  {
    id: "e-wanted",
    label: "Wanted",
    description: "Lagi nyari buku tertentu?",
    href: "/wanted",
    icon: WantedIcon,
    match: matchers.wanted,
  },
  {
    id: "e-manifest",
    label: "Manifest",
    description: "Pemikiran pendek dari pembaca",
    href: "/manifest",
    icon: ManifestIcon,
    match: matchers.manifest,
  },
  {
    id: "e-map",
    label: "Map",
    description: "Anggota komunitas di peta",
    href: "/map",
    icon: MapIcon,
    match: matchers.map,
  },
  {
    id: "e-spots",
    label: "Spots",
    description: "Cafe · rak buku publik · ruang komunitas",
    href: "/spots",
    icon: SpotIcon,
    match: matchers.spots,
  },
  {
    id: "e-feedback",
    label: "Feedback",
    description: "Cerita ke kita",
    href: "/feedback",
    icon: FeedbackIcon,
    match: matchers.feedback,
  },
];

/**
 * Any explore item active → the Explore button itself should highlight.
 * Used by ExploreDropdown to set its trigger's active state.
 */
export function isExploreActive(pathname: string): boolean {
  return exploreDropdownItems.some((item) => item.match(pathname));
}

// ──────────────────────── Hamburger (md-) ────────────────────────
// Five groups. Library / Activity / Community / Explore are visible
// to everyone; Builder is admin-only.

export const hamburgerGroups: HamburgerGroup[] = [
  {
    id: "h-library",
    label: "Library",
    items: [
      {
        id: "h-library-shelf",
        label: "My Library",
        description: "Buku-buku komunitas",
        href: "/library",
        icon: ShelfIcon,
        match: matchers.library,
      },
      {
        id: "h-library-discover",
        label: "Discover",
        description: "Cari judul, author, atau owner",
        href: "/discover",
        icon: SearchIcon,
        match: matchers.discover,
      },
      {
        id: "h-library-wanted",
        label: "Wanted",
        description: "Lagi nyari buku tertentu?",
        href: "/wanted",
        icon: WantedIcon,
        match: matchers.wanted,
      },
      {
        id: "h-library-market",
        label: "Marketplace",
        description: "Jual · sewa · titip · tukar",
        href: "#",
        icon: MarketIcon,
        match: () => false,
        comingSoon: true,
      },
    ],
  },
  {
    id: "h-activity",
    label: "Activity",
    items: [
      {
        id: "h-activity-feed",
        label: "Activity Feed",
        description: "Yang lagi terjadi di komunitas",
        href: "/activity",
        icon: ActivityIcon,
        match: matchers.activity,
      },
      {
        id: "h-activity-events",
        label: "Events",
        description: "Diskusi · kopdar · workshop",
        href: "/event",
        icon: EventIcon,
        match: matchers.events,
      },
      {
        id: "h-activity-manifest",
        label: "Manifest",
        description: "Pemikiran pendek dari pembaca",
        href: "/manifest",
        icon: ManifestIcon,
        match: matchers.manifest,
      },
    ],
  },
  {
    id: "h-community",
    label: "Community",
    items: [
      {
        id: "h-community-members",
        label: "Members",
        description: "Orang-orang yang baca bareng",
        href: "/members",
        icon: MemberIcon,
        match: matchers.members,
      },
      {
        id: "h-community-feedback",
        label: "Feedback",
        description: "Cerita ke kita",
        href: "/feedback",
        icon: FeedbackIcon,
        match: matchers.feedback,
      },
    ],
  },
  {
    id: "h-explore",
    label: "Explore",
    items: [
      {
        id: "h-explore-map",
        label: "Map",
        description: "Anggota komunitas di peta",
        href: "/map",
        icon: MapIcon,
        match: matchers.map,
      },
      {
        id: "h-explore-spots",
        label: "Spots",
        description: "Cafe · rak buku publik · ruang komunitas",
        href: "/spots",
        icon: SpotIcon,
        match: matchers.spots,
      },
    ],
  },
  {
    id: "h-builder",
    label: "Builder",
    adminOnly: true,
    items: [
      {
        id: "h-builder-mastermind",
        label: "Mastermind cockpit",
        description: "OKR · pulse · intelligence",
        href: "/mastermind",
        icon: MastermindIcon,
        match: matchers.mastermind,
      },
      {
        id: "h-builder-feedback",
        label: "Feedback inbox",
        description: "Triage user feedback",
        href: "/admin/feedback",
        icon: FeedbackIcon,
        match: matchers.adminFeedback,
      },
      {
        id: "h-builder-manifests",
        label: "Manifest moderation",
        description: "Review pending manifestos",
        href: "/admin/manifests",
        icon: ManifestIcon,
        match: matchers.adminManifests,
      },
    ],
  },
];

// ──────────────────────── BottomNav (md-) ────────────────────────
// Slice 3A final shape: Home / Library / Add / Activity. Profile is the
// fifth slot rendered inline in BottomNav because its href is dynamic
// (depends on `profile.username`).
//
// Events drops out of BottomNav with Slice 3A — still reachable via
// DesktopNav, HamburgerMenu (Activity group), AvatarMenu, and the
// /home Events card.

export const bottomNavItems: BottomNavItem[] = [
  { id: "b-home", label: "Home", href: "/home", icon: HomeIcon, match: matchers.home },
  { id: "b-library", label: "Library", href: "/library", icon: ShelfIcon, match: matchers.library },
  {
    id: "b-add",
    label: "Add",
    href: "/book/add",
    icon: AddIcon,
    match: matchers.addBook,
    prominent: true,
  },
  {
    id: "b-activity",
    label: "Activity",
    href: "/activity",
    icon: ActivityIcon,
    match: matchers.activity,
  },
];

// ──────────────────────── AvatarMenu ────────────────────────
// The main nav-link section that sits beneath the user header.
// Inline items (View profile dynamic href, Edit profile, Quick add
// multiple, Goodreads import, My feedback, Sign out) stay hardcoded
// in AvatarMenu because they have unique behaviors.

// Feedback F17: the profile dropdown overflowed on mobile and buried Sign out.
// Activity / Members / Events / Manifest are all reachable from the persistent
// nav (DesktopNav + ExploreDropdown on lg; BottomNav + HamburgerMenu on md-),
// so they're dropped here. "Add book" stays — it has no other persistent
// desktop entry point. AvatarMenu also gains a max-height + scroll for safety.
export const avatarMenuNavItems: NavSurface[] = [
  { id: "a-addbook", label: "Add book", href: "/book/add", icon: AddIcon, match: matchers.addBook },
];

/**
 * AvatarMenu admin items. Mastermind keeps its prominent ink-bg styling
 * inline in the component (special visual treatment). The other two are
 * rendered as standard rows.
 */
export const avatarMenuAdminItems: NavSurface[] = [
  {
    id: "a-admin-feedback",
    label: "Feedback inbox",
    href: "/admin/feedback",
    icon: FeedbackIcon,
    match: matchers.adminFeedback,
  },
  {
    id: "a-admin-manifests",
    label: "Manifest moderation",
    href: "/admin/manifests",
    icon: ManifestIcon,
    match: matchers.adminManifests,
  },
];
