# Connection Moments Audit — Slice 5A

> Read-only audit. Maps which surfaces already carry "why-you-should-connect" signals vs. which need work. Drives a narrow Slice 5B implementation plan that avoids over-engineering.

**Headline finding.** Connection-moments infrastructure is **more shipped than expected**. Five of the eight audited surfaces already render rich proximity / shared-interest / intent / RSVP-context signals from existing data. The remaining gaps are small and concentrated in two surfaces, with one tiny data-shape extension needed.

**Audited files.**

- `components/books/book-card.tsx`
- `components/profile/member-card.tsx`
- `components/events/event-card.tsx`
- `components/events/attendee-card.tsx` (referenced by event detail attendee list)
- `app/(app)/event/[id]/page.tsx`
- `components/events/rsvp-context-prompt.tsx`
- `components/manifest/manifest-card.tsx`
- `components/activity/activity-copy.ts`
- `components/activity/activity-feed.tsx`
- `components/activity/activity-feed-list.tsx`
- `lib/activity.ts`
- `lib/events.ts`
- `lib/manifests.ts`
- `lib/profile.ts`
- `types/index.ts`

---

## 1. Surface inventory

| Surface                        | File                                               | Current data available                                                                                                                                                                                                             | Connection signals possible now                                                                                                                                                                                      | Needs extra query/helper?                                                                                                                                                                                          | Privacy risk                                                               | Recommendation                                                                                                                                                                                                                                        |
| ------------------------------ | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Book card**                  | `components/books/book-card.tsx`                   | `book.owner.city` is in `BookWithOwner` (via `profiles_public`); price, status, community badge                                                                                                                                    | Same-city proximity chip is the natural add. Requires VIEWER profile's city, which is **not currently passed** to BookCard.                                                                                          | Yes — viewer profile must be plumbed via prop or context. Owner city already on the row.                                                                                                                           | LOW. `owner.city` is already in `profiles_public`.                         | **Defer.** Adding viewer-context plumbing touches every BookCard caller (`/shelf`, `/library`, landing strip, `/discover`, profile detail). Medium-risk for cosmetic gain. Revisit when viewer-aware list pages exist.                                |
| **Member card**                | `components/profile/member-card.tsx`               | `city · address_area`, `profession`, `bio`, `interests` (top 4 via `InterestList`), `intents` (top 3 via `IntentList`), `book_count`, `open_for_lending/selling/trade` rendered as "Buka:" tags                                    | Already shows ALL of these. **One gap:** `open_for_discussion` is missing from the "Buka:" tags and from `MemberSummary` / `listMembers` SELECT entirely.                                                            | Yes, but trivial — extend `MemberSummary` interface + `listMembers` SELECT to include `open_for_discussion`.                                                                                                       | NONE — already a public boolean on `profiles_public`.                      | **Low-risk win.** Add `open_for_discussion` to type + query + UI line. Single coherent change.                                                                                                                                                        |
| **Event card**                 | `components/events/event-card.tsx`                 | Host avatar + name, time/timezone, location, RSVP count, optional `node` (Spot link), online badge, cancelled badge                                                                                                                | Attendee-context preview ("3 bawa buku · 2 mau diskusi") would surface. Aggregate counts not currently computed.                                                                                                     | Yes — would need `getUpcomingEvents` / `listEvents` to return aggregate counts of RSVPs with `bringing_book` / `conversation_topic` non-null. Touches multiple call sites (landing strip, `/home`, `/event` list). | NONE — counts only, no PII leak.                                           | **Defer to medium-risk lane.** Cost: query weight + multi-aggregate Supabase quirks. Defer until founder confirms attendee-context fields actually get filled (they currently require manual `RsvpContextPrompt` engagement, so adoption may be low). |
| **Event detail attendee list** | `app/(app)/event/[id]/page.tsx` → `<AttendeeCard>` | Full `EventRsvpWithProfile`: avatar, displayName, `rsvp.origin_city ?? p.city`, `p.interests.slice(0, 3)` chips, `p.book_count`, `rsvp.bringing_book`, `rsvp.conversation_topic`, IG icon → IG profile link, profile click-through | **Best-in-class surface today.** Renders city + top interests + book count + bringing-book + conversation-topic + IG + profile link. Already implements every connection moment cataloged in BUSINESS_PROCESS.md §7. | No                                                                                                                                                                                                                 | NONE — uses `profiles_public` and RSVP context. IG only shown when filled. | **No change needed.** Already shipped.                                                                                                                                                                                                                |
| **RSVP context capture**       | `components/events/rsvp-context-prompt.tsx`        | User-facing form for `origin_city`, `bringing_book`, `conversation_topic`. Inline collapsed when filled.                                                                                                                           | Already shipped — collects the signals AttendeeCard surfaces.                                                                                                                                                        | No                                                                                                                                                                                                                 | NONE — user inputs own data.                                               | **No change needed.** Pair this with adoption nudges in future slices if signals are sparse.                                                                                                                                                          |
| **Manifest card**              | `components/manifest/manifest-card.tsx`            | Avatar/anon, mood emoji map (`curious/hopeful/frustrated/grateful/reflective/playful`), topic chip, `author.city` rendered on the meta line, linked event chip, linked book chip, `x_posted_url` backlink                          | Already shows ALL of these.                                                                                                                                                                                          | No                                                                                                                                                                                                                 | NONE — `is_anonymous` hides author identity correctly.                     | **No change needed.** Already shipped.                                                                                                                                                                                                                |
| **Activity feed widget**       | `components/activity/activity-feed.tsx`            | Actor avatar + name + verb + book cover thumbnail (compact, 10 grouped rows). `ActivityActor` type omits `city`.                                                                                                                   | Proximity hint ("dari Semarang") would be the natural add for actor lines.                                                                                                                                           | Yes, but trivial — extend `ActivityActor` type + add `city` to the SELECT in `lib/activity.ts`. Single-file change in the data layer; UI consumes optionally.                                                      | LOW — actor city is already public via `profiles_public`.                  | **Low-risk win** if surfaced _only on the long-format list_ (compact widget is too tight).                                                                                                                                                            |
| **Activity feed list (long)**  | `components/activity/activity-feed-list.tsx`       | Per-type rich rendering: book card with status, event chip, manifest with topic + mood preview, wanted card, USER_JOINED with profile link, grouped books with stack visual                                                        | Already shows linked object detail per type. With actor.city added (see widget row above), the header line could carry city.                                                                                         | No additional query change beyond the actor.city extension.                                                                                                                                                        | LOW                                                                        | **Low-risk polish.** Add city to the actor header line if the SELECT extension lands. Optional.                                                                                                                                                       |
| **Home cards**                 | `components/home/*`                                | Live signals already in place (Slice 3A)                                                                                                                                                                                           | "Members → {n} pembaca di {city}" already shows proximity when viewer has a city.                                                                                                                                    | No                                                                                                                                                                                                                 | LOW                                                                        | **No change needed.** Slice 3A shipped this.                                                                                                                                                                                                          |

