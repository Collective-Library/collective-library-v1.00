# Collective Maps V1.5 → V2 — Implementation Plan

> Full-depth plan for the `/maps` fullscreen route, contribution Add flow, feedback loop, admin tooling, and future Google Places enrichment layer. Grounded in [`MAPS_PRODUCT_NORTH_STAR.md`](./MAPS_PRODUCT_NORTH_STAR.md), [`MAPS_AUDIT.md`](./MAPS_AUDIT.md), and [`MAPS_ROADMAP.md`](./MAPS_ROADMAP.md). Each slice is gated — **do not build any slice until explicitly approved**.
>
> Plan date: 2026-06-01. Status: Slice A (this doc) ✅ shipped. Slice B onwards awaiting approval.

---

## 1. Product North Star

**Why `/maps` exists separately from `/peta`:** `/peta` is a _section_ (a card inside the app shell — `max-w-6xl` container, TopBar, BottomNav). `/maps` is a _surface_ — the map IS the page, with floating chrome and a fullscreen canvas. Separating them de-risks every release (zero regression to a shipped, linked-to route) and lets `/maps` iterate aggressively while `/peta` stays stable.

- **`/peta` remains** the stable, card-embedded, shareable map. Existing social/RSS links, nav "Map" entry, and `/map` rewrite alias stay untouched. No redirect from `/peta` to `/maps` yet.
- **`/maps` becomes** the future primary discovery experience. Once proven in staging, nav can promote it; `/peta` can later redirect.

**What makes this different:**

| Platform        | What they do                                                                              | What Collective Maps does instead                                                                         |
| --------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Google Maps** | Logistics — routing, exact addresses, business reviews. Optimized to _get you somewhere_. | Discovery + trust, not navigation. Members are approximate by design.                                     |
| **Goodreads**   | A global, placeless catalog of books + reviews.                                           | Books as social, local signals attached to real people and places nearby.                                 |
| **LinkedIn**    | Professional identity + transactional networking, status-driven.                          | Curiosity-driven, community-first. Discoverable by what you read and want to discuss.                     |
| **Discord**     | Real-time chat in topic servers, placeless, ephemeral.                                    | A persistent, spatial, browsable map — Discord is the conversation layer, the map is the discovery layer. |
| **Zenly**       | Live GPS friend-tracking, exact and always-on.                                            | Social presence without live location. Approximate by default, opt-in, event/Spot-anchored.               |

**First 10 seconds:** open `/maps` → a warm, alive city of reader bubbles, reading Spots, and upcoming events. One tap to filter. One obvious way to add yourself. _"There's a network here, and I can join it."_

**Activation loop — every surface pushes the next step:**

> discover → contribute → appear → connect → return → invite

1. **Discover** — open `/maps`, see readers + Spots + events nearby.
2. **Contribute** — a single clear prompt: add your shelf, add a Spot, create an event, or set your location.
3. **Appear** — the contribution makes _you_ visible on the map (bubble, book count, your Spot).
4. **Connect** — someone clicks your pin, sees shared interests/books, reaches out (WhatsApp / IG / Discord — never internal chat).
5. **Return** — new Spots and events are a reason to come back; the map changed since last time.
6. **Invite** — share your city map; "look who's reading near us" pulls the next person to step 1.

Design rule: **never show a dead end.** Every empty state is a contribution prompt; every pin is a connection opportunity; every full map is a share opportunity.

**Success per persona:**

- First-time visitor → "this is alive near me".
- Logged-in member → appears + gets contacted.
- Event host → event pinned at a real Spot.
- Spot contributor → suggestion approved + visible.
- Admin/founder → low-touch triage + coverage metrics in Mastermind.
- Future city lead → a per-city map worth growing.

---

## 2. Current System Audit

### What exists and is reusable as-is

