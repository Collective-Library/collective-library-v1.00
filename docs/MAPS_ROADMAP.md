# Collective Maps — Roadmap (`/peta` evolution)

> Design + sliced delivery plan for turning `/peta` into **Collective Maps**, the spatial discovery surface of the ecosystem. Grounded in [`MAPS_AUDIT.md`](./MAPS_AUDIT.md); slots under [`ROADMAP.md`](./ROADMAP.md); shipped state tracked in [`STATE.md`](./STATE.md). Each slice ships independently behind a **stop-and-report approval gate**.
>
> Created: 2026-05-31. Constraint: keep Leaflet + Carto Positron (no Google Maps / paid API), keep the `/peta` route, members stay approximate, Spots before Events.

## Product definition

A user opens `/peta` and immediately understands _"where is the knowledge network around me?"_ — who's around, which reading Spots are alive, what's happening soon, and how to contribute. This is a **trust + discovery** surface, warm and bookish — **not** a logistics/GIS map.

Core formula: **Object + Location + Activity = Discovery**.

- A member with books + intents → a reader node (approximate).
- A public, active Spot → a place node (exact).
- An upcoming public event linked to a Spot → a temporary activation node (borrows the Spot's coord).

## Desired UX

Mobile-first map with a top **"Tampilkan"** chip row (Semua / Anggota / Spots / Event). Member bubbles feel human (existing avatar + book-count), Spot pins feel place-based (type emoji), event pins feel timely (date glyph). One concise popup + one clear CTA per pin. Existing member intent/mode filters stay — but only render while members are in view. Privacy disclaimer stays whenever members are shown.

**In scope:** layering Spots then Events onto `/peta`; the typed-union refactor that makes it safe; mobile UX polish.
**Out of scope (defer / separate approval):** Google Maps, book-level pins, clustering infra, a new `/maps` route, Discord/X auto-output, analytics dashboards, gamification, AI recommendations, native app, new migrations.

## Technical design

**Type model — a discriminated union (the "simple typed union", not a universal abstraction), in a new `lib/map.ts`.** Each variant keeps its full typed row in `data`, so popups stay rich and strict-clean (no `metadata: Record<string, unknown>` escape hatch):

```ts
// lib/map.ts (proposed — built in Slice 2)
export type MapItemType = "member" | "spot" | "event";
interface MapItemBase {
  key: string;
  lat: number;
  lng: number;
  coordPrecision: "approximate" | "exact";
}
export interface MemberMapItem extends MapItemBase {
  type: "member";
  data: MapMember;
}
export interface SpotMapItem extends MapItemBase {
  type: "spot";
  data: { id; name; slug; spotType: SpotType; city; image_url; description; maps_url };
}
export interface EventMapItem extends MapItemBase {
  type: "event";
  data: { id; title; starts_at; timezone; cover_url; spot: { name; slug; city } | null };
}
export type CollectiveMapItem = MemberMapItem | SpotMapItem | EventMapItem;
export function memberToMapItem(m: MapMember): MemberMapItem; // approximate, key `member:${id}`
```

`key` is type-prefixed (avoids cross-type id collisions; doubles as jitter seed). `href` is derived in the renderer, not stored. **`coordPrecision` is load-bearing:** it gates jitter (members only) and the kecamatan disclaimer.

**Loaders — dedicated map loaders, no aggregator yet.**

- Members: `listMembersForMap()` unchanged; add a pure `memberToMapItem` mapper.
- Spots: new `listSpotsForMap()` in `lib/spots.ts` — selects `id,name,slug,type,city,image_url,description,maps_url,latitude,longitude`, compound public gate + `.not(latitude/longitude, is, null)`, `limit(500)`, `Number()`-coerced, `coordPrecision:"exact"`.
- Events: new `listEventsForMap()` in `lib/events.ts` — **do not widen the shared `node` join** (it ripples into `/event`, feeds, `EventCard`). Select via `node:library_nodes!events_node_id_fkey(name,slug,city,latitude,longitude)`, filter `is_hidden=false, visibility='public', status='scheduled', node_id NOT NULL, starts_at>=now`, `limit(200)`, then `.flatMap` **drops** events whose linked Spot has null coords. Online-only / location-text-only events are excluded by `node_id NOT NULL`.

**MapView refactor (zero behavior change for members).** Prop `members:MapMember[]` → `items:CollectiveMapItem[]`; `useMemo` center/zoom over `item.lat/lng`; per-marker `switch(item.type)` where the `member` branch is a **literal copy** of today's code; a `position(item)` helper applies `deterministicJitter` **only** when `coordPrecision==="approximate"`. Icons: member = existing avatar bubble; spot = parchment place-pin with `SPOT_TYPE_OPTIONS` emoji (tip anchor); event = same chassis + date glyph (distinguishes an event stacked on its Spot's coord). Popups: member = existing rich `MemberPopup` (untouched); spot = name/type/city + "Lihat Spot" → `/spots/[slug]` + optional "Buka di Maps"; event = title + formatted `starts_at` (reuse `lib/format.ts`) + "di {spot}" + "Lihat event" → `/event/[id]`. All reuse `.cl-popup` CSS.

