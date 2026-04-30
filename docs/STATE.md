# Collective Library — Current State

> Living handoff doc. Update this when finishing a sprint. Read this **first** in any new session.

## What this is

Mobile-first community book marketplace + lending network for **Journey Perintis** community in Semarang. Built on Next.js 16 (App Router) + React 19 + Tailwind v4 + Supabase. Live at **collectivelibrary.vercel.app** (deployed via GitHub → Vercel auto-deploy on push to `main`).

Tagline: "Where books connect people, and ideas turn into movement."

The secret it makes visible: books already exist on members' shelves, trust already exists in the JP community, but they're invisible until a platform surfaces them. We are infrastructure for an existing community — not Goodreads-Indo, not Tokopedia-for-books.

## Brand & design system

- **Colors**: warm sepia/walnut from logo monogram (`#3D2E1F`) on parchment (`#F0E8D8`). Whisper borders (`rgba(61,46,31,0.10)`). Status pills tinted: sell=orange, lend=green, trade=purple, wanted=amber.
- **Type**: DM Serif Display (one loud moment per page) + DM Sans (everything else, weights 400/500/600/700)
- **Foundation**: Notion warm-neutral grammar pushed warmer toward parchment + Airbnb marketplace patterns (photo-first cards, pill search, sticky bottom CTA)
- **Tokens**: all in `app/globals.css` as Tailwind v4 `@theme` block

Logo: `public/logo.svg` (144kb, warm brown two-faces-between-shelves monogram).

## Tech stack

- **Framework**: Next.js 16.2.4 (Turbopack, `proxy.ts` not `middleware.ts`)
- **Language**: TypeScript strict
- **Styles**: Tailwind v4 with CSS-based `@theme` config (no `tailwind.config.ts`)
- **DB/Auth/Storage**: Supabase (project `lhqwwllbzkdpzpdeeyzp`)
- **Auth providers**: email/password + Google OAuth + Discord OAuth, all hCaptcha-protected
- **Email**: Resend SMTP (currently Path C — only `journey.perintis@gmail.com` can receive; needs custom domain to fully open)
- **Errors**: Sentry (server + client + edge, no-op until DSN env var set)
- **Analytics**: Vercel Analytics + custom `contact_click` event
- **Notifications**: Discord channel webhook via Supabase Database Webhook → `/api/discord-webhook`
- **Public feeds**: `/feed.xml` (RSS 2.0) + `/feed.json` (JSON Feed 1.1) — Discord bot subscribable

## File structure summary

```
app/
  page.tsx                  Landing (founder voice, social proof, footer)
  about/, privacy/          Static pages
  feed.xml/, feed.json/     RSS + JSON Feed for activity
  api/discord-webhook/      Supabase webhook → Discord channel push
  auth/{login,register,callback,logout}
  onboarding/               3-step + auto-join JP community
  (app)/                    Auth-gated routes with TopBar+BottomNav shell
    layout.tsx              Profile completeness check
    shelf/                  Collective Shelf with status filter + search
    aktivitas/              Activity feed (event-based, 50 items, day-bucketed)
                            Filter by interest. RSS subscribe pill.
    anggota/                Member directory. 4-tier filter:
                            kota → kecamatan → interest → mode.
    book/{add,add/bulk,import,[id],[id]/edit}
    profile/{[username],edit}
    search/, wanted/, wanted/add/
components/
  ui/                       Primitives (Button, Card, Input, Badge, Avatar,
                            StatusBadge, CommunityBadge, Skeleton)
  books/                    BookCard, BookGrid, AddBookForm (single + bulk),
                            EditBookForm (with delete + danger zone),
                            BookPicker (Open Library primary, Google fallback),
                            MyShelfManager (Kelola bulk-edit mode),
                            GoodreadsImportForm, ContactPills, TrackedContactCTA
  wanted/                   WantedCard, WantedForm, WantedCTA (with click track)
  profile/                  InterestChips, MemberCard, ShareProfileButton
  activity/                 ActivityFeed (4-row widget),
                            ActivityFeedList (long-format day-bucketed),
                            ActivityFeedSkeleton, activity-copy.ts
  layout/                   TopBar, BottomNav (5 tabs),
                            AvatarMenu, PageShell, Logo, Footer
  auth/                     LoginForm, RegisterForm, GoogleButton,
                            DiscordButton, AuthShell, hCaptcha integrated
lib/
  supabase/{client,server,admin}.ts
  auth.ts, books.ts, profile.ts, communities.ts, wanted.ts,
  activity.ts, contact.ts, format.ts, status.ts, interests.ts,
  openlibrary.ts (search + ISBN lookup, OL primary GBooks fallback),
  goodreads-csv.ts, stats.ts, url.ts, cn.ts
proxy.ts                    Session refresh + cheap auth gate (no DB reads)
instrumentation.ts          Sentry server/edge init
instrumentation-client.ts   Sentry browser init
supabase/migrations/        0001_init through 0007_audit_log
scripts/                    seed-nikolas, seed-novels-id, verify-seed
```

