# Collective Maps — Audit (`/peta` today)

> Read-only audit of the existing map, profile/location, Spots, and Events stacks, written to ground the **Collective Maps** initiative (see [`MAPS_ROADMAP.md`](./MAPS_ROADMAP.md)). No code changes are described here. Pairs with [`STATE.md`](./STATE.md) (what shipped) and [`spots/README.md`](./spots/README.md) (Spots design intent).
>
> Audit date: 2026-05-31. Stack confirmed: Next.js 16.2.4 (App Router), React 19, TypeScript strict, Tailwind v4, Supabase (SSR + service-role), Leaflet ^1.9.4 + react-leaflet ^5, Carto Positron tiles.

## TL;DR

`/peta` is a **members-only** Leaflet map with a clean server-loads → client-renders separation and a privacy-first opt-in model. Spots (`library_nodes`) and Events both already exist with the data shapes needed to become map layers, but **neither is on the map yet** — the Spot marker layer is explicitly listed as reserved/deferred in `spots/README.md`. The work ahead is **additive layering on a clean base**, not a rewrite. Guiding formula: **Object + Location + Activity = Discovery**. Layer order: members (done) → Spots (stable physical nodes, exact coords) → Events (temporal, coords inherited from a linked Spot).

## 1. Map stack (members-only)

| File                                                                  | Type                               | Role                                                                                           |
| --------------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| [`app/(app)/peta/page.tsx`](<../app/(app)/peta/page.tsx>)             | Server Component (`force-dynamic`) | Fetches members + viewer, filters in-memory, renders chips + map + privacy card                |
| [`components/map/peta-client.tsx`](../components/map/peta-client.tsx) | Client                             | `dynamic(import('./map-view'), { ssr:false })` wrapper, "Memuat peta…" placeholder, 480px card |
| [`components/map/map-view.tsx`](../components/map/map-view.tsx)       | Client                             | Leaflet `MapContainer` + Carto Positron tiles + avatar markers + popups + jitter               |
| [`lib/profile.ts`](../lib/profile.ts)                                 | Server lib                         | `MapMember` interface + `listMembersForMap()` loader                                           |

**`peta/page.tsx`** — auth-gated by the `(app)` layout. Runs `Promise.all([listMembersForMap(), getCurrentProfile()])`, then filters the already-fetched set in-memory by `intent` + `open` (lending/selling/trade) read from `searchParams`. Two filter rows ("Available untuk" intent, "Mode" lending/selling/trade) built from `FilterPill`/`FilterRow`/`buildHref` as plain `<Link>`s (shareable, back-button-able URLs, zero client JS). The CTA flips between **"Tampilin gue"** and **"Edit lokasi"** based on whether the viewer is already on the map. Privacy card copy: _"Pin di-tempatin di tengah kecamatan, bukan alamat persis lo… Default mati — atur di profile lo."_

**`map-view.tsx`** — center default Semarang `[-6.9932, 110.4203]`; zoom `12` default, `13` for a single member, `11` for many (arithmetic-mean center, no `fitBounds`). Exports/locals worth reusing:

- `MapView({ members })` — the render loop maps `members` → `<Marker>` + `<Popup className="cl-popup">` (`map-view.tsx:39`).
- `MemberPopup` — rich popup: avatar, name, place (`address_area, city`), up to 4 book covers + `+N` overflow, "Lihat profil" → `/profile/[username]`.
- `buildAvatarIcon(member)` — 48×48 `L.divIcon` parchment bubble (photo or initial) with a book-count badge; `iconAnchor:[24,24]`, `className:"cl-marker"`.
- `deterministicJitter(id)` — FNV-1a hash → ±~0.0025° (~250 m) per axis, stable per id so a pin never moves between loads.
- `escapeHtml` / `escapeAttr` — used when building marker HTML.
- `popupCss` — the `.cl-popup` / `.cl-marker` parchment overrides, injected via `<style>`.

**`MapMember`** (`lib/profile.ts`): `id, full_name, username, photo_url, city, address_area, bio, profession, interests, intents, open_for_lending/selling/trade, map_lat, map_lng, book_count, book_covers`. **`listMembersForMap()`** selects from the `profiles_public` view where `show_on_map = true AND map_lat/map_lng IS NOT NULL AND username IS NOT NULL`, then joins up to 4 public non-hidden book covers + a public book count. The opt-in gate and approximate-coords contract are enforced **at the loader**, server-side.

## 2. Location authoring (how member coords get set)

- [`components/profile/location-picker.tsx`](../components/profile/location-picker.tsx) — kecamatan/kode-pos combobox → `GET /api/postal-code/lookup` (kodepos.vercel.app proxy, auth-gated, 30-day CDN cache). Returns `{ postal_code, village, district, regency, province, lat, lng }`.
- [`app/(app)/profile/edit/profile-edit-form.tsx`](<../app/(app)/profile/edit/profile-edit-form.tsx>) — resolves coords in priority order: fresh pick this session → existing stored coords → `/api/geocode` (Nominatim, auth-gated) fallback for legacy free-text users. Sets `city, address_area, postal_code, show_on_map, map_lat, map_lng`. **Clears coords to null when `show_on_map = false`.**
- Migrations: `0005_profile_extras` (`show_on_map`, `map_lat`, `map_lng`, view recreated), `0011_postal_code` (`postal_code`, view recreated).

## 3. Spots (`library_nodes`) — built, not on the map

