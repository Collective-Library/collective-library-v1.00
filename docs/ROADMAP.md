# Roadmap

> Phased delivery for Collective Library. See [`BUSINESS_PROCESS.md`](./BUSINESS_PROCESS.md) for the ecosystem loop these phases compound into, and [`STATE.md`](./STATE.md) for what has actually shipped.

## Phase 1 — Solid MVP foundation (✅ shipped)

- Book, profile, directory, map, wanted, event, manifest, spots flows.
- Activity log with Postgres triggers and Discord webhook fan-out.
- Mastermind founder cockpit (Mission Control, OKRs, tasks, intelligence panels).
- RSS/JSON feeds, Instagram strip, public profiles, hCaptcha-gated auth (email + Google + Discord).
- Contributor onboarding docs, issue and PR templates.

## Phase 2 — Ecosystem alignment (✅ shipped — staging `8722631`)

The goal of this phase is **coherence**, not features. Make every existing surface speak to every other surface. Sliced for low-risk execution:

1. **Slice 1** — Docs single source of truth (`BUSINESS_PROCESS.md`, `BRAND_AND_VOICE.md`, vision update).
2. **Slice 1.5** — Navigation audit (read-only).
3. **Slice 2** — Shared `nav-config.ts` + nav alignment.
4. **Slice 3A** — Build `/home` ecosystem cockpit with live signals.
5. **Slice 3B** — `/shelf` scope cleanup (move home widgets to `/home`).
6. **Slice 3C** — Decide post-login default landing route.
7. **Slice 4** — First-contribution onboarding.
8. **Slice 5** — Connection moments across cards.
9. **Slice 6** — Activity copy refinement.
10. **Slice 7** — Discord and X as documented ecosystem layers.
11. **Slice 8** — Public landing + authed pulse polish.
12. **Slice 9** — Mastermind action intelligence.

Each slice ships independently with a stop-and-report gate before the next.

---

## Next Development: Output Layer

> **Status: not implemented.** Plan only. Do not build until production from Phase 2 is stable.

Collective Library should make important community activity visible outside the web app through three
output channels: Discord, X/Twitter, and analytics. This is a distribution and visibility layer, not
a feature layer. It does not change core user flows — it amplifies signals that already exist.

### 1. Discord Output Layer

**Goal:** Fan important Collective Library activities to Discord channels via incoming webhooks.

Activities to announce:

- New user / profile completed
- New book added
- New place / Spot created
- New event created
- New manifest published
- New feedback submitted
- Contributor journey milestone completed

Implementation direction:

- Incoming webhooks first. No full Discord bot yet.
- All sends are server-side only.
- Missing env vars must not crash the app — skip gracefully.
- Discord failure must not block any core user action.

Potential env vars:

```
DISCORD_ACTIVITY_WEBHOOK_URL
DISCORD_FEEDBACK_WEBHOOK_URL
DISCORD_EVENTS_WEBHOOK_URL
DISCORD_MANIFEST_WEBHOOK_URL
```

Note: `DISCORD_COMMUNITY_WEBHOOK_URL` already wires `MANIFEST_POSTED` and events (shipped in Phase 2).
The above are future channel-specific webhooks for more granular routing.

---

### 2. X/Twitter Output Layer

**Goal:** Prepare public distribution through X, starting manual-first.

Phase 1 (manual):

- Admin social-output page at `/mastermind/social` or similar
- Suggested X post copy generated from manifest/event data
- Copy-to-clipboard button
- "Open in X compose" intent URL (already shipped for events + manifests)

Phase 2 (future — do not build yet):

- X API posting via server-side route
- Autobase-style account management

Do not build real X API posting in the next development cycle. Manual-first stays the strategy
until there is clear demand and proper API key management in place.

Future env placeholders (reserve now, do not wire yet):

