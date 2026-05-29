# Distribution Layer Audit — Slice 7A

> Read-only audit. Maps every Discord and X / Twitter flow that ships today vs. what's missing. Drives a narrow Slice 7B that adds only what's safe without DB migration or automation.

**Headline finding.** **Manifest → X distribution is fully shipped end-to-end** (`ManifestXTemplate` + paste-back API + RLS-respecting helper + manifest detail page integration). **Event → Discord is fully shipped** (host-only announce button + idempotent `discord_announced_at`). **Event → X does NOT exist** (no schema field, no component). **Mastermind distribution queue does NOT exist.** A single Discord activity-log relay handles 4 of 7 activity types; 3 types (MANIFEST_POSTED, EVENT_CREATED, EVENT_RSVPED) silently no-op in the embed builder.

**Audited files.**

- `lib/socials.ts`
- `lib/manifests.ts`
- `lib/events.ts`
- `app/(app)/manifest/[id]/page.tsx`
- `app/(app)/event/[id]/page.tsx`
- `app/api/manifests/[id]/mark-x-posted/route.ts`
- `app/api/events/[id]/announce/route.ts`
- `app/api/discord-webhook/route.ts`
- `app/api/feedback/route.ts`
- `app/mastermind/page.tsx`
- `lib/mastermind/*`
- `components/manifest/manifest-x-template.tsx`
- `components/manifest/manifest-card.tsx`
- `components/events/discord-announce-button.tsx`
- `types/index.ts`
- `docs/BUSINESS_PROCESS.md`
- `docs/STATE.md`
- Supabase migrations `0020_events.sql`, `0023_manifests.sql`

---

## 1. Current Discord flows

| Surface                            | Trigger / action                                                | File / API                                                                                | Who can use                                                               | Data stored                                                                                        | Failure behavior                                                                                                         | Notes                                                                                                                                                                                                                                                   |
| ---------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Activity log → Discord channel** | Supabase Database Webhook → POST on every `activity_log` INSERT | `app/api/discord-webhook/route.ts`                                                        | System (Supabase webhook). Optional `DISCORD_WEBHOOK_SECRET` Bearer auth. | None on Supabase side — fire-and-forget.                                                           | 502 + console.error if Discord webhook fetch fails. No retry. Graceful no-op when `DISCORD_COMMUNITY_WEBHOOK_URL` unset. | **Embed builder only covers 4 of 7 activity types**: USER_JOINED, BOOK_ADDED, BOOK_STATUS_CHANGED, WTB_POSTED. Returns `null` for EVENT_CREATED, EVENT_RSVPED, MANIFEST_POSTED → those silently skip with `{ ok: true, skipped: "no embed for type" }`. |
| **Event host announce**            | Host clicks "Announce on Discord" on `/event/[id]`              | `app/api/events/[id]/announce/route.ts` + `components/events/discord-announce-button.tsx` | Host of the event only (server-side host check)                           | `events.discord_announced_at` ISO timestamp on success                                             | Returns `{ ok: true, discord: false }` if webhook misses; never blocks UX. Logs to console.warn.                         | Webhook URL: `DISCORD_EVENTS_WEBHOOK_URL ?? DISCORD_FEEDBACK_WEBHOOK_URL` (env fallback chain). Embed includes title, when, where, host, RSVP link, cover image. Idempotent on UI by the saved timestamp.                                               |
| **Feedback notify**                | User submits via `<FeedbackChip>`                               | `app/api/feedback/route.ts` + Supabase trigger fan-out                                    | Anyone (anon allowed)                                                     | Source-of-truth: `feedback` table row. Discord = notification only.                                | Fire-and-forget.                                                                                                         | Out of Slice 7 scope (already documented in STATE.md). Uses `DISCORD_FEEDBACK_WEBHOOK_URL`.                                                                                                                                                             |
| **Manifest announce**              | None today                                                      | —                                                                                         | —                                                                         | `manifests.discord_announced_at` column exists per schema but is **not written by any code path**. | n/a                                                                                                                      | The schema reserves the field; no UI or API path uses it. Either ship a manifest-Discord-announce flow later, or accept that manifest distribution is X-only.                                                                                           |

### Discord env vars in play

- `DISCORD_COMMUNITY_WEBHOOK_URL` — activity log relay (the broad community channel).
- `DISCORD_WEBHOOK_SECRET` — optional Bearer token to protect the receiver from spoofed POSTs.
- `DISCORD_EVENTS_WEBHOOK_URL` — events channel. Falls back to feedback if unset.
- `DISCORD_FEEDBACK_WEBHOOK_URL` — feedback channel; also the fallback for events.

---

## 2. Current X / Twitter flows