---

## 2. Low-risk improvements (data already present or trivial extension)

These improvements need at most a small type + SELECT change. No prop-drilling, no new helpers, no schema changes, no UI rewrites.

**A. MemberCard `open_for_discussion` parity**

- **Why:** The schema has `open_for_discussion` on `profiles` (per `Profile` interface, `types/index.ts:55`). The `MemberSummary` interface omits it. The `listMembers` SELECT (`lib/profile.ts:102`) omits it. As a result, the "Buka:" tag on MemberCard only ever shows Pinjam / Jual / Tukar — discussion (the most common low-friction social signal) is silently dropped.
- **Effort:** Three small edits:
  1. Add `open_for_discussion: boolean` to `MemberSummary` (`lib/profile.ts:25`).
  2. Add `open_for_discussion` to the SELECT string (`lib/profile.ts:102`).
  3. In `MemberCard`, add `if (member.open_for_discussion) openTags.push("Diskusi")` near the existing `openTags.push("Pinjam")` etc. (`components/profile/member-card.tsx:14–17`).
- **Privacy:** None — boolean, already public via `profiles_public`.
- **Blast radius:** MemberCard renders on `/anggota` and inside related profile listings only. No other consumers of `MemberSummary` rely on the field shape negatively.

**B. ActivityActor city pull (optional surface in long-format only)**