- **Loaders (server-side, RLS-gated, fail-soft):** `listMembersForMap()` (`lib/profile.ts`), `listSpotsForMap()` + `SpotForMap` (`lib/spots.ts`), `listEventsForMap()` + `EventForMap` (`lib/events.ts`). All three are pure functions; `/maps` calls them unchanged.
- **Types + adapters:** `lib/map.ts` — `CollectiveMapItem` discriminated union + `memberToMapItem`/`spotToMapItem`/`eventToMapItem`. Pure, no I/O.
- **Page server pattern:** `app/(app)/peta/page.tsx` — `searchParams` (`layer`/`intent`/`open`), conditional `Promise.all` loaders, `buildHref`, `mapCountLine`, `FilterRow`/`FilterPill`, privacy disclaimer. `/maps` mirrors this server-side pattern verbatim.
- **External API route template:** `app/api/geocode/route.ts` and `/api/postal-code/lookup/route.ts` — auth-gate → validate → `cache:"no-store"` upstream → `s-maxage` CDN response header → `{found, ...}` shape. This is the template for future Google Places routes.
- **Feedback system:** `feedback` table (categories, status lifecycle, page_url context), `app/api/feedback/route.ts` (two-layer DB→Discord fan-out, anon-allowed), `<FeedbackChip>`, `app/admin/feedback/` admin dashboard. Reusable for map feedback with no new table.
- **Mastermind admin:** `lib/mastermind/auth.ts` (`requireAdmin`/`getAdminProfileOrNull`), `components/mastermind/{shell,sidebar}.tsx`, `app/mastermind/spots/*` + `/api/mastermind/spots/*`, `lib/mastermind/*` data-module pattern (cheap `Promise.all` + `count head:true` queries), `lib/supabase/admin.ts` service-role client (server-only).
- **Analytics:** `@vercel/analytics` wired in `app/layout.tsx`; `track()` used ad-hoc (no abstraction yet).

### What needs a small, safe refactor

- **`components/map/map-view.tsx`** — hardcodes `style={{ height: 480 }}` on the `MapContainer`. Needs an optional `height`/`className` prop (default: `480px`) to support fullscreen. This is **Slice B** — zero visual change to `/peta`. `/peta` continues rendering at 480px; `/maps` passes `height="100%"` or a fill class.

### What must not be touched

- `/peta` page and all its server logic.
- `MapView` member branch, jitter function, and `markerPosition` (member privacy contract).
- The shared `EventWithHost` node join in `listEvents`/`getUpcomingEvents` (widening it cascades to `/event` list, feeds, `EventCard`).
- RLS policies on `library_nodes` and `events`.
- `lib/supabase/admin.ts` must stay server-only; never import into client code.
- `PageShell` — every `(app)` route inherits it; don't alter it for `/peta`.

### What is missing (to build, per slice)

Fullscreen layout + floating chrome; `/maps` route; `lib/map-analytics.ts`; V2 (gated): enrichment columns, Places candidates table, suggestion flow, `NODE_CREATED` Discord embed.

---

## 3. `/maps` Fullscreen UX Plan

### Routing decision (recommended)

**Make `/maps` its own route with a slim, auth-gated layout — outside the `(app)` route group.**

`PageShell` forces `max-w-6xl px-4 py-6` and a `md:hidden fixed` BottomNav (z-40) onto every `(app)` route. A true fullscreen map has to fight both. A dedicated layout (replicating the auth + onboarding check from `app/(app)/layout.tsx`) gives a clean `100dvh` canvas with our own floating chrome, and keeps `/peta` 100% untouched. Add `/maps` to `proxy.ts` `isAppRoute` for the cheap session gate. `/maps` does not collide with the existing `/map`→`/peta` rewrite (different string).

### Layout structure

- **Full-bleed canvas:** `100dvh` map, zero padding, no max-width constraint.
- **Top floating search bar:** rounded-pill, parchment background, safe-area aware.
- **Floating layer chips:** Semua / Anggota / Spots / Event — mirror `/peta` `?layer=` semantics via query string.
- **Floating utility controls:**
  - Focus: fit viewport to visible pins or default to user's city — **no live GPS this phase**.
  - Legend/Privacy: "member pins approximate; Spots/events use public locations".
  - Feedback (optional): opens map feedback form.
- **Floating Add button (FAB):** primary action, with menu:
  - Tambah buku → `/book/add`
  - Tambah Spot → `/mastermind/spots/new` (host-eligible) or disabled "Coming soon" otherwise
  - Buat event → `/event/new`
  - Edit lokasi gue → `/profile/edit`
- **Selected-pin details:** mobile bottom sheet (peek / half / full height states); desktop right side panel; Leaflet popup as fallback (reuse existing `MemberPopup`/`SpotPopup`/`EventPopup` content components unchanged).
- **Empty states:** "Belum ada yang muncul di [city]. Jadi yang pertama." → Add CTA.
- **Back to app:** small "← Balik ke app" link / logo affordance (since BottomNav is absent).

