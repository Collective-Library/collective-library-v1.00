# Business Process — Collective Library Ecosystem

> Read this **before** designing or building any feature. It is the single source of truth for **what this product is**, **how the surfaces connect**, and **what we will and will not build**.

Collective Library is **not a book app**. It is a trust-based knowledge network for local communities — a system that turns personal books, interests, events, manifests, and local places into visible trust signals so people can find the right readers, conversations, and communities around them.

The technical fact is that we have a Next.js + Supabase product. The strategic fact is that we are building infrastructure for invisible trust that already exists in real communities — starting with Journey Perintis (Semarang).

---

## 1. The ecosystem loop

Every product decision serves one loop:

```
Profile  →  Signal  →  Discovery  →  Contact  →  Trust  →  Activity  →  More Signals
   ▲                                                                        │
   └────────────────────────────────────────────────────────────────────────┘
```

In product language:

> People add books, wanted requests, events, manifests, spots, and profile signals.
> Each action becomes visible activity.
> Activity creates curiosity.
> Curiosity creates connection.
> Connection creates trust.
> Trust creates more contribution.
> More contribution makes the network more valuable.

Every surface in the product is one node of this loop. Every new feature must answer: **which arrow does this strengthen?** If the answer is "none," we do not build it.

---

## 2. Product Surface Matrix

| Surface                   | Role in ecosystem                                                                                       | Signal type                                                                                                                                                                                        | Primary user action                                                                                        | Feeds into                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Profile**               | Identity & trust container                                                                              | Identity signal: 3-layer interests (broad / sub / intent), contacts, location, professional, "currently reading"                                                                                   | Complete profile, set `show_on_map`, declare intents (open_for_discussion, open_to_lend, etc.)             | Members directory, Map, every other surface (signals attached to the actor)                                  |
| **Books**                 | Intellectual + transaction signal                                                                       | Object signal: 4-status enum (sell / lend / trade / unavailable). _Transaction-only today; intellectual signal layer is a future slice._                                                           | Add to shelf, change status, edit, hide                                                                    | Activity log (`BOOK_ADDED`, `BOOK_STATUS_CHANGED`), `/shelf`, `/discover`, future `/home`, owner profile     |
| **Wanted**                | Demand signal                                                                                           | Demand signal: open / fulfilled / closed. _Buy-only today; borrow/discuss/swap variants are a future slice._                                                                                       | Post a request, mark fulfilled / closed                                                                    | Activity log (`WTB_POSTED`), `/wanted`, owner profile                                                        |
| **Events**                | Activation spine — turns online signals into offline trust                                              | Activation signal: scheduled time, location (Spot link optional), social-activation fields (theme, hashtags, what-to-expect, registration deadline)                                                | Host an event, RSVP, edit, mark complete, Discord-announce                                                 | Activity log (`EVENT_CREATED`), `/event`, future `/home`, Discord webhook, Spots                             |
| **RSVP**                  | Trust-acceleration signal — context that turns "going" into "we already know what we are talking about" | Connection signal: going / maybe / declined plus optional `origin_city`, `bringing_book`, `conversation_topic`, `note`                                                                             | RSVP with optional context                                                                                 | Activity log (`EVENT_RSVPED` on `going` insert only), event detail attendee list, connection-moment surfaces |
| **Manifest**              | Thought / public narrative signal                                                                       | Expression signal: 10–1200 chars, mood, topic, optional anonymous display, optional link to event / book / profile, pending-by-default                                                             | Write manifest, admin approves, admin marks x-posted                                                       | Activity log (`MANIFEST_POSTED` on approval), `/manifest`, X distribution (`x_posted_url`), Discord announce |
| **Spots** (library nodes) | Physical infrastructure signal                                                                          | Place signal: type (cafe / public_shelf / community_space / school / campus / library / coworking / partner / other), status (active / inactive / needs_audit), visibility, geo (lat/lng/maps_url) | Host-eligible user creates Spot, admin curates, host links event to Spot                                   | `/spots`, event detail Spot chip, future `/home`, future activity (`NODE_CREATED` trigger reserved)          |
| **Activity**              | Visibility engine (the pulse of the whole product)                                                      | Aggregate signal: 7 trigger-driven types (USER_JOINED, BOOK_ADDED, BOOK_STATUS_CHANGED, WTB_POSTED, EVENT_CREATED, EVENT_RSVPED, MANIFEST_POSTED)                                                  | Read feed, filter by interest, subscribe via RSS                                                           | `/aktivitas`, future `/home` pulse, `/feed.xml` + `/feed.json`, Discord webhook                              |
| **Members**               | People discovery                                                                                        | Directory aggregator over Profile signals; 4-tier filter (city → kecamatan → interest → intent)                                                                                                    | Browse, filter, click into a profile                                                                       | `/anggota`, future `/home`, connection moments                                                               |
| **Map**                   | Local density discovery (opt-in only)                                                                   | Geo-aggregator: kecamatan-level coords, requires `show_on_map=true`                                                                                                                                | Opt in, view pins, click to profile                                                                        | `/peta`, future `/home`                                                                                      |
| **Discord**               | Community layer                                                                                         | Real-time fan-out + cultural vibe. Outbound channel webhook today; **no bot, no per-user DM.**                                                                                                     | Read, react, hang out in `#collectivelibrary`                                                              | All activity types fan out via Supabase DB webhook → `/api/discord-webhook`                                  |
| **X / Twitter**           | Public distribution layer                                                                               | External reach for manifests + events. **Manual copy-paste with `x_posted_url` backlink.** No API automation.                                                                                      | Admin / founder shares to X, pastes posted URL back                                                        | Manifest detail (backlink), brand visibility, public proof of movement                                       |
| **Mastermind**            | Founder / admin operating system                                                                        | Founder-action surface — never vanity metrics                                                                                                                                                      | View Mission Control, Founder Pulse, OKR/KR progress, member intelligence, distribution queue, data health | OKR + tasks + admin notes, decisions log, every other surface (cross-RLS aggregates via service-role)        |
| **Feedback**              | Learning loop                                                                                           | Friction signal: 5 categories (idea / bug / friction / appreciation / other), 5 statuses, optional anonymous, page_url + user_agent auto-captured                                                  | Submit via floating `<FeedbackChip>`                                                                       | Admin triage at `/admin/feedback`, Discord webhook notify                                                    |