**Page / filter wiring — keep server-side query-string filtering** (shareable URLs, no new client boundary, small payload). Extend `SP` + `buildHref` with `layer?: "members"|"spots"|"events"`. Add a "Tampilkan" `FilterRow` (Semua/Anggota/Spots/Event). Member intent+mode rows render only when the active layer includes members. Header/empty copy switches per layer. Disclaimer stays members-scoped.

## Security & privacy rules

- **Members:** opt-in only (`show_on_map`), kecamatan-center + ±250 m deterministic jitter, never exact address; no phone/WhatsApp/bio/profession in the map payload.
- **Spots:** only `status='active' AND is_active=true AND visibility='public'` reach the map (RLS + defensive filter + `NOT NULL` coord filter). Exact coords OK (public places).
- **Events:** only public, non-hidden, scheduled, upcoming, **and** linked to a coord-bearing public Spot. Online / private-location events never become pins. Coords inherited from the public Spot only.
- **Data plane:** all loaders server-side via the RLS-enforced SSR client; never the service-role key client-side; client receives display-safe projections only; fail soft (`return []`). No new public API endpoints. Re-check `node.latitude == null` after the join.

## Slices

- **Slice 1 — Audit & design docs (this + `MAPS_AUDIT.md`).** ✅ Docs only. No code/migration/dep/route change.
- **Slice 2 — Type + MapView refactor (members only, zero behavior change).** New `lib/map.ts`; edit `components/map/map-view.tsx`, `components/map/peta-client.tsx`, `app/(app)/peta/page.tsx`. Acceptance: member pins/popups visually identical.
- **Slice 3 — Spots layer + chips.** New `listSpotsForMap()` (`lib/spots.ts`); `spot` branch in `map-view.tsx`; `layer` + "Tampilkan" chip row (Semua/Anggota/Spots) in `peta/page.tsx`; member filter rows gated to member-inclusive layers. Honor anti-empty-state: gate the Spots chip on coord-bearing public-Spot count.
- **Slice 4 — Events layer + chip.** New `listEventsForMap()` (`lib/events.ts`); `event` branch in `map-view.tsx`; Event chip + inclusion under `all`/`events` in `peta/page.tsx`.
- **Slice 5 — Mobile UX upgrade (separate approval).** Full-bleed height, sticky filters, bottom sheet, floating Add (Tambah buku / Tambah Spot / Buat event / Edit lokasi gue), legend, selected-pin state.
- **Slice 6 — Activity & output (separate approval).** Recent map-activity panel; Discord/X output prep. **No X/Discord auto-post without explicit approval** (aligns with `ROADMAP.md` Output Layer: manual-first).

## Test plan (per code slice)

- **Automated:** `npm run typecheck` (strict clean), `npm run lint`, `npm run test`; `npm run build` for Slices 3+. Run from `collective-library/`.
- **Functional:** `/peta` loads (authed); member markers + intent/mode filters + reset still work; popups link correctly; mobile + desktop usable; empty states OK.
- **Data:** members only when `show_on_map=true` + coords present; Spots only public+active+coords; events only public+upcoming+coord-bearing Spot; no private fields in client payload.
- **Privacy:** member pins approximate; no address/phone/WhatsApp; no private/online event location on map.
- **Regression:** `/anggota`, `/profile/[username]`, `/profile/edit`, `/spots`, `/spots/[slug]`, `/event`, `/event/[id]`, landing, sitemap/metadata unbroken — especially confirm the shared `lib/events.ts` join + `/event` list are unaffected (the dedicated map loader isolates this).
- **Visual:** member vs Spot vs event markers distinguishable; chips readable; popups not cramped; map height OK on mobile; no horizontal overflow.
- **Preview:** after Slices 3/4, start the dev server and use preview tools — snapshot `/peta`, toggle each chip, confirm Spot popups → `/spots/[slug]` and event popups → `/event/[id]`, check console/network, screenshot mobile + desktop.

## Release plan

Branch `feature/* → develop → main` per `AGENTS.md`; Vercel preview per PR; verify on preview before merge to `main` (prod = collectivelibrary.vercel.app). Gate per slice: typecheck+lint+test green → preview QA (functional/data/privacy/regression/visual) → merge. Slice 2 gate = "members visually identical" diff review. Slices 3/4 gate also = **data-readiness** (migrations `0024`/`0025` applied; ≥ a few coord-bearing public Spots / events) so layers don't ship empty. Rollback = revert the PR; no migration in Slices 1–4, so no DB rollback risk.

## Recommendation

Build **Slice 1 first** (zero-risk docs; locks the design), then **Slice 2** (typed-union + `MapView` refactor, zero behavior change), then **Slice 3** (Spots), then **Slice 4** (Events). Spots before Events because Spots are stable nodes with their own exact coords, while events inherit coords from Spots — Events depend on Spot data quality.