### Mobile (375px)

- Bottom sheet states: peek (64px) / half (50dvh) / full (90dvh); swipe handle.
- Search focus lifts sheet and respects soft keyboard; `env(safe-area-inset-bottom)` padding.
- No BottomNav overlap (suppressed by the dedicated layout).
- Leaflet touch: one-finger pan, pinch-zoom, `dragging.enable()` + `touchZoom.enable()`, prevent page scroll bleed.

### Desktop

- Persistent right side panel (320px) for selected item.
- Hover highlight + click selects pin; ESC or click outside closes panel.
- Selected item persists across layer chip toggles where possible.
- Keyboard focus order on floating controls; `aria-label` on all icon buttons.

---

## 4. Search Plan (phased)

- **Phase A (Slice C):** search bar is presentational — on submit, route to the existing `/search` page (books FTS). No map-integrated search. No Google API.
- **Phase B:** local search across already-loaded map items client-side. Dataset is small (members opt-in, Spots ≤500, events ≤200) — filter by name/city/type + pan map to matches. New `lib/map-search.ts` (pure filter over `CollectiveMapItem[]`). Server-side only if datasets grow.
- **Phase C (V2, deferred):** Google Places-powered search/import — backend-only, admin-first, cached, rate-limited. See Section 5.

---

## 5. Google Places / Maps API Future Plan

> **Do not build anything in this section yet.** This is design-only. All Google work is deferred, flag-gated, admin-first, and backend-only.

### Keep Leaflet as the renderer

Use Google only as a **server-side enrichment/import layer**, never the client map. The Maps JavaScript API is not needed; Leaflet + Carto Positron continues as the renderer.

### APIs needed (server-side only)

- **Places Text Search** — admin query → candidate list.
- **Places Details** — on-demand for a selected candidate.
- **Geocoding** — optional, for resolving addresses without lat/lng.
- **Not needed:** Maps JS API, Autocomplete on every keystroke, Photos by default, Reviews (we build our own reading-suitability data).

### Architecture (mirrors existing `/api/geocode` pattern)

```
app/api/maps/google-places/search/route.ts    ← admin-only, auth-gated
app/api/maps/google-places/details/route.ts   ← admin-only, on-demand
lib/google-places.ts                          ← server-only; never client-imported
```

- Server key in `GOOGLE_PLACES_API_KEY` env var — never client-exposed.
- **Feature flag + kill switch:** if `GOOGLE_PLACES_API_KEY` is unset → graceful no-op, identical to the Discord webhook pattern (`if (!webhookUrl) return ok: true, skipped: "..."`).
- A separate env flag `MAPS_GOOGLE_IMPORT_ENABLED=false` disables the admin UI entirely.

### Cost controls

- Admin-only routes — never user-facing by default.
- **No API calls on map load, ever.**
- Cache results in Supabase (`place_import_candidates` table — see Section 6).
- Details fetched on-demand only (not bulk pre-fetched).
- Daily/monthly quota guard + simple rate limiter.
- No Photos/Reviews by default.

### Admin import workflow (`/mastermind/maps/places-import`)

1. Admin types a query: "quiet cafe Semarang", "perpustakaan Semarang", "coworking baca".
2. Results cached in `place_import_candidates` (admin-only RLS).
3. Admin previews candidate Details (on-demand fetch, also cached).
4. "Import as Spot" → inserts into `library_nodes` with `status='needs_audit'`, `source='google'`, external metadata (`external_place_id`, `external_maps_url`, `external_rating`, `external_user_ratings_total`, `external_fetched_at`).
5. Admin promotes to `active/public` via existing Spot status setter → `emit_node_created` fires → activity log + Discord embed.

### User suggestion workflow (later, separate approval)

Add Spot → search Places → pick candidate → prefilled suggestion form submitted as `needs_audit` → admin approves → activity emitted **only after approval** (mirrors `emit_manifest_posted`/`emit_node_created` pattern).

**Principle:** Google is seed/enrichment, not the product. Collective Library builds its own reading-suitability signal over time.

---

## 6. Data Model Plan

### V1.5 — NO migration needed

`/maps` fullscreen + Add flow + feedback entry point reuse existing schema entirely. `library_nodes` already has `address, latitude, longitude, maps_url, image_url, description, operating_hours, community_id, status, is_active, visibility` (migration `0024`). Map feedback reuses the `feedback` table.

