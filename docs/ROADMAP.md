# Roadmap

> Phased delivery for Collective Library. See [`BUSINESS_PROCESS.md`](./BUSINESS_PROCESS.md) for the ecosystem loop these phases compound into, and [`STATE.md`](./STATE.md) for what has actually shipped.

## Phase 1 — Solid MVP foundation (✅ shipped)

- Book, profile, directory, map, wanted, event, manifest, spots flows.
- Activity log with Postgres triggers and Discord webhook fan-out.
- Mastermind founder cockpit (Mission Control, OKRs, tasks, intelligence panels).
- RSS/JSON feeds, Instagram strip, public profiles, hCaptcha-gated auth (email + Google + Discord).
- Contributor onboarding docs, issue and PR templates.

## Phase 2 — Ecosystem alignment (current — see Slice 1 onward)

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
