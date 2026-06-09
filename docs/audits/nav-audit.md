# Navigation Audit — Slice 1.5

> Read-only audit. No code changes in this slice. Output drives Slice 2 (shared `nav-config.ts` + nav alignment) and Slice 3A (`/home` cockpit).

**Scope.** All navigation-rendering surfaces: `TopBar`, `DesktopNav`, `HamburgerMenu`, `BottomNav`, `AvatarMenu`, plus their orchestrator `PageShell` and `app/(app)/layout.tsx`. Cross-checked against `proxy.ts` (auth route gating) and `next.config.ts` rewrites.

**Audited files.**

- `components/layout/top-bar.tsx`
- `components/layout/desktop-nav.tsx`
- `components/layout/hamburger-menu.tsx`
- `components/layout/bottom-nav.tsx`
- `components/layout/avatar-menu.tsx`
- `components/layout/page-shell.tsx`
- `app/(app)/layout.tsx`
- `proxy.ts`
- `next.config.ts`

---

## 1. Route inventory

### Public routes

| Route                                                             | Status | Notes                                                                                                                                                                 |
| ----------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                                               | Live   | Public landing (RecentBooksStrip + UpcomingEventsStrip + RecentManifestsStrip + ActivityFeed widget + RecentMembersStrip + RecentInstagramStrip + founder narrative). |
| `/about`                                                          | Live   | Static page.                                                                                                                                                          |
| `/privacy`                                                        | Live   | Static page.                                                                                                                                                          |
| `/profile/[username]`                                             | Live   | Outside `(app)` group — publicly readable; slim custom layout.                                                                                                        |
| `/auth/login`, `/auth/register`, `/auth/callback`, `/auth/logout` | Live   | hCaptcha-gated, Google + Discord + email.                                                                                                                             |
| `/onboarding`                                                     | Live   | 3-step profile completion. Auth-required (via `proxy.ts`).                                                                                                            |
| `/feed.xml`, `/feed.json`                                         | Live   | RSS 2.0 + JSON Feed 1.1 for the activity log.                                                                                                                         |
| `/spots`                                                          | Live   | Public spots list (search + type + city filters).                                                                                                                     |
| `/spots/[slug]`                                                   | Live   | Public spot detail.                                                                                                                                                   |

### Auth-gated routes under `(app)/`