### V2 — migrations required (deferred, gated)

Next migration number: **`0027`** (idempotent `IF NOT EXISTS`, applied via Supabase dashboard per `STATE.md` convention).

| Migration                              | What it adds                                                                                                                                                                                                                                                                                                                            | Required for                      |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `0027_library_nodes_v2_enrichment.sql` | Nullable columns on `library_nodes`: `source`, `external_place_id`, `external_maps_url`, `external_rating`, `external_user_ratings_total`, `external_fetched_at`, `reading_suitability_score`, `noise_level`, `wifi_quality`, `power_outlet`, `book_friendly`, `verification_status`, `last_verified_at`, `suggested_by`, `approved_by` | Google import (Slice H)           |
| `0028_place_import_candidates.sql`     | `place_import_candidates` cache table (admin-only RLS)                                                                                                                                                                                                                                                                                  | Google import (Slice H)           |
| `0029_spot_suggestions.sql`            | `spot_suggestions` table (FK to `library_nodes`, anon/auth INSERT, owner+admin SELECT; approval → activity emit)                                                                                                                                                                                                                        | User suggestion flow (Slice I)    |
| `feedback.spot_id` FK + index          | Links feedback rows to a specific Spot (nullable, backward-compatible)                                                                                                                                                                                                                                                                  | Richer map feedback (optional V2) |