| Surface                           | Share method                                                                                                                                                                           | Save posted URL?                                                                                            | File / API                                                                                                          | Who can use                                                                                                          | Existing field                                                                                                                                             | Notes                                                                                                                                             |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Manifest → X**                  | `ManifestXTemplate` component: composes 280-char template (body + attribution + URL + hashtag), `Copy text` button, `Open in X` button using `https://twitter.com/intent/tweet?text=…` | Yes. Admin paste-back input → POST `/api/manifests/[id]/mark-x-posted` → server validates `https?://(x\.com | twitter\.com)/`regex →`markManifestXPosted(id, url)`writes`x_posted_url`+`x_posted_at`. Author or admin permission. | `components/manifest/manifest-x-template.tsx` + `app/api/manifests/[id]/mark-x-posted/route.ts` + `lib/manifests.ts` | Author (compose + paste-back). Admin (compose + paste-back). Anon: see backlink only.                                                                      | `manifests.x_posted_url` + `manifests.x_posted_at` (per migration 0023)                                                                           | **Fully shipped.** Embedded on `/manifest/[id]` page for approved manifests when viewer is author or admin. Backlink chip rendered on `/manifest/[id]` (and on `<ManifestCard>` via `x_posted_url`). Auto-truncate over 280 chars. |
| **Event → X**                     | **Does not exist.** No share template, no intent URL builder, no API endpoint.                                                                                                         | n/a                                                                                                         | n/a                                                                                                                 | n/a                                                                                                                  | **No `x_posted_url` or `x_posted_at` columns on `events` table.** Confirmed via `types/index.ts` Event interface and schema migrations 0020 + 0022 + 0025. | Event has rich social-activation fields (`theme`, `hashtags[]`, `instagram_url`, `community_*`) but no X-share tracking.                          |
| **Mastermind distribution queue** | **Does not exist.**                                                                                                                                                                    | n/a                                                                                                         | n/a                                                                                                                 | n/a                                                                                                                  | n/a                                                                                                                                                        | No panel in `/mastermind` lists pending-X manifests or pending-Discord events. Drill-down to share controls currently requires manual navigation. |
| **Activity → X**                  | None — out of scope per BUSINESS_PROCESS.md (activity is high-frequency; manual X share is for curated items only).                                                                    | n/a                                                                                                         | n/a                                                                                                                 | n/a                                                                                                                  | n/a                                                                                                                                                        | Correct deferral. Activity goes to RSS / Discord channel automatically; X is for editorial moments.                                               |

---

## 3. Data model readiness

### Manifest

- `x_posted_url`: ✅ exists, used.
- `x_posted_at`: ✅ exists, used.
- `discord_announced_at`: ✅ exists, **NOT used** (reserved column with no code path).
- Existing API / server action: ✅ `markManifestXPosted` (lib/manifests.ts) + `/api/manifests/[id]/mark-x-posted` (POST).

### Event

- `x_posted_url`: ❌ does not exist on `events` table.
- `x_posted_at`: ❌ does not exist on `events` table.
- `discord_announced_at`: ✅ exists, used by host-announce flow.
- Existing API / server action: ✅ Discord-only — `/api/events/[id]/announce`.

### Activity

- Can it be shared? Yes — activity_log rows already fan out to Discord channel via Supabase webhook.
- Should it be shared on X? **No.** Activity is high-frequency. X is curated editorial. Sharing every activity to X would spam and dilute the brand voice.

---

## 4. Safe implementation candidates (no DB migration)

**A. Event X intent-only share button (no URL recording).** Since `events` table has no `x_posted_url`, we cannot record the posted URL. But we CAN add a share-to-X button that opens `https://twitter.com/intent/tweet?text=…` with a prefilled compose template (title + date + URL + optional hashtag). No DB write, no admin paste-back input, no API endpoint. The host clicks → X opens with prefilled text → host posts manually. We accept the loss of backlink tracking; that's the cost of avoiding a migration. **Risk: low.** Implementation: ~1 new component file + 1 page edit.

**B. Mastermind distribution queue panel (admin-only, read-only).** Lists:

- Approved manifests where `x_posted_url IS NULL` (= "still to share on X").
- Upcoming events where `discord_announced_at IS NULL` (= "still to announce on Discord").
- Optionally, upcoming events at all (= "still to share on X" — no field to filter, so all upcoming).

Each row links to the relevant detail page where the existing share controls live. Pure listing, no new mutations. Uses existing `manifests.x_posted_url` and `events.discord_announced_at` columns. **Risk: low.** Implementation: ~1 file edit on `app/mastermind/page.tsx`. Inline queries via existing Supabase admin client; no new helper needed (this is a single-purpose read).

**C. Extend Discord webhook embed builder for EVENT_CREATED, EVENT_RSVPED, MANIFEST_POSTED.** Today the activity-log relay silently no-ops on these three types (`buildEmbed` returns `null`). Adding embed cases for the three event/manifest types makes the community Discord channel feel more alive — currently it only reflects books + members + WTB. **Risk: low** but introduces fan-out volume that the founder might not want by default. **Defer** to its own slice if/when founder confirms they want events + manifests pushed to the community channel automatically (right now Manifest pushes are intentionally curated via the X workflow, and Events have their own dedicated host-announce flow).