| Route                                                                          | Status                 | Notes                                                                                                                                                 |
| ------------------------------------------------------------------------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/home`                                                                        | **Planned (Slice 3A)** | Not present yet. Will live at `app/(app)/home/page.tsx`.                                                                                              |
| `/shelf`                                                                       | Live                   | Canonical books surface. Also accessible via `/library` rewrite. Page 1 currently injects Events strip + Activity widget (to be cleaned in Slice 3B). |
| `/library`                                                                     | Live                   | Legacy alias — one-way rewrite to `/shelf` (`next.config.ts:42`).                                                                                     |
| `/aktivitas`                                                                   | Live                   | Activity feed (50 items, day-bucketed, interest filter).                                                                                              |
| `/activity`                                                                    | Live                   | Legacy alias — one-way rewrite to `/aktivitas` (`next.config.ts:44`).                                                                                 |
| `/anggota`                                                                     | Live                   | Member directory, 4-tier filter (city → kecamatan → interest → intent).                                                                               |
| `/members`                                                                     | Live                   | Legacy alias — rewrite to `/anggota`.                                                                                                                 |
| `/search`                                                                      | Live                   | Book + owner search.                                                                                                                                  |
| `/discover`                                                                    | Live                   | Legacy alias — rewrite to `/search`.                                                                                                                  |
| `/peta`                                                                        | Live                   | Community map (Leaflet, opt-in pins).                                                                                                                 |
| `/map`                                                                         | Live                   | Legacy alias — rewrite to `/peta`.                                                                                                                    |
| `/wanted`, `/wanted/add`                                                       | Live                   | Wanted requests (buy-only).                                                                                                                           |
| `/event`, `/event/new`, `/event/[id]`, `/event/[id]/edit`                      | Live                   | Events.                                                                                                                                               |
| `/manifest`, `/manifest/new`, `/manifest/[id]`                                 | Live                   | Manifests (pending-by-default approval).                                                                                                              |
| `/book/add`, `/book/add/bulk`, `/book/import`, `/book/[id]`, `/book/[id]/edit` | Live                   | Book CRUD.                                                                                                                                            |
| `/feedback`, `/feedback/`                                                      | Live                   | User's own feedback dashboard (PR #37).                                                                                                               |
| `/profile/edit`                                                                | Live                   | Auth-user profile editor.                                                                                                                             |

### Admin routes

| Route                                                                                                 | Status       | Notes                                                                           |
| ----------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------- |
| `/admin/feedback`                                                                                     | Live         | Triage UI for the `feedback` table. `is_admin` gate via `app/admin/layout.tsx`. |
| `/admin/manifests`                                                                                    | Live         | Manifest approval/rejection moderation.                                         |
| `/mastermind`                                                                                         | Live         | Founder cockpit — Mission Control.                                              |
| `/mastermind/okrs`                                                                                    | Live         | OKR Control Tower.                                                              |
| `/mastermind/team`                                                                                    | Live         | Team & Task Tracker.                                                            |
| `/mastermind/users`                                                                                   | Live         | User intelligence.                                                              |
| `/mastermind/books`                                                                                   | Live         | Book intelligence + data health.                                                |
| `/mastermind/requests`                                                                                | Live         | Wanted admin.                                                                   |
| `/mastermind/community`                                                                               | Live         | Community intelligence (top contributors, areas, interests).                    |
| `/mastermind/data-health`                                                                             | Live         | Orphan detection + repair suggestions.                                          |
| `/mastermind/spots`, `/mastermind/spots/new`, `/mastermind/spots/[id]`, `/mastermind/spots/[id]/edit` | Live         | Spots curation (service-role gated).                                            |
| `/mastermind/events`, `/mastermind/decisions`, `/mastermind/product-lab`, `/mastermind/loans`         | Empty shells | Phase-2 instrumentation pending — labeled "instrumentation needed."             |

### Rewrite map (`next.config.ts:40–53`)

One-way only — English alias renders the Indonesian destination silently. Old Indonesian URLs continue to resolve directly with zero redirect overhead.

| Source (alias) | Destination (canonical) |
| -------------- | ----------------------- |
| `/library`     | `/shelf`                |
| `/activity`    | `/aktivitas`            |
| `/discover`    | `/search`               |
| `/members`     | `/anggota`              |
| `/map`         | `/peta`                 |

---

## 2. Navigation coverage matrix

Marks: **Direct** (top-level link), **Grouped** (inside a hamburger or dropdown group), **Admin only**, **Missing**, **Planned**, **Legacy alias only**, **Coming soon** (visually shown but non-clickable).

| Route / Surface             | DesktopNav (lg+)     | HamburgerMenu (md-)           | BottomNav (md-)                                 | AvatarMenu                       | Public Landing       | Notes                                                                                                |
| --------------------------- | -------------------- | ----------------------------- | ----------------------------------------------- | -------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------- |
| `/home`                     | Missing (planned 3A) | Missing (planned 3A)          | Missing (planned 3A)                            | Missing (planned 3A)             | n/a                  | Doesn't exist yet.                                                                                   |
| `/library` (`/shelf`)       | Direct               | Grouped (Library group)       | Direct (tab 1)                                  | Missing                          | n/a                  | Logo links here (`top-bar.tsx:20`). Active-state matchers vary across components — see §4.           |
| `/activity` (`/aktivitas`)  | Direct               | Grouped (Activity group)      | Direct (tab 2)                                  | Direct                           | n/a                  | Three independent matchers.                                                                          |
| `/wanted`                   | Direct               | Grouped (Library group)       | Direct (tab 4)                                  | Missing                          | n/a                  | Highest desktop-nav representation today.                                                            |
| `/discover` (`/search`)     | Missing              | Grouped (Library group)       | Missing (search-icon shortcut in TopBar on md-) | Missing                          | n/a                  | On lg+ accessible via `TopBarSearch`. On md- via the search icon in TopBar (`top-bar.tsx:39`).       |
| `/event`                    | Missing              | Grouped (Activity group)      | Missing                                         | Direct                           | UpcomingEventsStrip  | Major coverage gap on desktop (lg+ has no Events link in primary nav).                               |
| `/manifest`                 | Missing              | Grouped (Activity group)      | Missing                                         | Direct                           | RecentManifestsStrip | Same coverage gap.                                                                                   |
| `/members` (`/anggota`)     | Missing              | Grouped (Community group)     | Missing                                         | Direct                           | RecentMembersStrip   | Same coverage gap.                                                                                   |
| `/map` (`/peta`)            | Missing              | Grouped (Explore group)       | Missing                                         | Missing                          | n/a                  | **Not in AvatarMenu either.** On lg+, Map has no discoverable entry point unless user knows the URL. |
| `/spots`                    | Missing              | Grouped (Explore group)       | Missing                                         | Missing                          | n/a                  | **Same — not in AvatarMenu.** Public route but desktop discoverability gap.                          |
| `/feedback` (user's own)    | Missing              | Grouped (Community group)     | Missing                                         | Direct (under "My feedback")     | n/a                  | Floating `<FeedbackChip>` exists app-wide as the submission entry point.                             |
| `/profile/[username]` (own) | Missing              | Missing                       | Direct (tab 5)                                  | Direct ("View profile")          | n/a                  | Bottom-nav fallback is `/profile/edit` if username is null.                                          |
| `/profile/edit`             | Missing              | Missing                       | Direct (when username null)                     | Direct ("Edit profile")          | n/a                  |                                                                                                      |
| `/book/add`                 | Missing              | Missing                       | Direct (tab 3, prominent center)                | Direct                           | n/a                  | Prominent ink-bg pill in BottomNav.                                                                  |
| `/book/add/bulk`            | Missing              | Missing                       | Missing                                         | Direct ("Quick add (multiple)")  | n/a                  | AvatarMenu-only.                                                                                     |
| `/book/import`              | Missing              | Missing                       | Missing                                         | Direct ("Import from Goodreads") | n/a                  | AvatarMenu-only.                                                                                     |
| `/mastermind`               | Missing              | Grouped (Builder, admin-only) | Missing                                         | Direct (admin badge pill)        | n/a                  | Visually emphasized in AvatarMenu for admins.                                                        |
| `/admin/feedback`           | Missing              | Grouped (Builder, admin-only) | Missing                                         | Direct (admin only)              | n/a                  |                                                                                                      |
| `/admin/manifests`          | Missing              | Grouped (Builder, admin-only) | Missing                                         | Missing                          | n/a                  | Not in AvatarMenu (gap — admins likely click through `/manifest` or hamburger).                      |
| Marketplace                 | n/a                  | Coming soon (Library group)   | Missing                                         | Missing                          | n/a                  | Visually muted, non-clickable. Doubles as a soft roadmap signal.                                     |

### Surface coverage gaps (lg+ desktop)

This is the most important finding. **On desktop (lg+), `HamburgerMenu` is hidden** (`top-bar.tsx:15`, `<div className="lg:hidden">`). DesktopNav has only 3 items. The result:

| Surface             | Discoverable on lg+?                                                   |
| ------------------- | ---------------------------------------------------------------------- |
| Library             | Yes (DesktopNav)                                                       |
| Activity            | Yes (DesktopNav, AvatarMenu)                                           |
| Wanted              | Yes (DesktopNav)                                                       |
| Events              | Only via AvatarMenu dropdown                                           |
| Members             | Only via AvatarMenu dropdown                                           |
| Manifest            | Only via AvatarMenu dropdown                                           |
| **Map**             | **No discoverable entry point** (not in DesktopNav, not in AvatarMenu) |
| **Spots**           | **No discoverable entry point** (same)                                 |
| **Discover/Search** | Only via `TopBarSearch` (input box, not a labeled link)                |
| Feedback (own)      | Only via AvatarMenu dropdown                                           |

**Six of ~10 user-facing surfaces are either hidden in a dropdown or completely undiscoverable on desktop.** This is the primary problem Slice 2 must solve.

### Surface coverage gaps (md- mobile)

Mobile is healthier — hamburger covers everything. But BottomNav (5 tabs) only directly surfaces 4 routes (Library, Activity, Add, Wanted) + Profile. Events, Manifest, Map, Spots, Members all require opening the hamburger drawer.

---

## 3. Duplication audit

### Duplicated icon SVGs

| Icon                   | DesktopNav                | BottomNav                | HamburgerMenu                                          | AvatarMenu                               |
| ---------------------- | ------------------------- | ------------------------ | ------------------------------------------------------ | ---------------------------------------- |
| Shelf (books)          | `desktop-nav.tsx:76–93`   | `bottom-nav.tsx:84–91`   | `hamburger-menu.tsx:75–79` (`ShelfIcon` via `IconBox`) | —                                        |
| Activity (lightning)   | `desktop-nav.tsx:94–110`  | `bottom-nav.tsx:92–98`   | `hamburger-menu.tsx:93–97`                             | —                                        |
| Wanted (magnifier-q)   | `desktop-nav.tsx:111–129` | `bottom-nav.tsx:99–107`  | `hamburger-menu.tsx:86–92`                             | —                                        |
| Add (plus)             | —                         | `bottom-nav.tsx:108–115` | —                                                      | —                                        |
| Profile (person)       | —                         | `bottom-nav.tsx:116–123` | —                                                      | —                                        |
| Search (magnifier)     | —                         | —                        | `hamburger-menu.tsx:80–85`                             | — (`top-bar.tsx:61–78` has its own copy) |
| Event (calendar)       | —                         | —                        | `hamburger-menu.tsx:98–105`                            | —                                        |
| Manifest (doc)         | —                         | —                        | `hamburger-menu.tsx:106–113`                           | —                                        |
| Members (two-people)   | —                         | —                        | `hamburger-menu.tsx:114–121`                           | —                                        |
| Feedback (chat)        | —                         | —                        | `hamburger-menu.tsx:122–126`                           | —                                        |
| Map (folded)           | —                         | —                        | `hamburger-menu.tsx:127–133`                           | —                                        |
| Places (pin)           | —                         | —                        | `hamburger-menu.tsx:134–139`                           | —                                        |
| Market (basket)        | —                         | —                        | `hamburger-menu.tsx:140–145`                           | —                                        |
| Mastermind (globe)     | —                         | —                        | `hamburger-menu.tsx:146–152`                           | —                                        |
| Search (TopBar mobile) | —                         | —                        | —                                                      | `top-bar.tsx:61–78`                      |
| Menu (hamburger lines) | —                         | —                        | `hamburger-menu.tsx:488–505`                           | —                                        |
| Close (×)              | —                         | —                        | `hamburger-menu.tsx:506–521`                           | —                                        |

**Counts.** Shelf icon defined **three times** with three slightly different paths. Activity icon defined three times. Wanted icon defined three times. Search icon defined twice (once in HamburgerMenu, once in TopBar). All are 24×24 viewBox single-stroke variants but visual weight differs slightly per file.

### Duplicated route hrefs and active matchers

| Route              | Where defined                                                                                                         | Match logic                                                        |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `/library`         | DesktopNav, BottomNav, HamburgerMenu, TopBar logo, `(app)/layout.tsx` indirect, AvatarMenu (no — uses `/profile/...`) | Three different matchers (see §4).                                 |
| `/activity`        | DesktopNav, BottomNav, HamburgerMenu, AvatarMenu                                                                      | Three matchers.                                                    |
| `/wanted`          | DesktopNav, BottomNav, HamburgerMenu                                                                                  | Three matchers, but actually consistent (`startsWith("/wanted")`). |
| `/discover`        | TopBar mobile search icon, HamburgerMenu, `TopBarSearch` (input)                                                      | Two matchers (mostly consistent).                                  |
| `/event`           | HamburgerMenu, AvatarMenu                                                                                             | Matcher only in Hamburger.                                         |
| `/manifest`        | HamburgerMenu, AvatarMenu                                                                                             | Matcher only in Hamburger (with `/admin/manifests` carve-out).     |
| `/members`         | HamburgerMenu, AvatarMenu                                                                                             | One matcher.                                                       |
| `/map`             | HamburgerMenu                                                                                                         | One matcher.                                                       |
| `/spots`           | HamburgerMenu                                                                                                         | One matcher.                                                       |
| `/feedback`        | HamburgerMenu, AvatarMenu                                                                                             | One matcher.                                                       |
| `/mastermind`      | HamburgerMenu (Builder), AvatarMenu (admin-only)                                                                      | One matcher.                                                       |
| `/admin/feedback`  | HamburgerMenu (Builder), AvatarMenu (admin-only)                                                                      | One matcher.                                                       |
| `/admin/manifests` | HamburgerMenu (Builder)                                                                                               | One matcher.                                                       |

**Verdict.** Hrefs are stable. Labels and matchers drift between components. Icons are heavily duplicated.

### Duplicated labels and descriptions

- "My Library" (Hamburger) vs "Library" (Desktop, Bottom).
- "Activity Feed" (Hamburger) vs "Activity" (Desktop, Bottom, AvatarMenu).
- "Wanted" (consistent everywhere).
- "Discover" (Hamburger) vs no labeled link elsewhere on lg+; tooltip-less search icon on md-.
- "Events" (Hamburger, AvatarMenu) — consistent.
- "Manifest" (Hamburger) vs "Manifest" (AvatarMenu) — consistent.
- "Members" (Hamburger, AvatarMenu) — consistent.
- "Feedback" (Hamburger) vs "My feedback" (AvatarMenu) — semantic drift; "My feedback" is clearer.
- "Mastermind cockpit" (Hamburger) vs "Mastermind cockpit" (AvatarMenu) — consistent.

The Indonesian descriptions in Hamburger (`description` field) are not echoed anywhere else; they exist only as Hamburger-row subcopy.

---

## 4. Active-state audit

### Library active match (4 components, 4 different rules)

| Component     | Match rule (paraphrased)                                                                                 | File:line                    |
| ------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------- |
| DesktopNav    | `=== /library`, `startsWith /library/`, `=== /shelf`, `startsWith /shelf/`, `=== /`, `startsWith /book/` | `desktop-nav.tsx:30–37`      |
| BottomNav     | `=== /`, `startsWith /library`, `startsWith /shelf`                                                      | `bottom-nav.tsx:20`          |
| HamburgerMenu | `=== /`, `startsWith /library`, `startsWith /shelf`, `startsWith /book`                                  | `hamburger-menu.tsx:164–165` |
| AvatarMenu    | n/a (not represented)                                                                                    | —                            |

Inconsistencies:

- **`/book/[id]` highlights Library on DesktopNav + Hamburger but NOT BottomNav.** On mobile, a user viewing a book detail page sees no nav item highlighted as active. On desktop, Library lights up.
- All three include `/` (root landing) as part of Library active state. This is debatable — the root is the _public landing_, not the books surface. When an authed user lands on `/` (rare; they get bounced through proxy logic), DesktopNav highlights Library. Probably fine but worth noting.

### Activity active match (3 components, 3 different rules)

| Component     | Match rule                                        |
| ------------- | ------------------------------------------------- |
| DesktopNav    | `startsWith /activity` OR `startsWith /aktivitas` |
| BottomNav     | `startsWith /activity` OR `startsWith /aktivitas` |
| HamburgerMenu | `startsWith /activity` OR `startsWith /aktivitas` |

Consistent. The English-alias-OR-Indonesian-legacy pattern is well-applied here.

### Wanted active match

All three components: `startsWith /wanted`. Consistent.

### Manifest active match

- HamburgerMenu: `startsWith /manifest` AND NOT `startsWith /admin/manifests`. The carve-out prevents the user-facing Manifest item from highlighting when an admin is on the moderation page. This is the only matcher that handles this — but Manifest isn't represented in DesktopNav or BottomNav at all, so the carve-out only matters in Hamburger.

### Map / Spots active match

HamburgerMenu only. Map: `/map` OR `/peta`. Spots: `=== /spots` OR `startsWith /spots/`.

### Profile / Add active match (BottomNav only)

- Add: `startsWith /book/add`. Does NOT match `/book/[id]/edit` (correct — that's not adding).
- Profile: `startsWith /profile`. **Matches both `/profile/[username]` AND `/profile/edit`** which is correct.

### Cross-component inconsistencies summary

| Symptom                                                                     | Where                      | Impact                                                                                 |
| --------------------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------- |
| `/book/[id]` highlights Library on lg+ but nothing on md-                   | Desktop vs Bottom          | Mobile users on book detail see no active nav. Low impact.                             |
| `/` (root) lights Library across all three                                  | All three                  | Root is the public landing — debatable framing but not broken.                         |
| Different SVG paths for the same icon                                       | All three icon definitions | Visual drift on close inspection.                                                      |
| HamburgerMenu has rich descriptions; DesktopNav + BottomNav have label-only | Hamburger                  | Acceptable per medium; consider exposing the same descriptions as tooltips on desktop. |
| Logo always links to `/library`                                             | `top-bar.tsx:20`           | Once `/home` exists, this becomes the question for Slice 3C.                           |
| Post-login signed-in users on `/auth/*` redirect to `/shelf`                | `proxy.ts:82`              | Same — Slice 3C decision point.                                                        |

---

## 5. BottomNav recommendation

The user listed four candidates in the Slice 1.5 prompt. Comparing each on five axes:

| Candidate                                                    | Coverage of high-frequency actions                                | Adds `/home` cockpit | Preserves Add (prominent CTA) | Mobile muscle memory                                                                                    | Risk                                                           |
| ------------------------------------------------------------ | ----------------------------------------------------------------- | -------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **A. Home / Library / Add / Activity / Profile**             | Strong (cockpit + books + signal contribution + pulse + identity) | Yes                  | Yes (tab 3, center prominent) | Library shifts tab 1 → tab 2. Add stays center. Profile stays tab 5. Activity stays. Only Wanted drops. | Low — Wanted still in /home card + hamburger Library group.    |
| **B. Home / Library / Events / Activity / Profile**          | Drops Add CTA — biggest red flag                                  | Yes                  | **No — Add removed**          | Add gone (regression). Library moves.                                                                   | High — losing the prominent Add CTA suppresses contribution.   |
| **C. Library / Activity / Add / Events / Profile**           | No `/home` tab                                                    | No                   | Yes                           | Library stays tab 1 (good muscle memory). Wanted → Events.                                              | Medium — `/home` cockpit invisible from BottomNav.             |
| **D. Current (Library / Activity / Add / Wanted / Profile)** | Solid for transactional / signal contribution                     | No                   | Yes                           | Status quo.                                                                                             | None — but does nothing to expose ecosystem cockpit or Events. |

### Recommendation: **Option A — Home / Library / Add / Activity / Profile**

**Rationale.**

1. **`/home` becomes the spine.** The ecosystem cockpit needs a permanent mobile entry point. Without a BottomNav slot, users discover `/home` only through the hamburger drawer or the TopBar logo (if Slice 3C eventually routes the logo there). Putting Home at tab 1 ensures one-tap access from anywhere.
2. **Preserves Add (the most important CTA).** Tab 3 (center prominent) stays as `/book/add`. Bookadd is the single highest-leverage user contribution; removing it would silently suppress liquidity.
3. **Activity stays the pulse tap.** Activity is curiosity-driven and frequent. Keeping it in BottomNav preserves the "what's happening" muscle memory.
4. **Profile stays as identity anchor (tab 5).** Users tap their own profile to verify how they appear publicly. Removing it would break a common path.
5. **Wanted moves to higher-leverage placement.** On `/home` (live signal card with open-count) + Hamburger Library group + Activity feed entries (`WTB_POSTED` rows). Wanted does not have the per-day tap frequency of Library / Activity, so it does not earn a BottomNav slot in the cockpit-first model.

**Muscle-memory tradeoff:** Library shifts from tab 1 to tab 2. This is the only regression. Mitigated by:

- Tab 1 (Home) is a richer landing than the current tab 1 (Library) — most users tapping "tab 1" want the cockpit, not just the books grid.
- Library remains immediately visible on tab 2; a flick of the thumb away.

**What to defer to Slice 3A.** Don't add the Home tab in Slice 2 — `/home` doesn't exist yet. Slice 2 ships **Library / Activity / Add / Events / Profile** (Option C variant) as an interim BottomNav. Slice 3A then swaps Events out and adds Home as tab 1, with Library shifting to tab 2 and Activity remaining tab 4.

Alternatively, Slice 2 keeps the current BottomNav intact and Slice 3A does the entire BottomNav transition at once. Defer the call to Slice 2 prep — see §7.

### Why not Option C as the long-term answer?

Option C (Library / Activity / Add / Events / Profile) ships in Slice 2 cleanly because everything in it exists today. But once `/home` lands in 3A, Option C lacks a Home tab — users can only reach `/home` via Hamburger or Logo. That weakens the cockpit's perceived centrality. Treat Option C as a Slice-2 stepping stone, not the final state.

---

## 6. Proposed shared nav config

Sketch of `components/layout/nav-config.ts`. Not the final code — this is the shape to commit in Slice 2.

```ts
// components/layout/nav-config.ts
import type { ComponentType } from "react";

type IconProps = { size?: number };
type Icon = ComponentType<IconProps>;

export type NavRequires = "auth" | "admin";

export interface NavItem {
  id: string; // stable key, e.g. "home", "library"
  label: string; // English-first short label
  shortLabel?: string; // optional shorter form for BottomNav (e.g. "Lib")
  description?: string; // Indonesian subcopy for Hamburger rows
  href: string; // canonical href — always English-alias where available
  icon: Icon; // single source of truth for the SVG
  match: (pathname: string) => boolean;
  requires?: NavRequires; // gate visibility
  comingSoon?: boolean; // visual "Soon" pill, non-clickable
  group?: NavGroupId; // hamburger group association
  desktop?: boolean; // include in DesktopNav primary
  bottom?: boolean; // include in BottomNav
  bottomProminent?: boolean; // BottomNav center-CTA styling (Add only)
  avatar?: boolean; // include in AvatarMenu
}

export type NavGroupId = "library" | "activity" | "community" | "explore" | "builder";

export const NAV_GROUPS: Record<NavGroupId, { label: string; adminOnly?: boolean }> = {
  library: { label: "Library" },
  activity: { label: "Activity" },
  community: { label: "Community" },
  explore: { label: "Explore" },
  builder: { label: "Builder", adminOnly: true },
};

// Centralized icon registry — declared once.
export const NavIcons = {
  Home,
  Shelf,
  Activity,
  Event,
  Member,
  Manifest,
  Map,
  Spot,
  Wanted,
  Search,
  Add,
  Profile,
  Feedback,
  Mastermind,
  Market,
} as const;

// Route-alias helpers — keep both English and Indonesian in active match.
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
  members: (p: string) => p.startsWith("/members") || p.startsWith("/anggota"),
  map: (p: string) => p.startsWith("/map") || p.startsWith("/peta"),
  discover: (p: string) => p.startsWith("/discover") || p.startsWith("/search"),
  event: (p: string) => p.startsWith("/event"),
  manifest: (p: string) => p.startsWith("/manifest") && !p.startsWith("/admin/manifests"),
  wanted: (p: string) => p.startsWith("/wanted"),
  spots: (p: string) => p === "/spots" || p.startsWith("/spots/"),
  feedback: (p: string) => p === "/feedback" || p.startsWith("/feedback/"),
  mastermind: (p: string) => p.startsWith("/mastermind"),
};

// Single source of truth for every nav item.
export const NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "Home",
    description: "Today in your knowledge network",
    href: "/home",
    icon: NavIcons.Home,
    match: matchers.home,
    requires: "auth",
    desktop: true, // Slice 3A
    bottom: true, // Slice 3A
    avatar: false,
  },
  {
    id: "library",
    label: "Library",
    description: "Buku-buku komunitas",
    href: "/library",
    icon: NavIcons.Shelf,
    match: matchers.library,
    group: "library",
    desktop: true,
    bottom: true,
  },
  {
    id: "activity",
    label: "Activity",
    description: "Yang lagi terjadi di komunitas",
    href: "/activity",
    icon: NavIcons.Activity,
    match: matchers.activity,
    group: "activity",
    desktop: true,
    bottom: true,
    avatar: true,
  },
  {
    id: "events",
    label: "Events",
    description: "Diskusi · kopdar · workshop",
    href: "/event",
    icon: NavIcons.Event,
    match: matchers.event,
    group: "activity",
    desktop: true,
    avatar: true,
  },
  {
    id: "members",
    label: "Members",
    description: "Orang-orang yang baca bareng",
    href: "/members",
    icon: NavIcons.Member,
    match: matchers.members,
    group: "community",
    desktop: true,
    avatar: true,
  },
  {
    id: "discover",
    label: "Discover",
    description: "Cari judul, author, atau owner",
    href: "/discover",
    icon: NavIcons.Search,
    match: matchers.discover,
    group: "library",
  },
  {
    id: "wanted",
    label: "Wanted",
    description: "Lagi nyari buku tertentu?",
    href: "/wanted",
    icon: NavIcons.Wanted,
    match: matchers.wanted,
    group: "library",
  },
  {
    id: "manifest",
    label: "Manifest",
    description: "Pemikiran pendek dari pembaca",
    href: "/manifest",
    icon: NavIcons.Manifest,
    match: matchers.manifest,
    group: "activity",
    avatar: true,
  },
  {
    id: "map",
    label: "Map",
    description: "Anggota komunitas di peta",
    href: "/map",
    icon: NavIcons.Map,
    match: matchers.map,
    group: "explore",
  },
  {
    id: "spots",
    label: "Spots",
    description: "Cafe · rak buku publik · ruang komunitas",
    href: "/spots",
    icon: NavIcons.Spot,
    match: matchers.spots,
    group: "explore",
  },
  {
    id: "feedback",
    label: "Feedback",
    description: "Cerita ke kita",
    href: "/feedback",
    icon: NavIcons.Feedback,
    match: matchers.feedback,
    group: "community",
    avatar: true, // labeled "My feedback" in avatar
  },
  // BottomNav-specific item — no group, not in Hamburger.
  {
    id: "add-book",
    label: "Add",
    href: "/book/add",
    icon: NavIcons.Add,
    match: (p) => p === "/book/add",
    requires: "auth",
    bottom: true,
    bottomProminent: true,
  },
  // Admin items — Builder group, admin-gated.
  {
    id: "mastermind",
    label: "Mastermind cockpit",
    description: "OKR · pulse · intelligence",
    href: "/mastermind",
    icon: NavIcons.Mastermind,
    match: matchers.mastermind,
    requires: "admin",
    group: "builder",
    avatar: true,
  },
  {
    id: "admin-feedback",
    label: "Feedback inbox",
    description: "Triage user feedback",
    href: "/admin/feedback",
    icon: NavIcons.Feedback,
    match: (p) => p.startsWith("/admin/feedback"),
    requires: "admin",
    group: "builder",
    avatar: true,
  },
  {
    id: "admin-manifests",
    label: "Manifest moderation",
    description: "Review pending manifestos",
    href: "/admin/manifests",
    icon: NavIcons.Manifest,
    match: (p) => p.startsWith("/admin/manifests"),
    requires: "admin",
    group: "builder",
  },
];

// Derived views consumed by nav components.
export const desktopNavItems = NAV_ITEMS.filter((i) => i.desktop);
export const bottomNavItems = NAV_ITEMS.filter((i) => i.bottom);
export const avatarMenuItems = NAV_ITEMS.filter((i) => i.avatar);
export const hamburgerGroups = (Object.keys(NAV_GROUPS) as NavGroupId[]).map((g) => ({
  id: g,
  label: NAV_GROUPS[g].label,
  adminOnly: NAV_GROUPS[g].adminOnly,
  items: NAV_ITEMS.filter((i) => i.group === g),
}));
```

### Icon strategy recommendation

Move every SVG into one `components/layout/nav-icons.tsx` file. Each icon is a stable React component (`size` prop, `aria-hidden`, single `currentColor` stroke, 24×24 viewBox, stroke-width 1.75). All four nav components consume from this file. No more triple-declared paths.

Naming: prefer noun-based component names matching the `NavIcons` registry above (`Home`, `Shelf`, `Activity`, `Event`, `Member`, `Manifest`, `Map`, `Spot`, `Wanted`, `Search`, `Add`, `Profile`, `Feedback`, `Mastermind`, `Market`). Keep the `Profile` icon variant (person) distinct from the `Member` icon variant (two people) — they serve different surfaces.

### Active-match helper

Each `matchers.*` is a pure function. To avoid bugs when surfaces grow:

- Treat `/` (root) as part of `library` for _authed_ users only — but proxy and (app) layout already shield this case. Keep the existing match for now to avoid behavior change in Slice 2.
- For `/home`, **do not** add it to the `library` match. Home is its own surface.
- The `manifest` matcher's `/admin/manifests` carve-out is the only non-prefix rule. Document it inline.

---

## 7. Risks and implementation plan for Slice 2

### Exact files to modify in Slice 2

- **New:** `components/layout/nav-config.ts` — the shape sketched in §6.
- **New:** `components/layout/nav-icons.tsx` — consolidated icon components.
- **Modify:** `components/layout/desktop-nav.tsx` — consume `desktopNavItems`. Expand from 3 to 5 (Library, Activity, Events, Members, Explore-dropdown). Note: Explore needs a small dropdown component (Discover / Wanted / Manifest / Map / Spots / Feedback) — propose `components/layout/explore-dropdown.tsx` if the existing AvatarMenu pattern is reused.
- **Modify:** `components/layout/hamburger-menu.tsx` — consume `hamburgerGroups`. Strip its local icon definitions and item data. Keep the dialog shell + animations.
- **Modify:** `components/layout/bottom-nav.tsx` — consume `bottomNavItems`. **Slice 2 ships Library / Activity / Add / Events / Profile** (drop Wanted, add Events). Reason: `/home` doesn't exist yet; we don't ship a broken Home tab. Slice 3A swaps Events out for Home.
- **Modify:** `components/layout/avatar-menu.tsx` — consume `avatarMenuItems` for the main section + admin section. Keep the user header (name + admin badge + @username), sign-out form, and "Quick add (multiple)" / "Import from Goodreads" as raw inline items (these don't belong in `nav-config.ts` because they're not nav surfaces — they're add-flow shortcuts).
- **Modify (small):** `components/layout/top-bar.tsx` — no change to logo `href` in Slice 2. (Logo stays `/library` until Slice 3C.)
- **No change:** `proxy.ts` (auth gating) — `/home` not yet in `isAppRoute` until Slice 3A. No redirect changes.
- **No change:** `next.config.ts` — no new rewrites in Slice 2.

### Acceptance criteria (Slice 2)

- `components/layout/nav-config.ts` exists and is the only source of nav-item definitions used by DesktopNav, HamburgerMenu, BottomNav, and AvatarMenu's nav section.
- `components/layout/nav-icons.tsx` exists and is the only source of nav icons.
- DesktopNav renders 5 items: Library, Activity, Events, Members, Explore-dropdown.
- HamburgerMenu still renders the same 5 groups but reads from `hamburgerGroups`.
- BottomNav renders Library / Activity / Add / Events / Profile.
- AvatarMenu reads its main nav section from `avatarMenuItems` (admin section gated by `is_admin`).
- Active-state highlight works for both English aliases and Indonesian legacy URLs across all four components.
- No new routes, no redirects, no DB migrations, no schema changes.
- Existing public routes (`/`, `/about`, `/privacy`, `/profile/[username]`, `/spots`, `/spots/[slug]`, `/auth/*`, `/onboarding`, `/feed.*`) untouched.
- `/shelf` and all aliased URLs render unchanged.
- `npm run lint` passes.
- Mobile (iPhone SE 375px) and desktop (lg+ ≥1024px) screenshots before/after captured for the PR.

### What must not change in Slice 2

- Logo `href` (`top-bar.tsx:20`). Stays `/library` until Slice 3C.
- Post-login `/auth/*` redirect target in `proxy.ts:82`. Stays `/shelf`.
- Post-onboarding redirect in `app/onboarding/onboarding-form.tsx`. Stays whatever it is today.
- `next.config.ts` rewrites.
- `/shelf` page content (Events + Activity widgets stay on page 1 until Slice 3B).
- AvatarMenu user header + sign-out form + non-nav admin shortcuts.
- `(app)/layout.tsx` auth-gate + profile-completeness logic.
- `<FeedbackChip>` floating button (orthogonal to nav).
- `TopBarSearch` input (separate component; unaffected).

### Risks

| Risk                                                          | Likelihood | Mitigation                                                                                                                                                          |
| ------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BottomNav muscle-memory regression (Wanted → Events)          | Medium     | Document on launch; Wanted still reachable via Hamburger Library group + `/discover` search + Activity feed entries.                                                |
| DesktopNav becoming too wide on lg+ at 1024px                 | Medium     | Explore dropdown collapses 6 items into one slot. If TopBar still feels cramped, push DesktopNav to xl+ (≥1280px) instead of lg+. Test in dev before merging.       |
| Active-state drift when consumers don't share matchers        | Low        | The proposed config defines matchers centrally; tests can assert pathname → active-item mapping for each surface.                                                   |
| Icon visual drift if some places re-import old icon files     | Low        | Delete the old icon definitions from DesktopNav, BottomNav, HamburgerMenu, TopBar SearchIcon when switching to `nav-icons.tsx`. Lint should fail on unused imports. |
| Slice 2 ships before `/home`; users expect to see Home in nav | Low        | Don't include Home in Slice 2 nav rendering. Slice 3A adds it as part of `/home` launch. Make this explicit in the Slice 2 PR description.                          |
| `Explore` dropdown a11y on desktop                            | Medium     | Use the existing AnggotaFilterSheet / HamburgerMenu dialog pattern, or a simple click-and-keyboard menu. Don't ship without keyboard navigation.                    |

---

## Cross-references

- `docs/BUSINESS_PROCESS.md` — vocabulary for nav labels and grouping
- `docs/BRAND_AND_VOICE.md` — copy register for descriptions
- `docs/STATE.md` — decision log
- `proxy.ts` — auth gating union (must be updated when `/home` lands in 3A)
- `next.config.ts` — rewrite map (no changes in Slice 2)

---

**Last updated:** 2026-05-28 (Slice 1.5 of the ecosystem alignment initiative). Audit only. No code changes in this slice.