**How to read this matrix:** every row is one node. The "Feeds into" column shows which other nodes receive the signal — that is how the ecosystem loop is implemented in code.

---

## 3. Discord and X are ecosystem layers, not side channels

### Discord = community layer

Use Discord for:

- Real-time community announcements (events, manifests, milestone activities)
- Feedback alerts to admins
- Contributor coordination
- Cultural vibe — the "what does this community feel like" surface
- Onboarding nudge (Seth Godin permission framing — gabung Discord dulu, ngintip vibe-nya)
- Future: role sync from contributor badges (Phase 3, not now)

Do **not** build:

- Internal chat (use Discord)
- Per-user DM bots (needs proper bot infra; channel webhook covers community needs today)
- Discord role automation (manual first, sync later)

### X / Twitter = public distribution layer

Use X for:

- Manifest distribution (approved manifests, posted manually by admin)
- Event recap and announcements
- Public thought leadership and founder voice
- Backlinks to Collective Library
- Public proof of movement and credibility

Do **not** build:

- Automated X posting via API (manual workflow gives editorial control and avoids API auth complexity)
- Cross-posting bots
- Anything that fakes traction

The rule: **the app creates context; existing communication rails carry the conversation.** WhatsApp + Instagram DM + Discord deep links handle 1:1 connection. X carries the public narrative. Collective Library never tries to replace any of them.

---

## 4. What we will not build (active guardrails)

Carry these forward into every feature design conversation. If a proposal triggers one of these, push back hard and reframe.