## Schema state

Migrations applied (0001-0004) and pending (0005-0007):

| # | Name | Status | Description |
|---|---|---|---|
| 0001 | init | ✅ run | All core tables, RLS, storage, JP community seed |
| 0002 | profiles_public | ✅ run | View masks WhatsApp unless public/self |
| 0003 | trust_profile | ✅ run | linkedin_url, website_url, profession, interests[], view recreated |
| 0004 | activity_log | ✅ run | activity_log table + 4 triggers (book_added, status_changed, wtb_posted, user_joined) + backfill |
| 0005 | profile_extras | ⏳ pending | currently_reading_book_id, view recreated |
| 0006 | fts_search | ⏳ pending | books.search_text tsvector + GIN index. Forward-compat (query stays ilike) |
| 0007 | audit_log | ⏳ pending | audit_log table + triggers on books/wanted/profiles UPDATE+DELETE |

SQL for 0005-0007 is in `docs/PRE-DEPLOY-CHECKLIST.md` (deprecated; use the migration files in `supabase/migrations/`).

## Outstanding user-action items

| # | Action | Where | Blocking? |
|---|---|---|---|
| 1 | Run migrations 0005, 0006, 0007 | Supabase SQL Editor | Yes — code expects 0005 columns |
| 2 | Wire Discord channel webhook | Discord channel + Vercel env + Supabase webhook | No — degrades gracefully when unset |
| 3 | Custom domain SMTP (Path B) | Resend domain verify + Supabase SMTP | Yes for inviting JP — currently only journey.perintis@gmail.com receives |
| 4 | Optional: Vercel `NEXT_PUBLIC_APP_URL=https://collectivelibrary.vercel.app` | Vercel env vars | Soft-blocking — falls back to VERCEL_URL otherwise |
| 5 | Rotate API keys/secrets shared during chat | Resend, hCaptcha, Sentry, Discord, Supabase | Recommended pre-launch |

## Strategic guardrails (from product philosophy doc)

Every feature passes 4 tests before being built:
1. Reduces friction? (Naval)
2. Compounds over time? (Naval)
3. Protects the secret — community-first not generic? (Thiel)
4. Helps become the only option, not a better option? (Thiel)

If all four are no, we don't build it.

## Active backlog (post-1b8e9f9)

- **Map view** — `/peta`, Leaflet+OSM, kecamatan markers via Indonesian wilayah API. Privacy: opt-in toggle, kecamatan-level only.
- **Per-user Discord DM** — needs proper Discord bot infra. Current channel webhook is community-level only.
- **3-layer interest** — sub-interest + intent (currently just Layer 1 broad chips).
- **FTS query swap** — flip lib/books.ts:searchBooks from ilike to `.textSearch('search_text', q, { type: 'websearch' })` once 0006 is run and we have enough books to feel ranking.
- **Admin dashboard** — read audit_log, hide books, manage WTB. Behind `is_admin` flag on profiles.

## Decision log (recent, paraphrased)

- **Whatsapp privacy**: column lives on `profiles`, masked in `profiles_public` view via CASE expression. Direct profiles SELECT only allowed for self. View used everywhere except own-row reads.
- **Activity feed**: event-based table + Postgres triggers, NOT app-level emit. Cross-entity ordering for free. App-level click events live in Vercel Analytics, not the activity_log.
- **Discord delivery**: webhook (real-time, push-based) preferred over RSS poll for community channel. RSS still exposed for portability.
- **Search**: Open Library primary, Google Books fallback (Google quota 429s under shared anon traffic).
- **Bulk add**: 3 paths — single (full-detail), bulk-search (basket), Goodreads CSV. Quick-add path (3 fields → done) within single form.
- **No internal chat ever**: WhatsApp + IG + Discord deep links only. This is a feature, not a bug.

## How to run locally

```bash
cd collective-library
npm install
npm run dev   # http://localhost:3000
```

Requires `.env.local` with Supabase URL + anon + service-role keys (already in repo, not committed).

## How to deploy

`git push` to `main` → Vercel auto-builds and deploys ~2 min. Watch Vercel dashboard `Deployments` tab for status. Errors → Vercel Function Logs.

---

Last updated: 2026-04-30, commit `1b8e9f9` (Sprint W1+W2+W3).