- **Why:** Activity feed long-format (`/aktivitas`) header line currently shows `@username` under the name. Adding city ("@cole · Semarang") makes the row feel local in one glance. Compact widget rows are too tight; skip there.
- **Effort:** Two small edits:
  1. Add `city: string | null` to `ActivityActor` (`lib/activity.ts:13`).
  2. Add `, city` to the actor select fragment in `lib/activity.ts:62–67` (the embedded `actor:profiles_public!actor_user_id(...)`).
  3. In `ActivityFeedList`, optionally append `· {actor.city}` to the @username line when present.
- **Privacy:** None — city is already public via `profiles_public`.
- **Blast radius:** `ActivityActor` is consumed by `ActivityFeed`, `ActivityFeedList`, `RSS` route, JSON feed route. Adding an optional `city` field is backward-compatible (nullable). RSS/JSON do not need to render it.

That's it for low-risk wins. Everything else is already shipped or warrants deferral.

---

## 3. Medium-risk improvements (prop addition or query extension)

These need slightly more work and should NOT all be bundled into Slice 5B per the user's "narrow scope" directive.

**C. EventCard attendee-context preview ("3 bawa buku · 2 mau diskusi")**

- Needs aggregate counts on `event_rsvps` filtered by `bringing_book IS NOT NULL` and `conversation_topic IS NOT NULL`, grouped by `event_id`. PostgREST embedded `count` is simple; doing two filtered counts per event requires either inline JS aggregation over fetched rows or a small SQL view.
- Multiple consumers: `<UpcomingEventsStrip>` (landing), `<HomeModuleCard label="Events">` (home), `<EventCard>` inside event lists, `/event` page list.
- Tradeoff: query weight scales with attendee table size; founder hasn't yet validated that `bringing_book` actually gets filled often.
- **Recommendation:** Defer until adoption of `RsvpContextPrompt` is observable. Premature surfacing of "0 bawa buku" empty state would feel worse than no preview.

**D. BookCard same-city chip**

- Owner city already on `BookWithOwner.owner.city` (via `profiles_public`). Viewer city is missing from BookCard props.
- Plumbing options:
  - (a) Pass `viewerCity` as a prop to every BookCard caller — `<BookGrid>` consumers in `/shelf`, `/library`, landing, profile detail. Touches ~6 files.
  - (b) Server-only wrapper that fetches viewer profile once at the page level and forwards. Cleaner but new component primitive.
- Privacy: zero risk (owner city already public).
- **Recommendation:** Defer. Reach is high but the gain is one chip on cards. Revisit alongside the next "viewer-aware list page" pattern (e.g. when authenticated home introduces "books from people in your city").

**E. Activity-copy verb personalization**

- E.g. "Nadia di Semarang nambahin Atomic Habits" instead of "Nadia nambahin Atomic Habits".
- Requires actor.city pull (covered by improvement B). Once B lands, this is a small copy template change.
- **Recommendation:** Combine with B as an optional sub-task in the same slice, or defer until B is observed in production for a day.

---

## 4. Do not do yet (explicit deferrals)

- ❌ Full recommendation algorithm (book-to-user, member-to-member ML).
- ❌ Shared-interest matching scoring across cards.
- ❌ New DB fields or migrations.
- ❌ Trust / reputation score.
- ❌ New analytics events (`contact_click` already exists for liquidity tracking).
- ❌ Personalized activity feed ranking.
- ❌ Cross-card "people you might know" suggestions.
- ❌ Proximity calculations beyond same-city string equality.
- ❌ RSVP-context UI redesign (current inline prompt is sufficient).