- Table (`0024_library_nodes.sql`): `id, name, slug, type, city, address, latitude, longitude, maps_url, description, image_url, operating_hours, community_id, status, is_active, visibility, created_by, created_at, updated_at`. `latitude`/`longitude` are **nullable `numeric` (exact)**; `type` is a 9-value enum; `status ∈ {active, inactive, needs_audit}` (default `needs_audit`); `is_active boolean`; `visibility ∈ {public, community}`.
- **Public gate is compound:** `status='active' AND is_active=true AND visibility='public'`, enforced by RLS `spots_select_public` and re-stated defensively inside the loaders.
- [`lib/spots.ts`](../lib/spots.ts): `listPublicSpots(opts?)` (RLS-gated, returns full `Spot[]` incl. lat/lng), `getSpotBySlug(slug)`, `listSpotCities()`, `listUpcomingEventsForSpot(nodeId)`, plus admin-client loaders. Types `LibraryNode`/`Spot` + `SpotType` in [`types/index.ts`](../types/index.ts); emoji-per-type in [`lib/spots-constants.ts`](../lib/spots-constants.ts) (`SPOT_TYPE_OPTIONS`).
- Public surfaces shipped: `/spots` (list) and `/spots/[slug]` (detail with "Open in Maps"). **No `/peta` marker layer** — `spots/README.md` lists it under reserved/deferred.
- **Reality check:** many Spots may have **null coords**, so the map-relevant population is "active + public Spots **with** lat/lng", not total Spots.

## 4. Events — built, no direct coords

- Table (`0020_events.sql`, + `0022` social fields, + `0025_events_node_id.sql`): includes `title, starts_at, ends_at, timezone, location_text, location_url, is_online, visibility, status, is_hidden, cover_url, node_id`. **No lat/lng on events.** `node_id` is a nullable FK → `library_nodes`; coords can therefore only be **inherited from the linked Spot**.
- [`lib/events.ts`](../lib/events.ts): `listEvents({ filter:"upcoming" })` = `starts_at >= now() AND status='scheduled' AND is_hidden=false`; `getUpcomingEvents(limit)`. Both use a **shared join** `node:library_nodes(id, name, slug, type, city)` — note it **does not select latitude/longitude** (`EventWithHost.node` type is `{id,name,slug,type,city}`). Widening that shared join would ripple into `/event`, the landing strip, feeds, and `EventCard`.
- Online-only and location-text-only events have **no reliable coordinate** and must not become pins.

## 5. Platform conventions (must follow)

- **Modified Next.js:** per `AGENTS.md`, read `node_modules/next/dist/docs/` and the relevant `.agents/skills/*` SKILL.md (`next-best-practices`, `supabase`, `solid`, `vercel-react-best-practices`) **before writing code**.
- **Supabase clients:** SSR server client [`lib/supabase/server.ts`](../lib/supabase/server.ts) is RLS-enforced; service-role [`lib/supabase/admin.ts`](../lib/supabase/admin.ts) is **server-only, never shipped to client**. No client-side Supabase client.
- **Data access:** RSC server components await `lib/*` loaders directly (no API-route layer for reads). Loaders fail soft. `/map` is a rewrite alias for `/peta` in `next.config.ts` — keep both.
- **Scripts:** `npm run lint` (eslint), `npm run typecheck` (tsc --noEmit), `npm run test` (node --test), `npm run build`. `tsconfig` `strict: true`.
- **Branching:** `feature/* → develop → main`; never commit directly to `main`/`develop`. `npm run lint` before pushing.

## 6. What's reusable vs missing

**Reusable as-is:** the `page → peta-client → map-view` separation; Carto Positron tiles + `.cl-popup` CSS; `buildAvatarIcon`, `deterministicJitter`, `escapeHtml/Attr`; the `FilterPill`/`FilterRow`/`buildHref` query-string filter pattern; `listMembersForMap`, `listPublicSpots`, `listUpcomingEventsForSpot`; `SPOT_TYPE_OPTIONS` emojis; `lib/format.ts` date formatting; the privacy opt-in model.

**Missing (to build, gated per slice):** a typed multi-item model (today `MapView` is hard-typed to `MapMember[]`); map-shaped loaders for Spots and Events (`listSpotsForMap`, `listEventsForMap`); Spot/event marker icons + concise popups; a layer selector chip row; mobile full-bleed UX (Slice 5); map-activity/output panel (Slice 6).

## 7. Risks & data-readiness

- **`STATE.md` is internally inconsistent on Spots/Events migrations:** the schema table marks `0024`/`0025` as ⏳ _pending_ while the backlog marks Spots _shipped end-to-end_. **Before relying on Spot/event coords on the map, verify `0024` + `0025` are actually applied in prod** and that ≥ a few active+public Spots carry lat/lng. This is the data-readiness gate for Slices 3–4.
- **Mixing approximate (member) and exact (Spot) coords** on one surface — mitigated because members are kecamatan-center + jitter (no exact anchor to triangulate against); keep the disclaimer whenever members are shown and make the approximate/exact distinction explicit in code.
- **Overlap:** multiple events at one Spot land on the same coord (and on the Spot pin). Acceptable at low volume; distinct event glyph + popup disambiguates. Clustering (`react-leaflet-cluster`) is deferred backlog, not this initiative.
- **`numeric` → `number`:** `library_nodes.latitude/longitude` are nullable `numeric`; coerce with `Number()` and re-check non-null after any join (a Spot could be edited to clear coords even with `node_id` set).
- **Non-goals (explicit):** Google Maps / paid tiles, book-level pins, a new `/maps` route, clustering infra, Discord/X auto-posting, analytics dashboards, gamification — all out of scope for this initiative.