**D. Manifest Discord-announce flow.** Schema reserves `manifests.discord_announced_at` but no code uses it. Could mirror the event host-announce pattern: button on `/manifest/[id]` (admin-only since manifests need approval), API endpoint, idempotent timestamp. **Risk: low.** Implementation: 1 new API route + 1 page edit + 1 button component. **Defer** — `ManifestXTemplate` already covers manifest distribution; a Discord-announce flow can wait until founder validates that the X-only workflow has gaps.

---

## 5. Risky / deferred

- ❌ Event `x_posted_url` tracking — requires schema migration.
- ❌ Discord bot infrastructure (per-user DM, role sync).
- ❌ Automated X API posting (requires API auth + token storage + rate limits + editorial loss).
- ❌ Automated retry system on Discord webhook failures.
- ❌ Activity → X auto-post (volume + voice issues).
- ❌ Cross-posting to multiple X accounts.
- ❌ Scheduled/queued X posts (queue infra + cron + retry).
- ❌ Webhook idempotency hardening (Supabase doesn't guarantee single-delivery; current code accepts occasional doubles).
- ❌ Per-channel Discord routing beyond the existing 3 env vars.

---

## 6. Proposed Slice 7B

Per the user's "narrow scope, ≤3 files unless strongly justified" directive, the highest-leverage slice that does NOT require a DB migration:

### Slice 7B scope: Event X intent-only + Mastermind distribution queue

**Surfaces:** 2. **Files modified:** 3 (1 new, 2 edited).

**1. New file: `components/events/share-to-x-button.tsx`**

A simpler cousin of `ManifestXTemplate` — intent-only, no paste-back input, no API call. Composes a 280-char-aware template from `Event` props (title + date + URL + optional first hashtag from `event.hashtags`), shows the preview, exposes one button "Open in X" that opens `twitter.com/intent/tweet`. Optionally a "Copy text" button for users who prefer to paste manually.

The component shows for **host or admin** (mirrors who can announce on Discord). Hides for everyone else. Renders nothing if event is cancelled or past.

**2. Modified: `app/(app)/event/[id]/page.tsx`**

Pass current viewer profile (already loaded via `getCurrentProfile()` if added, or `getCurrentUser()` + admin check). Render `<ShareToXButton>` beside the existing `<DiscordAnnounceButton>` for host or admin viewers. Single insertion.

**3. Modified: `app/mastermind/page.tsx`**

Add a new section "Distribution queue" with two sub-cards:

- **Approved manifest, belum di-share ke X** — inline query: approved + public manifests where `x_posted_url IS NULL`. Show count + 5 most recent rows with title snippet + `Buka manifest →` link.
- **Event mendatang, belum di-announce ke Discord** — inline query: upcoming events where `discord_announced_at IS NULL`. Show count + 5 nearest with title + when + `Buka event →` link.

Admin-only (`is_admin` gate already in `/mastermind` layout). No mutations from this panel — clicking through to the detail page is where the share buttons live.

**Out of scope for Slice 7B** (deferred):

- Manifest Discord-announce flow (candidate D in §4).
- Extending Discord activity-log webhook for new types (candidate C in §4).
- Any DB column add.
- Any Discord bot infra.
- Any X API automation.

### Verification plan for Slice 7B

- `npm run lint` → expect 0 errors.
- `npx tsc --noEmit` → expect exit 0.
- Dev server:
  - `GET /event/[any-id]` — page compiles, renders normally for non-authed (no X button, no Discord announce — auth-gated).
  - `GET /mastermind` (as admin) — Distribution queue section renders; counts match a quick supabase query.
  - `HEAD /home`, `HEAD /shelf`, `HEAD /auth/login`, `GET /feed.xml`, `GET /feed.json` — unchanged.
- Manual founder QA (sign-in required):
  - As event host, view `/event/[id]`. Confirm `Share di X` button appears beside the existing Discord announce. Click → X compose tab opens with prefilled title + date + URL.
  - As event host, click `Copy text` (if implemented) → toast confirms copy.
  - As non-host non-admin viewer on `/event/[id]`. Confirm X share button is absent.
  - As admin, navigate to `/mastermind`. Confirm "Distribution queue" panel renders with two sub-cards. Click a manifest link → land on `/manifest/[id]` with `ManifestXTemplate` visible. Click an event link → land on `/event/[id]` with Discord announce button visible.
  - As non-admin, navigate to `/mastermind` → existing redirect to `/shelf` (or wherever) still gates correctly.
- Privacy check:
  - Distribution queue queries pull only `id`, `title`, `created_at`, `starts_at`, `x_posted_url IS NULL`, `discord_announced_at IS NULL`. No PII, no contact fields.
  - Event share template only uses public event fields (title, starts_at, URL).

---

## Cross-references

- `docs/BUSINESS_PROCESS.md` §3 — Discord and X as ecosystem layers.
- `docs/STATE.md` — decision log entries about Discord webhook architecture + manifest X workflow + manual-first posture.

---

**Last updated:** 2026-05-28 (Slice 7A audit, pre-implementation). Slice 7B can ship without DB migrations using only this slice's findings.
