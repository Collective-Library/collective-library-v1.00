# Spots (Library Nodes)

> Status: shipped end-to-end (Slices 1–6 of Phase 1.5). Public UI live at `/spots`.
> Last updated when public surface + event-detail Spot chip landed.

This doc explains what Spots are, what's already built, and — most importantly — what is **intentionally not built yet** so the next contributor doesn't bolt on public surfaces prematurely.

---

## What a Spot is

A **Spot** is a physical reading space with a digital identity inside Collective Library:

- cafe with a reading corner
- public bookshelf (Omah Baca Nawala-style)
- community space / venue
- school or campus reading room
- partner library
- coworking space with books
- any future "reading point" that bridges the digital app and a real-world place

Spots are **first-class data**, not a map feature. Maps are one possible rendering; the row in `library_nodes` is the truth.

A Spot can connect (over future slices) to:

- events held there (`events.node_id` — slice 3 ✅)
- books shelved there (`books.node_id` — reserved, not built)
- communities owning it (`library_nodes.community_id` — already wired)
- visits / check-ins (`node_visits` — reserved, not built)
- activity feed (`activity_log.NODE_CREATED` — slice 1 ✅)

---

## Naming decision

Two vocabularies live side-by-side. Don't unify them — each has a job.

| Surface                 | Term                                   | Why                                                                                                                                                 |
| ----------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Database table          | `library_nodes`                        | Builders, the foundation doc, and partnership pitches talk in "Library Nodes" (graph-theory framing — nodes in a network of places, books, people). |
| UI label                | **Spots**                              | End users see this everywhere. Concrete, casual, matches how JP members already say "ada spot baru di Tembalang."                                   |
| TypeScript DB-row type  | `LibraryNode`                          | Mirrors the DB.                                                                                                                                     |
| TypeScript UI alias     | `Spot`                                 | What components import. Currently `type Spot = LibraryNode`; will diverge if the UI shape ever drifts.                                              |
| Public route (reserved) | `/spots`                               | Consistent with existing English-primary routes (`/library`, `/activity`, `/wanted`). Indonesian alias `/tempat` reserved.                          |
| Activity log type       | `NODE_CREATED` (later: `NODE_VISITED`) | Internal — matches `EVENT_CREATED`, `MANIFEST_POSTED`.                                                                                              |

If you find yourself wanting to rename `library_nodes` → `spots` in the DB to "match the UI," resist. Renaming a table after rows exist costs a migration, breaks every existing query, and confuses anyone reading the strategic doc. The two-vocabulary rule is cheap.

---

## Permission model

| Operation                                    | Who                                  | How enforced                                                                                                                                                                                                                                                                                                                          |
| -------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SELECT public Spots                          | Anyone (anon + auth)                 | RLS `spots_select_public` — `status='active' AND visibility='public' AND is_active=true`.                                                                                                                                                                                                                                             |
| SELECT own / pending Spots                   | Owner + admin                        | Same policy, `created_by = auth.uid()` or `is_admin = true` branch.                                                                                                                                                                                                                                                                   |
| INSERT (host inline-create)                  | Auth user with ≥1 prior hosted event | RLS `spots_insert_host_eligible`. Server check in `isHostEligibleForSpotCreate` mirrors the policy for friendly UI gating.                                                                                                                                                                                                            |
| INSERT (admin curated)                       | Admin                                | Service-role client bypasses RLS, gated by `requireAdmin` in `/mastermind/spots/new` + `getAdminProfileOrNull` in API.                                                                                                                                                                                                                |
| UPDATE editable fields                       | Owner or admin                       | RLS `spots_update_owner_or_admin`.                                                                                                                                                                                                                                                                                                    |
| UPDATE `status` / `is_active` / `visibility` | Admin only                           | **Application-layer gate.** RLS allows owner writes; the admin gate lives in `/api/mastermind/spots/[id]` (server-side `getAdminProfileOrNull`) and the UI hides the controls from non-admins. Known column-level RLS gap, intentionally accepted — hardenable in a future migration with a `BEFORE UPDATE` trigger if abuse appears. |
| DELETE                                       | Owner or admin                       | RLS `spots_delete_owner_or_admin`.                                                                                                                                                                                                                                                                                                    |