- ❌ Internal chat or messaging
- ❌ Marketplace checkout, payments, or escrow
- ❌ Automated X / Twitter posting via API
- ❌ Discord bot for per-user DM or automated role sync (until contributor-role MVP lands)
- ❌ QR check-in for Spots (deferred — needs ≥3 active spots first, see `docs/spots/README.md`)
- ❌ `node_visits`, `books.node_id`, partner dashboard (reserved; needs real Spot activity first)
- ❌ Reputation / trust scoring algorithm
- ❌ Recommendation engine (book-to-user, member-to-member ML)
- ❌ Book status enum schema change (intellectual signal layer) in this initiative
- ❌ Wanted `type` enum schema change (borrow / discuss / swap variants) in this initiative
- ❌ Materialized views for Mastermind metrics (premature optimization)
- ❌ Generic marketplace bloat ("Tokopedia for books")
- ❌ Vanity dashboards without action

**The moat is local trust density, not features.** Protect community-first design, member identity, social proof, repeat contribution, and city/community density. Avoid anything that flattens the product into a generic book marketplace.

---

## 5. Metrics that matter

We do not optimize for total users or total books. We optimize for signals that reveal **trust** and **liquidity**.

### Activation

- `profile_completed_count`
- `first_signal_completed_count` (first book / wanted / RSVP / manifest)
- `first_book_added_count`
- `first_wanted_posted_count`
- `first_rsvp_count`
- `first_manifest_submitted_count`

### Liquidity

- `contact_click_rate` (already tracked via Vercel Analytics)
- `wanted_matched_count` (potential supply for open wanted)
- `books_with_contact_clicks`
- `event_rsvp_rate`
- `attendees_with_context_count` (RSVP rows with `bringing_book` or `conversation_topic` filled)
- `repeat_event_attendees`

### Trust

- `profiles_with_social_links` (LinkedIn / Goodreads / StoryGraph / IG)
- `profiles_with_3+_signals` (book + RSVP + manifest, any combination)
- `users_with_books_and_event_rsvp`
- `users_with_manifest_and_book`
- `trusted_contributors` (future contributor-role badge holders)

### Network density

- `active_members_by_city`
- `active_members_by_spot`
- `events_by_spot`
- `books_by_city`
- `wanted_by_city`

### Distribution

- `discord_announcement_count`
- `x_posted_manifest_count`
- `x_posted_event_count`
- `public_profile_views` (if/when supported)

**Implementation rule:** only instrument metrics that can be computed from existing data or via safe additive queries. No new tables purely for metrics. Mastermind already aggregates most of these on read.

---

## 6. Evaluation tests for any new feature

Every proposal passes all four before we build:

1. **Reduces friction?** (Naval — every contribution should be tiny)
2. **Compounds over time?** (Naval — small acts get more valuable as the network grows)
3. **Protects the secret — community-first, not generic?** (Thiel — does this strengthen local trust density, or does it pull us toward generic marketplace land?)
4. **Helps us become the only option, not a better option?** (Thiel — what category of one does this reinforce?)

If all four answers are "no," we do not build it. If three are "yes," we build it small and watch.

---

## 7. The magic moment

The magic moment is **not** signup. It is:

> "Anjir, ternyata orang dekat gue punya buku / interest / event / keresahan yang nyambung sama gue."

UI should surface **connection moments**, not just features. Examples:

- Someone near you added a book.
- Someone is looking for a book you might own.
- An event is happening this week, hosted by a member with shared interest.
- A manifest resonates with what you are thinking.
- A spot near you is active.
- This person is open for discussion.
- This attendee is bringing a book you have heard of.
- This manifest links to an event you RSVPed for.

Every card in the product should aim to surface one of these moments when the data supports it. When it does not, **graceful empty state — never fake personalization.**

---

## 8. Cross-references

- `docs/PROJECT_VISION.md` — the why
- `docs/BRAND_AND_VOICE.md` — copy register, design tokens, founder voice
- `docs/ROADMAP.md` — phased delivery
- `docs/STATE.md` — current state and decision log
- `docs/spots/README.md` — Spots subsystem deep-dive
- `docs/AUDIT.md` — three-lens pre-launch audit (still useful for voice and strategic-secret framing)
- `README.md` — public entry point

---

**Last updated:** 2026-05-28 (Slice 1 of the ecosystem alignment initiative). This doc is load-bearing — keep it accurate, prune it when surfaces change, never let it drift.
