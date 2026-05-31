# Collective Maps — Product North Star

> The long-range product vision for `/peta` as the **killer feature** of Collective Library. This is a _direction_ doc, not a build spec. It sits above [`MAPS_ROADMAP.md`](./MAPS_ROADMAP.md) (the sliced execution plan) and [`MAPS_AUDIT.md`](./MAPS_AUDIT.md) (what exists today). Read those for _how_ and _when_; read this for _why_ and _where to_.
>
> **The current implementation plan in `MAPS_ROADMAP.md` remains fully valid.** This doc adds a north star, not a rebuild. Nothing here cancels the sliced, additive approach: keep Leaflet + Carto Positron, keep `/peta`, members stay approximate, Spots before Events.

## 1. Product vision

Collective Maps makes an invisible network visible: **the books, readers, reading places, events, and knowledge communities already around you.** Open `/peta` and the city stops being a grid of streets and becomes a living map of who reads what, where ideas gather, and how to join.

Most platforms put _content_ at the center. Collective Maps puts **proximity + trust + curiosity** at the center. The map is not a directory rendered on tiles; it is the surface where the ecosystem loop (discover → contribute → appear → connect → return → invite) becomes spatial and obvious.

The one-line north star: **"A trust map for books, readers, and ideas — so the knowledge network around you becomes something you can see, join, and grow."**

## 2. Why `/peta` matters

- **It answers the new-user question.** A newcomer's real question isn't "what features exist?" — it's _"is anything alive near me, and how do I belong?"_ A map answers that in one glance better than any feed or list.
- **It compounds.** Every member who opts in, every Spot that gets added, every event that lands makes the map denser and more valuable to the next person. Lists decay; maps accrete.
- **It is defensible.** A generic book app can be cloned in a weekend. A trust-weighted spatial graph of a real community (Journey Perintis, then more cities) cannot — it is the visible shadow of relationships that already exist offline.
- **It is the activation surface.** Discovery on the map naturally leads to a contribution prompt ("add your shelf", "add this Spot", "you're the first here"), which is the activation loop the product needs.

## 3. What makes this different

| Product         | What they do                                                                                | What Collective Maps does instead                                                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Google Maps** | Logistics: routing, exact addresses, businesses, reviews. Optimized to _get you somewhere_. | Discovery + trust, not navigation. Members are **approximate** by design. The unit is "a reader / a reading place / an idea gathering", not "a destination".                             |
| **Goodreads**   | A catalog of books + reviews, placeless and largely solo.                                   | Books as **social, local signals** attached to real people and places nearby — not a global review database.                                                                             |
| **LinkedIn**    | Professional identity + transactional networking, status-driven.                            | Curiosity-driven, community-first identity. You're discoverable by _what you read and want to discuss_, not your job title. No clout ladder.                                             |
| **Discord**     | Real-time chat in topic servers, placeless, ephemeral.                                      | A persistent, spatial, browsable map. Discord stays the conversation layer; the map is the _discovery + presence_ layer that feeds it.                                                   |
| **Zenly**       | Live GPS friend-tracking, exact and always-on.                                              | Social presence **without** live location. Approximate by default, opt-in, event/Spot-anchored. Presence = "active in this city / at this Spot", never "at these coordinates right now". |

The throughline: everyone else optimizes for _exactness, status, or transactions_. Collective Maps optimizes for **discovery, trust, and belonging**, and treats approximate location as a feature, not a limitation.

## 4. Core user loop

The map is built to drive one loop, and every surface should push the user to the next step:

**discover → contribute → appear → connect → return → invite**

1. **Discover** — open `/peta`, see readers, Spots, and events nearby. "There's a network here."
2. **Contribute** — a single clear prompt: add your shelf, add a Spot, create an event, or set your location. Low-friction, one action.
3. **Appear** — the contribution makes _you_ visible on the map (your bubble, your book count, your Spot). Visibility is the reward.
4. **Connect** — someone clicks your pin, sees shared interests/books, and reaches out (WhatsApp / IG / Discord deep link — never internal chat).
5. **Return** — new activity nearby (a Spot, an event, a new reader) is a reason to come back; the map changed since last time.
6. **Invite** — share your city map / your profile / an event. The map is inherently shareable ("look who's reading near us"), which pulls the next person in at step 1.

Design rule: **never show a dead end.** Every empty state is a contribution prompt; every pin is a connection opportunity; every full map is a share opportunity.

## 5. Maps V1 — the ecosystem map

_(This is what `MAPS_ROADMAP.md` Slices 2–4 deliver. The north star simply names it.)_

One `/peta` surface showing three layers with a simple "Tampilkan" chip selector:

- **Members** (already shipped) — approximate, opt-in reader bubbles with book counts.
- **Spots** — public, active reading places (cafes, public shelves, community spaces) at exact coordinates.
- **Events** — upcoming public events, anchored to a linked Spot's coordinate.

Outcome: a newcomer sees, in one screen, _"who's around, where reading happens, and what's coming up."_ That alone is a step-change from today's members-only map.

## 6. Maps V1.5 — the contribution loop

Turn the map from "look" into "join". Additive UI on top of V1:

- **Floating Add button** with one-tap options: _Tambah buku · Tambah Spot · Buat event · Edit lokasi gue._ The map becomes the front door to contribution, not just a viewer.
- **City Pioneer** — when the map is sparse in a user's city, frame it as opportunity, not emptiness: _"Belum banyak yang muncul di {kota}. Jadi yang pertama."_ Recognize early contributors per city (a light, identity-based recognition — **not** points/leaderboards; see Non-goals).
- **Share city map** — a shareable view/link of a city's living map ("readers + Spots + events in Semarang"), built to be posted to WhatsApp/IG/Discord. This is the invite engine of the loop.

## 7. Maps V2 — book discovery map

Once people + places are dense, layer in **books as the discovery primitive** — carefully, without pin spam:

- **Nearby books** — surface what books exist around you, expressed through _people and Spot cards_, not as a sea of individual book pins.
- **Availability signals** — who nearby is open to lend / sell / trade a given title (reusing the existing `open_for_*` model).
- **Search by book or interest** — "who near me has / wants _Sapiens_?", "who nearby is into _filsafat_?" The map re-centers and filters to answer.
- **Book signals inside cards** — a person's pin popup shows their strongest book signals; a Spot's popup shows the books/shelf living there. Books deepen existing pins instead of adding a noisy new layer.

Principle (locked): **no standalone book pins.** Books are signals _on_ people and Spots. This keeps the map legible as it scales.

## 8. Maps V3 — social presence (Zenly-like, without live location)

The aspirational ceiling: the warmth of seeing friends on a map, **without** the surveillance of live GPS.

- **Presence, not coordinates** — "active in Semarang this week", "going to this event", "recently added books" — soft, opt-in presence signals anchored to city / Spot / event, never to a live position.
- **No live GPS by default. Ever, unless explicitly opted in per-use.** The default is approximate and ambient. Any future precise/live feature must be an explicit, revocable, per-session opt-in — and is out of scope until there is a clear, privacy-reviewed reason.
- **Friend/contact presence** could show trusted connections' city-level activity, gated by mutual consent. The feeling of Zenly (belonging, "my people are here") with none of the location risk.

V3 is a direction, not a commitment. It exists to make sure V1/V2 decisions don't paint us into a corner that would later require live tracking.

## 9. Privacy rules (non-negotiable, all versions)

- **No exact member location, ever.** Members are placed at kecamatan-level centroids with deterministic jitter. No home address, no precise pin, no live GPS by default.
- **Opt-in only.** A member appears only via `show_on_map=true`. Default off. The same flag gates `/peta` and the public landing card — one consent line, both surfaces.
- **Public places can be exact.** Spots are public venues, so exact coordinates are acceptable — but only when `status='active' AND is_active=true AND visibility='public'`.
- **Events only if public-safe.** Show an event only if it is public, non-hidden, upcoming, and anchored to a coord-bearing public Spot. Online-only or private-location events are **never** placed on the map.
- **No private fields on the map.** Never expose phone/WhatsApp, private profile data, or community-only data in map payloads. Server-side loaders only; client gets display-safe projections.
- **Presence is consensual and coarse.** Any V3 presence signal is opt-in, city/Spot/event-level, and revocable.

## 10. Metrics that matter

Instrument the loop, not vanity. Track (privacy-safe, no PII in event names):

- **Map opens** — `/peta` visits (overall + per city).
- **Filter usage** — layer chip toggles (Semua/Anggota/Spots/Event) + intent/mode filters.
- **Spot adds** — Spots created, esp. by non-admins.
- **Event clicks** — event pin → event detail.
- **Profile clicks** — member pin → profile.
- **Book contact clicks** — contact CTA from a map-originated profile (reuse existing `contact_click`).
- **City activation** — per city: count of opt-in members + active Spots + upcoming events crossing a "this city is alive" threshold.
- **Return rate** — repeat `/peta` visits per user over time (does a denser map bring people back?).

The headline question these answer: _does the map drive the loop — discover → contribute → appear → connect → return → invite?_

## 11. Non-goals

- **No Google Maps (yet).** Leaflet + Carto Positron is enough, cheaper, and already shipped. Revisit only with a clear, approved reason.
- **No live GPS (yet).** Approximate + opt-in presence only. No always-on location.
- **No book pin spam.** Books are signals on people/Spots, never standalone pins.
- **No native app (yet).** Mobile-first web is the surface.
- **No paid map API / no new heavy dependency** without explicit approval.
- **No points/leaderboards/gamification.** Activation comes from contribution + visibility + belonging, not from scores. "City Pioneer" is identity/recognition, not a points race.
- **No surveillance vibes.** This is a trust map, not a tracking map.

## 12. Relationship to the implementation plan

This north star **extends, not replaces.** The valid, approved path stays:

- **`MAPS_AUDIT.md`** — the current state and constraints.
- **`MAPS_ROADMAP.md`** — the sliced, additive build plan (Slice 1 docs ✅ → Slice 2 typed-union + `MapView` refactor → Slice 3 Spots → Slice 4 Events → Slice 5 mobile UX → Slice 6 activity/output), each behind a stop-and-report approval gate.

Mapping north-star versions to the roadmap: **Maps V1 ≈ Slices 2–4**, **V1.5 ≈ Slices 5–6**, **V2/V3 are future phases** to be sliced and privacy-reviewed when V1 is live and dense. Build order and guardrails are unchanged. This doc exists so every slice can be checked against _"does this move us toward the trust map for books, readers, and ideas?"_ — without ever justifying a premature rebuild.