A future `node_host` / `partner` role is reserved (mentioned in the migration header) but not built. Today "host-event-creator" is the closest practical proxy for a partner.

### Activity emission

The `emit_node_created` trigger fires on `library_nodes` **UPDATE**, only when:

```
old.status IS DISTINCT FROM new.status
AND new.status = 'active'
AND new.is_active = true
AND new.visibility = 'public'
```

So:

- Inserting a Spot (which lands as `needs_audit`) never emits.
- Admin promoting `needs_audit → active` emits exactly one row.
- Re-saving an already-active Spot does not duplicate.
- Inactive → active emits again (legit re-promotion).

The activity row records `actor_user_id = coalesce(new.created_by, auth.uid())` so admin-driven promotion of a Spot whose original creator was deleted still gets attributed meaningfully (to the admin who promoted).

---

## Data model

Full schema lives in `supabase/migrations/0024_library_nodes.sql`. Quick reference:

| Column                     | Type             | Notes                                                                                                           |
| -------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------- |
| `id`                       | uuid PK          | gen_random_uuid()                                                                                               |
| `name`                     | text NOT NULL    | length 3–140                                                                                                    |
| `slug`                     | text UNIQUE      | regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`                                                                              |
| `type`                     | text NOT NULL    | enum: `cafe`, `public_shelf`, `community_space`, `school`, `campus`, `library`, `coworking`, `partner`, `other` |
| `city`                     | text NOT NULL    | length 1–120                                                                                                    |
| `address`                  | text             | optional                                                                                                        |
| `latitude`, `longitude`    | numeric          | optional                                                                                                        |
| `maps_url`                 | text             | optional                                                                                                        |
| `description`              | text             | ≤2000 chars                                                                                                     |
| `image_url`                | text             | optional                                                                                                        |
| `operating_hours`          | text             | ≤500 chars, free-form                                                                                           |
| `community_id`             | uuid FK          | → `communities(id) on delete set null`                                                                          |
| `status`                   | text NOT NULL    | enum: `needs_audit` (default), `active`, `inactive`                                                             |
| `is_active`                | boolean NOT NULL | default true, admin kill-switch                                                                                 |
| `visibility`               | text NOT NULL    | enum: `public`, `community`, default `public`                                                                   |
| `created_by`               | uuid FK          | → `profiles(id) on delete set null`                                                                             |
| `created_at`, `updated_at` | timestamptz      | `set_updated_at` trigger                                                                                        |

**Two-field public gate.** A Spot only surfaces publicly when `status='active' AND visibility='public' AND is_active=true`. Both `status` and `is_active` exist on purpose:

- `status` = curation lifecycle (admin's signal of what's been reviewed).
- `is_active` = hard kill-switch independent of lifecycle (takedown without losing curation history).

Activity emit guard requires all three flags. The "Public-ready?" pill on the edit page is just a UI roll-up of the same boolean.

### Relations

- `events.node_id uuid NULL → library_nodes(id) ON DELETE SET NULL` — slice 3 ✅
- `activity_log.node_id uuid NULL → library_nodes(id) ON DELETE CASCADE` — slice 1 ✅
- `books.node_id` — **reserved, not created**
- `node_visits` (table) — **reserved, not created**

---

## What shipped

### Slice 1 — Data model (migration 0024)

- `library_nodes` table + indexes + RLS policies (4 policies).
- `activity_log` extension: `NODE_CREATED` type + `node_id` FK + index.
- `emit_node_created` trigger.
- TypeScript types in `types/index.ts`: `LibraryNode`, `Spot`, `SpotType`, `SpotStatus`, `SpotVisibility`, `SpotFormValues`.

### Slice 2 — Admin UI

- `lib/spots.ts` — admin CRUD via service-role client + option constants + `slugify` + community-options helper.
- `app/mastermind/spots/page.tsx` — list with status/type filters, search, inline `status` setter and `is_active` toggle.
- `app/mastermind/spots/new/page.tsx` — create form.
- `app/mastermind/spots/[id]/page.tsx` — edit form, status/active section, danger zone (hard delete).
- `app/api/mastermind/spots/route.ts` + `app/api/mastermind/spots/[id]/route.ts` — POST / PATCH / DELETE, server-side admin gate.
- `components/spots/spot-form.tsx`, `components/spots/spot-controls.tsx` — client components.
- `components/mastermind/sidebar.tsx` — added "📍 Spots" entry.

### Slice 3 — Event link (migration 0025)

- `events.node_id` nullable FK + index. Coexists with `location_text` / `location_url` / `is_online`.
- `lib/events.ts` — `EVENT_LIST_COLUMNS` extended, create/update persistence.
- `lib/spots.ts` — host-side helpers: `listSelectableSpots`, `isHostEligibleForSpotCreate`, `createSpotAsHost`, `SelectableSpot`, `HostSpotCreateInput`.
- `app/api/events/host-spot/route.ts` — host inline-create endpoint with RLS-aware error mapping.
- `components/events/event-spot-picker.tsx` — picker dropdown + inline-create panel (eligible hosts only).
- `components/events/event-form.tsx` — picker mounted in Step 1 when `!isOnline`; auto-fills `location_text` + `location_url` only when empty.
- `app/(app)/event/new/page.tsx` + `app/(app)/event/[id]/edit/page.tsx` — fetch `spots` + `eligibleHost` props.

### Slice 4 — Event detail integration

- `EventWithHost.node` field embedded via `lib/events.ts` join (`node:library_nodes(id, name, slug, type, city)`) in `getEvent`, `getUpcomingEvents`, `listEvents`.
- `app/(app)/event/[id]/page.tsx` — additive Spot chip below the host line ("📍 Di {name} · {city}"), links to `/spots/[slug]`. Public detail page still renders for events with `node_id IS NULL` byte-identically — chip just doesn't appear.

### Slice 5 — Public UI + QR-friendly URL

- `app/spots/page.tsx` — public list. Search + type-filter + city-filter. Card grid, empty state in JP voice. Outside `(app)` group → no auth wall.
- `app/spots/[slug]/page.tsx` — public detail. Hero with type badge + city + Maps button. About / Operating hours / Upcoming events sections. Reserved placeholder for books+activity. Includes the share/QR-ready URL row with copy-to-clipboard button.
- `app/mastermind/spots/[id]/page.tsx` — admin edit page gains a "Public URL & QR" section showing the stable path + copy button + "open public page in new tab" link (only when the Spot is publicly discoverable).
- `components/spots/copy-to-clipboard-button.tsx` — small client component shared by public detail and admin edit. Resolves `window.location.origin` at click time so the copied URL always matches the live deployment.
- `components/layout/hamburger-menu.tsx` — the "Places (Soon)" item is replaced with an active "Spots" link to `/spots`.

### Slice 6 — Documentation

- This file (updated for shipped state).
- `docs/STATE.md` — migrations 0024 + 0025 in the table; active backlog + decision log entries.

---

## Deferred backlog — DO NOT BUILD YET

Each item is intentional. The rationale matters more than the list.

| Item                                                                               | Status      | Why deferred                                                                                                                                                               |
| ---------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QR generation utility (image / PNG)                                                | Not built   | URL is already QR-able (`/spots/<slug>` stable); copy-to-clipboard ships in Slice 5. Build the image generator only when a partner specifically asks for printable assets. |
| `/peta` Spot layer (marker rendering for Spots)                                    | Not built   | `MapView` is hard-coded to `MapMember[]`. Needs a generic marker abstraction first. Skip until at least 5 Spots exist with `latitude`/`longitude` populated.               |
| `node_visits` table + check-in activity (`NODE_VISITED`)                           | Reserved    | Adds engagement loop. Land after QR usage proves people are actually scanning.                                                                                             |
| `books.node_id` + book ↔ Spot linking                                              | Reserved    | Higher cognitive load (book status × location × owner). Wait until the simple Spot → events linkage proves itself.                                                         |
| `node_host` / `partner` role                                                       | Reserved    | Today "host-event-creator" is the proxy. Introduce a real role only when a real partner asks (e.g., Omah Baca Nawala wanting volunteer accounts).                          |
| Partner dashboard                                                                  | Reserved    | Premature. Earliest signal would be a partner asking "where do I see visits to my Spot."                                                                                   |
| Map clustering / geo-search / Google Maps clone                                    | Won't build | Out of scope. Use Leaflet + Carto tiles + light filters when the map layer ships.                                                                                          |
| `BEFORE UPDATE` trigger hardening for `status` / `is_active` / `visibility` writes | Optional    | Application-layer admin gate is sufficient today. Promote to DB-level if RLS column-gap is ever exploited.                                                                 |
| Seed script `scripts/seed-spots.mjs` for 3–5 JP-adjacent Spots                     | Not written | Anti-empty-state requirement before any public surface. Write before slice 5, don't auto-run in CI.                                                                        |

If you find yourself wanting to build one of these "while you're in there," **stop**. Open an issue, link this section, get explicit approval. The foundation is small on purpose.

---

## Open questions

Answered (so future readers don't re-litigate):

- **Why `status` AND `is_active`?** Two concerns: lifecycle vs. takedown. Combining them into one column loses the distinction between "we haven't reviewed this yet" and "we're hiding it." See "Data model → Two-field public gate."
- **Why does the trigger fire on status transition, not on insert?** Mirrors `MANIFEST_POSTED` from migration 0023. Insert-time fire would emit junk activity for spots that never get promoted. Transition-time fire matches the human-meaningful event ("a new Spot is now part of the network").
- **Why does the admin use a service-role client instead of a UI-side Supabase call?** The `spots_insert_host_eligible` RLS policy requires `≥1 hosted event` — even admins fail it if they haven't hosted anything. Service-role bypasses the policy; the `requireAdmin` layout gate plus `getAdminProfileOrNull` API gate replace it.
- **Why is the picker additive instead of replacing `location_text`?** `location_text` is a 2-year-old field with rows depending on it. Forcing migration would break legacy events and force every host to interact with the picker — friction without compounding value. Picker auto-fills when empty; never trampling.

Still open:

- **When does the public `/spots` page ship?** Trigger: admin-approved Spots ≥ 3 in production + an external pull (a partner mentioning their Spot on socials).
- **How are Spot photos handled?** Currently free `image_url` text field. Will need a Supabase Storage bucket + image-compression flow (mirror `book-covers`) when the public surface ships.
- **Does a partnership with Omah Baca Nawala open the `partner` type as a special-cased UI surface, or stay generic?** Wait for the actual conversation before deciding.

---

## Where the code lives

```
collective-library/
├── supabase/migrations/
│   ├── 0024_library_nodes.sql         # table, RLS, trigger
│   └── 0025_events_node_id.sql        # events.node_id FK
├── lib/
│   ├── spots.ts                       # admin CRUD + host helpers
│   └── events.ts                      # extended for node_id
├── types/index.ts                     # Spot / LibraryNode / SpotFormValues
├── components/
│   ├── spots/
│   │   ├── spot-form.tsx
│   │   └── spot-controls.tsx
│   ├── events/
│   │   ├── event-form.tsx             # picker mounted here
│   │   └── event-spot-picker.tsx
│   └── mastermind/sidebar.tsx         # nav entry
├── app/
│   ├── mastermind/spots/
│   │   ├── page.tsx                   # list
│   │   ├── new/page.tsx               # create
│   │   └── [id]/page.tsx              # edit + danger zone
│   ├── api/
│   │   ├── mastermind/spots/
│   │   │   ├── route.ts               # POST create (admin)
│   │   │   └── [id]/route.ts          # PATCH / DELETE (admin)
│   │   └── events/host-spot/route.ts  # POST host inline-create
│   └── (app)/event/
│       ├── new/page.tsx               # picker props wired
│       └── [id]/edit/page.tsx         # picker props wired
└── docs/
    ├── spots/README.md                # this file
    └── STATE.md                       # migration table + backlog
```

`app/(app)/event/[id]/page.tsx` — **public event detail** — is **deliberately untouched**. Do not add a Spot section here without explicit approval.