---

## 5. Proposed Slice 5B implementation plan (narrow)

Two surfaces, three coherent code changes, zero schema migrations, no new helpers, no prop drilling, no new analytics, no DB writes.

### Slice 5B scope

**Change 1 — MemberCard `open_for_discussion`** (low-risk win A)

- File: `lib/profile.ts` — add `open_for_discussion: boolean` to `MemberSummary` interface; add `open_for_discussion` to the listMembers SELECT string.
- File: `components/profile/member-card.tsx` — extend the `openTags` builder with `if (member.open_for_discussion) openTags.push("Diskusi")`.
- Result: members open for discussion become visible as a "Buka: Diskusi · Pinjam" tag on the directory card.

**Change 2 — Activity feed actor city (long-format only)** (low-risk win B)

- File: `lib/activity.ts` — add `city: string | null` to `ActivityActor`; add `, city` to the actor embedded SELECT (single SELECT constant).
- File: `components/activity/activity-feed-list.tsx` — extend the header line to append `· {actor.city}` after `@username` when present. Compact widget (`activity-feed.tsx`) unchanged — too dense.
- Result: `/aktivitas` rows surface actor city subtly. Compact widget on landing / home / shelf untouched.

**Change 3 — verify type compatibility of RSS/JSON feeds**

- Files: `app/feed.xml/route.ts`, `app/feed.json/route.ts` — should not need code change since they import `ActivityItem`. The new optional `city` field is backward-compatible.
- Action: only re-validate via `tsc --noEmit` + curl. No edits expected.

### Surfaces NOT in Slice 5B (per user directive "at most 3 surfaces")

- BookCard same-city chip → defer (medium-risk D).
- EventCard attendee-context preview → defer (medium-risk C).
- Activity-copy personalization → defer (medium-risk E; depends on B).
- ManifestCard polish → not needed (already shipped).
- AttendeeCard polish → not needed (already shipped).
- Home cards → not needed (Slice 3A shipped).

### Slice 5B verification plan

- `npm run lint` → expect 0 errors, same 10 pre-existing warnings.
- `npx tsc --noEmit` → expect exit 0.
- Dev server smoke test:
  - `HEAD /anggota` 307 (auth-gated, unchanged).
  - `HEAD /aktivitas` 307 (auth-gated, unchanged).
  - `GET /feed.xml` 200 — RSS validates (no new field consumed; backward-compat).
  - `GET /feed.json` 200.
- Manual founder QA (sign-in required):
  - Open `/anggota`. Confirm members with `open_for_discussion=true` show "Buka: Diskusi" (alongside any existing Pinjam / Jual / Tukar). Members without the flag show only their existing tags.
  - Open `/aktivitas`. Confirm actor header lines show "@username · Semarang" when actor has a city. Members without city show only "@username".
  - Open `/`, `/home`, `/shelf` — compact ActivityFeed widget unchanged.
  - Open `/profile/[username]` — unchanged.
  - Open `/event/[id]` — AttendeeCard unchanged.
- Privacy checks:
  - Confirm `open_for_discussion` is selected from `profiles_public`, not `profiles` directly.
  - Confirm `city` on actor SELECT is via `profiles_public` join (which is what `lib/activity.ts:63` already uses).
  - No PII (whatsapp, email, raw `profiles` columns) added to any SELECT.

---

## 6. Privacy concerns

None blocking. All proposed Slice 5B additions read from `profiles_public`, which RLS gates appropriately (WhatsApp masked unless `whatsapp_public=true`, never exposed in this slice). The `open_for_discussion` boolean and `city` text are already public per the existing view contract. No new private fields proposed.

---

**Last updated:** 2026-05-28 (Slice 5A audit, pre-edit). After Slice 5B lands, this audit can stay as the historical record; no follow-up audit doc needed.