**Store vs compute:** store raw external fields + verification timestamps; _compute_ `reading_suitability_score` from community confirmations and tags (don't trust Google rating as the score). Defer anything not needed for the first admin import.

---

## 7. Feedback Loop Plan

### Reuse the existing `feedback` system — no new table for the entry point

**Slice F (no migration):** add a `map` category (or reuse `friction`/`other`) and pass map context via `page_url` (e.g. `/maps?focus=spot:kopi-dan-buku`) plus a structured message prefix. Reuses the feedback API, Discord fan-out, and `/admin/feedback` triage dashboard verbatim.

**Richer Spot linking (V2, optional):** add `feedback.spot_id` FK (nullable, small migration) so admins can click from a feedback row directly to the Spot for quick action.

### User-facing feedback actions

- Report wrong location.
- Mark "good for reading" / reading-suitability note.
- Suggest noise / wifi / power / seating info.
- Suggest event → Spot link.
- Flag duplicate Spot.
- Report "this place closed".
- Confirm/upvote Spot quality.

### Admin flow (low-maintenance principle)

User submits → admin queue (existing `/admin/feedback`, later `/mastermind/maps/feedback`) → one-click status update + internal note → Discord ping on submit → **activity emitted only after approval**. All risky data stays pending until approved. No manual SQL.

---

## 8. Admin / Mastermind Plan

### New "Maps" sidebar section

Add a `Maps` entry to `components/mastermind/sidebar.tsx`, following the existing data-module pattern (`lib/mastermind/*` → `Promise.all` of cheap `count head:true` queries).

| Page                             | Purpose                                                                                                   | Notes                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------ |
| `/mastermind/maps`               | Map health dashboard — coord coverage, active Spots, events w/ Spot link, pending suggestions, stale data | No Google API            |
| `/mastermind/spots`              | Existing; keep unchanged                                                                                  | —                        |
| `/mastermind/maps/feedback`      | Map-scoped feedback queue (filter of `/admin/feedback` scoped to map/Spot context)                        | Slice F+                 |
| `/mastermind/maps/places-import` | Google Places admin import                                                                                | V2, flag-gated (Slice H) |

### Admin capabilities

- Approve/reject suggestions.
- Import Google candidates (V2).
- Merge duplicate Spots (mark one inactive).
- Mark closed/inactive (existing `setSpotActiveAdmin` / `setSpotStatusAdmin`).
- Assign quality tags + reading-suitability (V2).
- Verify Spot data + set `last_verified_at` (V2).
- See stale data needing re-check.
- Toggle `MAPS_GOOGLE_IMPORT_ENABLED` flag (V2).

### Map health KPIs (`lib/mastermind/map-health.ts`)

```
Active map nodes              count active+public+is_active Spots
Coord coverage %              Spots with lat/lng / total Spots
Public Spots by city          grouped count
Upcoming events with Spot link count events with node_id + public Spot
Pending suggestions           count spot_suggestions with status='pending'
Stale Spots (>90 days unverified)  count where last_verified_at < now-90d
```

Vercel Analytics custom events (non-PII): map opens, pin clicks, Add clicks, feedback submitted.

---

## 9. Analytics Plan

### Current state

Vercel Analytics is wired (`app/layout.tsx`). `track()` from `@vercel/analytics` is used ad-hoc in two components with no abstraction. Microsoft Clarity is planned but not yet implemented.

### Proposed: `lib/map-analytics.ts`

A thin, PII-safe wrapper so all map events are consistent:

```ts
// lib/map-analytics.ts
import { track } from "@vercel/analytics";
export type MapEventName =
  | "maps_opened"
  | "map_layer_changed"
  | "map_search_focused"
  | "map_pin_clicked"
  | "map_add_opened"
  | "map_add_action_clicked"
  | "spot_detail_clicked"
  | "event_detail_clicked"
  | "member_profile_clicked"
  | "map_feedback_submitted"
  | "spot_suggestion_started"
  | "spot_suggestion_submitted";

export function trackMapEvent(
  name: MapEventName,
  props?: Record<string, string | number | boolean>
): void {
  track(name, props);
}
```

### Rules

- **No PII** in event names or properties.
- **Never** log member coordinates (even approximate).
- **Never** log private profile data.
- `layer` (members/spots/events/all) and `pin_type` (member/spot/event) are safe.
- Microsoft Clarity: implement later, production-only, gated on `NEXT_PUBLIC_CLARITY_PROJECT_ID`.

---

## 10. Privacy / Safety / Trust Plan

### Members

- Opt-in only (`show_on_map`). Default: off.
- Approximate coordinates only — kecamatan centroid + ±~250 m deterministic jitter. Never exact address.
- No phone/WhatsApp in map payload.
- Self-removal via `/profile/edit`.
- Clear disclaimer on the map surface whenever members are shown.
- Privacy contract is enforced in `listMembersForMap()` + `markerPosition()` — **do not alter these**.

### Spots

- Only `status='active' ∧ is_active=true ∧ visibility='public'` reach the map (RLS + defensive loader filter + NOT NULL coord check).
- Pending suggestions are never public.
- Inactive/closed Spots hidden.
- Duplicate merging is admin-only.
- Exact coordinates are acceptable for public places.

### Events

- Only public, non-hidden, scheduled, upcoming events linked to a public+active Spot with real coordinates.
- Online-only events: never pinned.
- Location-text-only events (no `node_id`): excluded by the `node_id NOT NULL` filter in `listEventsForMap()`.
- Private event locations: never exposed.

### Google data

- Store only needed fields (`external_place_id`, `external_maps_url`, `external_rating`, `external_user_ratings_total`, `external_fetched_at`, `source='google'`).
- Respect Google Terms of Service.
- No scraping or crawling.
- No mining reviews as core product data.
- On-demand Details only — no bulk prefetch.

### Feedback / suggestions

- Moderation before public display.
- All pending until approved by admin.
- Rate limiting + spam handling (deferred).
- Abuse path: admin can mark Spots inactive + delete suggestions.

### Data plane

- All map loaders are server-side via the RLS-enforced SSR client.
- `lib/supabase/admin.ts` (service-role) must never be imported into client code.
- Client receives display-safe projections only.
- All loaders fail soft — errors log server-side and return `[]`, never throw to the page.

---

## 11. Technical Architecture Plan

### Recommended file structure

```
app/
  maps/
    layout.tsx          ← NEW: slim auth+onboarding gate (no PageShell/BottomNav), 100dvh wrapper
    page.tsx            ← NEW: server component, mirror /peta pattern, same loaders + adapters

components/
  map/
    collective-map-canvas.tsx     ← NEW (Slice B): shared Leaflet canvas, height-parameterized
    map-view.tsx                  ← MODIFIED (Slice B): thin wrapper rendering canvas at 480px
    peta-client.tsx               ← MODIFIED (Slice B): unchanged behavior, imports canvas indirectly
    fullscreen-maps-client.tsx    ← NEW (Slice C): "use client", dynamic ssr:false, composes canvas + chrome
    map-floating-search.tsx       ← NEW (Slice C)
    map-layer-chips.tsx           ← NEW (Slice C)
    map-add-button.tsx            ← NEW (Slice E)
    map-selected-panel.tsx        ← NEW (Slice D)
    map-legend.tsx                ← NEW (Slice C)
    map-empty-state.tsx           ← NEW (Slice C)

lib/
  map.ts                ← EXISTS; extend adapters as needed (no changes for V1.5)
  map-analytics.ts      ← NEW (Slice C)
  map-search.ts         ← NEW (Phase B search)

  # V2 (deferred):
  google-places.ts      ← NEW (Slice H): server-only Google Places client

app/api/
  maps/
    google-places/
      search/route.ts   ← NEW (Slice H): admin-only, cached, kill-switch
      details/route.ts  ← NEW (Slice H): admin-only, on-demand
```

### Key design decisions

| Decision                                    | Choice                                              | Rationale                                                                             |
| ------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `/maps` inside or outside `(app)`?          | Outside — own layout                                | `PageShell` forces max-w + BottomNav; fullscreen needs clean `100dvh`                 |
| Canvas extraction vs duplication            | Extract `collective-map-canvas.tsx`                 | Single source of marker/popup/jitter truth; `/peta` renders at 480px via thin wrapper |
| Page state: shared store vs query params    | Mirror `/peta`'s `?layer=` pattern                  | Shareable URLs, SSR-compatible, no extra client boundary                              |
| Selected pin: Leaflet popup vs custom sheet | Custom sheet/panel + reuse popup content components | Immersive feel; popup JSX content unchanged (no copy duplication)                     |
| Data fetching: server-loaded vs SWR/client  | Server-loaded (same loaders)                        | Consistent with existing patterns; payloads are small                                 |

---

## 12. Implementation Slices

Each slice is PR-sized, independently shippable, gated behind explicit approval.

### Slice A — Planning docs (✅ this doc)

- **Goals:** persist the V1.5→V2 plan as repo documentation.
- **Files:** `docs/MAPS_V15_V2_PLAN.md` (new), `README.md` docs index, `docs/ROADMAP.md`, `docs/STATE.md`.
- **Non-goals:** no code, no migrations, no deps.
- **Validation:** `git diff --check`; links resolve.
- **Rollback:** delete doc files.

### Slice B — Reusable canvas extraction (zero visual change to `/peta`)

- **Goals:** extract `collective-map-canvas.tsx` from `MapView`; `MapView` and `peta-client.tsx` render it at 480px identically.
- **Files:** `components/map/collective-map-canvas.tsx` (new), `components/map/map-view.tsx` (refactor), `components/map/peta-client.tsx` (update import).
- **Non-goals:** no `/maps` route, no new UI, no behavior change.
- **Validation:** `typecheck` / `lint` / `test` / `build`; `/peta` member pins, popups, jitter pixel-identical.
- **Rollback:** revert the three map files.
- **Branch:** `feature/maps-canvas-extract` off `staging`.

### Slice C — `/maps` fullscreen route

- **Goals:** new `app/maps/{layout,page}.tsx`; `fullscreen-maps-client.tsx`; floating layer chips; Focus/Legend controls; search bar routes to `/search` (Phase A); add `/maps` to `proxy.ts` + nav.
- **Files:** `app/maps/layout.tsx`, `app/maps/page.tsx`, `components/map/fullscreen-maps-client.tsx`, `map-layer-chips.tsx`, `map-legend.tsx`, `map-empty-state.tsx`, `lib/map-analytics.ts`, `proxy.ts`, `components/layout/nav-config.ts`.
- **Non-goals:** no Add button, no bottom sheet, no search integration yet.
- **Validation:** `/maps`, `/maps?layer=members|spots|events`, mobile 375px, desktop, no console errors, `/peta` unchanged.
- **Rollback:** remove the `app/maps/` directory + nav entry (no shared-code regression).
- **Branch:** `feature/maps-fullscreen` off `staging`.

### Slice D — Selected-pin panel

- **Goals:** mobile bottom sheet (peek/half/full); desktop right side panel; reuse existing popup content components.
- **Files:** `components/map/map-selected-panel.tsx`, `fullscreen-maps-client.tsx` (wiring).
- **Non-goals:** no custom popup content (reuse `MemberPopup`/`SpotPopup`/`EventPopup`).
- **Validation:** select each pin type on mobile + desktop; ESC/swipe-down behavior; overlay doesn't break layer chips.
- **Rollback:** revert to Leaflet popup fallback.

### Slice E — Floating Add button (FAB)

- **Goals:** Tambah buku / Buat event / Edit lokasi gue links; Spot-add disabled/"Coming soon" (host-only today); analytics hooks via `trackMapEvent`.
- **Files:** `components/map/map-add-button.tsx`, `fullscreen-maps-client.tsx`.
- **Non-goals:** no inline Spot creation from the FAB yet.
- **Validation:** each link target; disabled state; analytics event fires.
- **Rollback:** hide the FAB (one prop).

### Slice F — Map feedback entry point

- **Goals:** reuse existing `feedback` system with map context in `page_url` + a `map` category; "Report wrong place / Suggest" link in the selected-pin panel.
- **Files:** API route (add `map` category if needed), `map-selected-panel.tsx` or a new lightweight inline form.
- **Non-goals:** no new DB table for this slice.
- **Validation:** submission appears in `/admin/feedback` + Discord embed fires.
- **Rollback:** hide the feedback entry point.

### Slice G — Admin map-health dashboard

- **Goals:** `/mastermind/maps` page; `lib/mastermind/map-health.ts` data module (coord coverage, active Spots, events w/ Spot link, pending suggestions); sidebar entry.
- **Files:** `app/mastermind/maps/page.tsx`, `lib/mastermind/map-health.ts`, `components/mastermind/sidebar.tsx`.
- **Non-goals:** no Google API.
- **Validation:** admin-gated (non-admin redirect); metrics render; no service-role key on client.
- **Rollback:** remove sidebar entry + page.

### Slice H — Google Places admin import (flag-gated, V2 — separate approval)

- **Goals:** migrations `0027` (enrichment columns) + `0028` (candidates table); `lib/google-places.ts`; `app/api/maps/google-places/{search,details}/route.ts` (cached, kill-switch); `/mastermind/maps/places-import`.
- **Non-goals:** no user-facing Google search, no client-side Google calls.
- **Validation:** zero API calls on map load; admin-only search; cache hit/miss behavior; quota guard; kill switch (`GOOGLE_PLACES_API_KEY` unset → graceful no-op); error states.
- **Rollback:** set `MAPS_GOOGLE_IMPORT_ENABLED=false`; revert route + migration.

### Slice I — User Spot suggestion from Google (V2 — separate approval)

- **Goals:** user can search Places, pick a candidate, submit a prefilled suggestion (`needs_audit`); admin approves → activity emitted.
- **Non-goals:** no auto-import, no bypassing `needs_audit`, no public display until approved.
- **Validation:** suggestion stays pending until admin action; approval → `NODE_CREATED` in activity_log; Discord embed fires.
- **Rollback:** flag off + revert migration `0029`.

---

## 13. QA and Release Plan

### Automated (per code slice)

```bash
npm run typecheck   # tsc --noEmit; must be 0 errors
npm run lint        # eslint; 0 errors (warnings OK if pre-existing)
npm run test        # node --test; all pass
npm run build       # next build; must succeed
```

Run from `collective-library/`.

### Manual QA for `/maps`

- `/maps` loads (auth-gated, redirects anon to login).
- `/maps?layer=members`, `/maps?layer=spots`, `/maps?layer=events` — correct pins visible.
- Floating layer chips toggle correctly.
- Add button opens menu; each action links to correct target; disabled states correct.
- Selected-pin bottom sheet (mobile 375px) — peek/half/full swipe.
- Selected-pin side panel (desktop) — ESC closes; selection persists.
- No console errors on any layer.
- **`/peta` is completely unchanged** (member pins, popups, jitter, all filter chips, privacy disclaimer).

### Privacy QA

- Member pins are approximate (not exact address).
- No phone/WhatsApp in any popup.
- No private or online event shows as a pin.
- `trackMapEvent` fires no PII.

### Data-readiness QA

- Migrations `0024_library_nodes` and `0025_events_node_id` applied in prod (STATE.md tracks this).
- At least a few active+public Spots carry `latitude`/`longitude` (loaders fail soft if none → empty layer, no crash).

### Google/API QA (V2 slices)

- Zero Google API calls on map page load.
- Admin-only search works (with valid key); graceful no-op (without key).
- Cache hit/miss behavior; quota guard activates at threshold.
- `MAPS_GOOGLE_IMPORT_ENABLED=false` fully disables the admin UI.

### Release path per slice

`feature/*` → PR → `staging` (Vercel preview; note preview is Deployment-Protected — QA while logged into Vercel) → staging QA → admin-merge to `main` (1-review ruleset; bypass with `--admin` for solo releases per established pattern). No force pushes to `main`.

### Rollback

Every slice is additive. Revert the PR. No migration is included in Slices A–G, so no DB rollback risk. Slices H–I include migrations; rollback plan listed per-slice.

---

## 14. Risk Register

| Risk                                       | Severity | Mitigation                                                                                                    | Blocker now?  |
| ------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------- | ------------- |
| Scope creep — V2 Google work pulled early  | High     | Strict slice gating; Google is flag-gated and deferred                                                        | No            |
| Google API cost explosion                  | High     | Backend-only, cached, admin-first, no per-load calls, quota guard, kill switch                                | No (deferred) |
| Privacy leak — member coords exposed       | High     | Preserve jitter/opt-in contract; reuse V1 loaders unchanged; `coordPrecision` field auditable                 | No            |
| Breaking `/peta` via canvas extraction     | High     | Slice B = zero-visual-change extraction; pixel/regression QA required before merging                          | No            |
| BottomNav / `max-w` fighting fullscreen    | Medium   | Dedicated `/maps` layout outside `(app)` — suppresses both constraints cleanly                                | No            |
| Stale / duplicate Spots, moderation burden | Medium   | Admin merge/close tools + verification timestamps + pending-until-approved                                    | No            |
| Empty map (anti-empty-state)               | Medium   | Anti-empty-state CTAs on every layer; gate layer chips on coord-bearing counts                                | No            |
| Mobile perf / Leaflet UX limits            | Medium   | Existing caps (Spots 500, events 200); clustering deferred until overlap demands it                           | No            |
| CI `Smoke tests (anonymous)` is red        | Low      | Pre-existing issue (Vercel Deployment Protection 401s anonymous curl); unrelated to this work; fix separately | No            |
| Vercel preview Deployment Protection       | Low      | QA previews while logged into Vercel; interactive checks only                                                 | No            |
| Admin-only route confusion                 | Low      | `requireAdmin()` gate + Mastermind sidebar (only admins see the section)                                      | No            |

---

## 15. Final Recommendation

### Build now

1. **Slice A (this doc)** — already done.
2. **Slice B (canvas extraction)** — first code slice; safest possible change; zero visual effect on `/peta`; unlocks everything that follows.
3. **Slice C (`/maps` fullscreen route)** — new additive route, no shared-code regression risk; existing data; floating layer chips; search bar Phase A.

### Do not build yet

- Any Google Places code or `lib/google-places.ts`.
- Enrichment or suggestion migrations (`0027`–`0029`).
- User-facing Spot creation from the FAB (host-eligibility flow is complex; ship FAB with that action disabled first).
- Live GPS / geolocation.
- Book-level map pins.
- Marker clustering (`react-leaflet-cluster`).
- Microsoft Clarity.

### Validate before Slice B

- Confirm migrations `0024`/`0025` are applied in the production Supabase project.
- Confirm at least a few active+public Spots carry `latitude`/`longitude` in prod (otherwise the Spots layer will be empty but safe).
- Confirm the **dedicated `/maps` layout approach** (outside `(app)`, no `PageShell`) is acceptable for the fullscreen UX goal — specifically that suppressing BottomNav for `/maps` is intentional product design.

### Is Google Maps API needed now?

**No.** Leaflet + Carto Positron is sufficient for V1.5. Google enters only as a flag-gated, backend-only admin enrichment layer in V2, well after the fullscreen route is live and proven.

### Exact first implementation prompt (Slice B)

> "Slice B — Extract a reusable, presentational `components/map/collective-map-canvas.tsx` from `components/map/map-view.tsx` (the `MapContainer`, `TileLayer`, marker `switch` branches, icon builders, popup components, `markerPosition`/jitter, and `.cl-popup` CSS). Add an optional `height` prop (default `480`) and/or a `className` prop for fill-mode. Refactor `MapView` to be a thin wrapper that renders the canvas at `height={480}` so `/peta` is byte-for-byte visually identical. No new route, no new UI, no behavior change. Run `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` and confirm `/peta` member pins, popups, and jitter are unchanged. Branch `feature/maps-canvas-extract` off `staging`; commit; stop and report before starting Slice C."