```
X_API_KEY
X_API_SECRET
X_ACCESS_TOKEN
X_ACCESS_TOKEN_SECRET
X_BEARER_TOKEN
X_AUTOBOT_ENABLED=false
```

---

### 3. Analytics Layer

**Goal:** Behavior visibility without overbuilding. Understand what users actually do.

**Microsoft Clarity (priority):**

- Load only in production
- Do not load if `NEXT_PUBLIC_CLARITY_PROJECT_ID` env var is missing
- Respect privacy — no PII in event names

```
NEXT_PUBLIC_CLARITY_PROJECT_ID
```

**Custom event tracking via `lib/analytics.ts`:**

```ts
trackEvent(name: string, properties?: Record<string, unknown>): void
```

Events to track:

- `sign_up_started`
- `profile_completed`
- `book_added`
- `place_added`
- `event_created`
- `manifest_viewed`
- `discord_join_clicked`
- `journey_started`
- `journey_completed`
- `invite_clicked`

---

### Output Layer guardrails

- No unnecessary dependencies added to the bundle
- No secrets or API keys exposed to the client
- No Discord bot — incoming webhooks only for now
- No X auto-posting — manual intent URLs until explicit decision
- No user flow blocked if an output channel fails
- Manual-first at every layer: observe behavior before automating

---

## Collective Maps — `/peta` spatial discovery

> **Status: Slice 1 shipped (docs only).** Full audit + design in [`MAPS_AUDIT.md`](./MAPS_AUDIT.md) and [`MAPS_ROADMAP.md`](./MAPS_ROADMAP.md). Subsequent slices gated behind explicit per-slice approval.

Evolve `/peta` from a members-only map into the ecosystem's spatial discovery surface — _"where is the knowledge network around me?"_ Layered, additive, no rewrite. Formula: **Object + Location + Activity = Discovery**.

- **Slice 1** — Audit + roadmap docs (✅ shipped).
- **Slice 2** — `CollectiveMapItem` discriminated union (`lib/map.ts`) + `MapView` refactor to typed items, members only, **zero behavior change**.
- **Slice 3** — Spots layer + "Tampilkan" chip row (`listSpotsForMap`, public+active+coords).
- **Slice 4** — Events layer + Event chip (`listEventsForMap`, public+upcoming, coords inherited from linked Spot).
- **Slice 5** — Mobile full-bleed UX (sticky filters, bottom sheet, floating Add, legend).
- **Slice 6** — Map-activity panel + Discord/X output prep (manual-first, per Output Layer above).

Guardrails: keep Leaflet + Carto Positron (no Google Maps / paid tiles), keep the `/peta` route, members stay approximate (kecamatan + jitter) while Spots/events use exact public coords, no book-level pins, no new route, no clustering infra until overlap demands it.

---

## Phase 3 — Contributor identity

- Contributor role model (data design exists in [`features/CONTRIBUTOR_ROLES_AND_DISCORD_SYNC.md`](./features/CONTRIBUTOR_ROLES_AND_DISCORD_SYNC.md)).
- Manual admin assignment flow.
- Public profile badges (multi-badge + primary badge).
- Basic moderation notes and evidence tracking.

## Phase 4 — Discord integration (deeper)

- Define Discord role mapping strategy.
- OAuth account-linking design.
- Bot/webhook sync strategy with safeguards.
- Per-user DM capability (requires proper bot infra).

## Phase 5 — GitHub contribution sync

- Contribution signal mapping (issues, PRs, docs).
- Badge recommendation logic.
- Manual override and dispute flow.

## Phase 6 — Signal model expansion

- Book intellectual signal layer (owned / reading / want_to_read / available_to_lend etc.).
- Wanted `type` enum (borrow / discuss / swap / recommendation).
- These are schema changes — staged with care; not in current ecosystem-alignment scope.

## Phase 7 — Multi-city scaling

- Community replication playbook.
- Local governance toolkit.
- Shared but decentralized data + trust standards.
