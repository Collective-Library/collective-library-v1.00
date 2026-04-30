# Collective Library

> Where books connect people, and ideas turn into movement.

Mobile-first community book marketplace + lending network for the Journey Perintis reading community in Semarang. **Gratis selamanya. No take-rate.**

🌐 Live: [collectivelibrary.vercel.app](https://collectivelibrary.vercel.app)
📸 Instagram: [@collectivelibrary.id](https://www.instagram.com/collectivelibrary.id)
💬 Discord: [discord.gg/2nCu5p9Hsd](https://discord.gg/2nCu5p9Hsd)

---

## What this is

Books already exist on JP members' shelves. Trust already exists in the community. **They're invisible until a platform surfaces them.** Collective Library is infrastructure — not Goodreads-Indo, not Tokopedia-for-books — for a community that's already real.

Three core verbs:

- **Jual** — lepas buku yang udah dibaca, langsung ke pembaca lain
- **Pinjam** — bagi buku ke anggota terpercaya, balik diskusi
- **Tukar** — barter judul dengan teman seprogram

Plus a fourth: **WTB (Wanted to Buy)** — posting cari buku, anggota yang punya langsung notif.

## Features

| Surface | What it does |
|---|---|
| `/` | Public landing — books strip, activity feed, member strip, IG feed (Behold.so), founder voice |
| `/shelf` | Collective shelf — paginated grid (24/page), filter by status, FTS-ranked search |
| `/aktivitas` | Activity feed — event-based (USER_JOINED / BOOK_ADDED / STATUS_CHANGED / WTB_POSTED), interest filter, RSS subscribe |
| `/anggota` | Member directory — kota → kecamatan → interest → intent → mode filter, map teaser |
| `/peta` | Community map — Leaflet + Carto Positron, Snapchat-style avatar markers, opt-in via `show_on_map`, auto-geocoded via Nominatim or kode pos lookup |
| `/wanted` | WTB requests — auto-fetched cover from Open Library, IG DM templated, notes always shown |
| `/profile/[username]` | Public profile (anon-readable) — banner, currently-reading widget, 3-layer interests, share button |
| `/admin/feedback` | Admin-only feedback inbox — gated by `profiles.is_admin`, status triage, internal notes |
| `/api/feedback` | Anonymous feedback submission — Supabase + Discord webhook fan-out |
| `/api/discord-webhook` | Supabase Database Webhook → Discord channel relay (auth via shared secret) |
| `/api/postal-code/lookup` | Indonesian kode pos / kecamatan resolver via kodepos.vercel.app |
| `/api/geocode` | Nominatim forward geocoding fallback |
| `/feed.xml`, `/feed.json` | Public RSS 2.0 + JSON Feed 1.1 of community activity |

## Tech stack

- **Framework**: [Next.js 16.2.4](https://nextjs.org) (App Router, Turbopack, `proxy.ts` instead of `middleware.ts`)
- **Language**: TypeScript strict mode
- **Styles**: [Tailwind CSS v4](https://tailwindcss.com) with CSS-based `@theme` tokens (no `tailwind.config.ts`)
- **Database / Auth / Storage**: [Supabase](https://supabase.com) (Postgres + RLS + storage + auth + realtime + database webhooks)
- **Auth providers**: email/password, Google OAuth, Discord OAuth — all hCaptcha-protected
- **Email**: Resend SMTP (Path C — currently single-recipient; needs custom domain to scale)
- **Errors**: [Sentry](https://sentry.io) (server + client + edge, no-op when DSN unset)
- **Analytics**: Vercel Analytics + custom `contact_click` event
- **Image opt**: `next/image` with AVIF/WebP, browser-side compression (`browser-image-compression`) before upload
- **Maps**: Leaflet + react-leaflet 5, Carto Positron tiles
- **Animations**: lottie-react (3-dot pulse for loading states)
- **OG images**: `next/og` runtime "edge" — landing OG card, favicon, apple-touch-icon all generated dynamically
- **IG feed**: [Behold.so](https://behold.so) JSON feed (1h revalidate)
- **Notifications**: Discord webhooks (community channel + feedback channel), feedback chip → `/api/feedback` → Discord embed

## Project structure

```
app/
  page.tsx                    Landing
  about/, privacy/            Static pages
  feed.xml/, feed.json/       Public RSS + JSON feeds
  opengraph-image.tsx         Dynamic 1200×630 OG card
  icon.tsx, apple-icon.tsx    Brand-tinted favicon + iOS icon
  robots.ts, sitemap.ts       SEO basics
  error.tsx, global-error.tsx 3-tier error boundaries (Sentry-instrumented)
  api/
    discord-webhook/          Activity log fan-out → Discord channel
    feedback/                 Ticketing endpoint
    geocode/                  Nominatim wrapper
    postal-code/lookup/       kodepos.vercel.app wrapper
  auth/{login,register,callback,logout}
  onboarding/                 3-step + auto-join JP community
  profile/[username]/         Public profile (anon-readable)
  admin/                      Admin-gated dashboard
    feedback/                 Triage inbox + status control
  (app)/                      Auth-gated routes with TopBar+BottomNav
    layout.tsx                Profile completeness check
    shelf/                    Paginated catalog
    aktivitas/                Activity feed
    anggota/                  Member directory + filter sheet
    peta/                     Community map (dynamic-imported Leaflet)
    book/{add,add/bulk,import,[id],[id]/edit}
    wanted/                   WTB feed + form
    search/                   FTS search with empty-state suggestions
    profile/edit/             Profile edit (location picker, banner upload, etc.)
components/
  ui/                         Primitives (Button, Input, PasswordInput, Avatar, ...)
  books/                      BookCard, BookGrid, AddBookForm, BookPicker, ...
  wanted/                     WantedCard, WantedForm, WantedCTA
  profile/                    InterestChips (3-layer), MemberCard, LocationPicker, ShareProfileButton
  activity/                   ActivityFeed widget + ActivityFeedList
  layout/                     TopBar, BottomNav, AvatarMenu, PageShell, Footer
  landing/                    RecentBooksStrip, RecentMembersStrip, RecentInstagramStrip,
                              LoginNudgeProvider + GatedLink (modal nudge for anon clicks)
  map/                        PetaClient, MapView (Leaflet + avatar markers + popup)
  feedback/                   FeedbackChip (floating button + modal)
  auth/                       LoginForm, RegisterForm, GoogleButton, DiscordButton, AuthShell
lib/
  supabase/{client,server,admin}.ts
  auth.ts, books.ts, profile.ts, communities.ts, wanted.ts, activity.ts
  contact.ts                  WhatsApp/IG DM template builders
  format.ts, status.ts, cn.ts, url.ts
  interests.ts                3-layer taxonomy (broad/sub/intent)
  openlibrary.ts              Search (OL primary, Google Books fallback) + ISBN lookup
  goodreads-csv.ts            CSV import parser
  stats.ts                    Community stats for landing
  socials.ts                  Single source of truth for social links
  compress-image.ts           Browser-side WebP compression helper
  instagram.ts                Behold.so feed fetcher
  lottie/                     Hand-crafted Lottie JSON animations
proxy.ts                      Session refresh + thin auth gate (no DB reads)
instrumentation.ts            Sentry server/edge init
instrumentation-client.ts     Sentry browser init
supabase/migrations/          0001 → 0014 (init through feedback table)
scripts/                      seed-nikolas, seed-novels-id, verify-seed
docs/
  STATE.md                    Living handoff doc — read this first
  AUDIT.md                    Pre-launch audit notes
  PRE-DEPLOY-CHECKLIST.md     Deprecated; superseded by migrations 0005-0007
```

## Local development

### 1. Install

```bash
git clone https://github.com/Collective-Library/collective-library-v1.00.git
cd collective-library-v1.00
npm install
```

### 2. Environment variables

Create `.env.local` in the project root:

```env
# ─── REQUIRED ──────────────────────────────────────────────────────
# App dies without these. Get from your Supabase project Settings → API.
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ─── OPTIONAL — features degrade gracefully when unset ─────────────

# Canonical app URL (used for share links, OG tags, sitemap, geocoder UA)
# Falls back to VERCEL_URL → localhost when unset.
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Discord webhooks (3 separate purposes)
DISCORD_COMMUNITY_WEBHOOK_URL=         # activity_log → #collective-library channel
DISCORD_FEEDBACK_WEBHOOK_URL=          # feedback chip → #feedback channel
DISCORD_WEBHOOK_SECRET=                # shared secret for Supabase Database Webhook auth

# Sentry (server + client)
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# hCaptcha (auth pages — bot protection). When unset, captcha is silently disabled.
NEXT_PUBLIC_HCAPTCHA_SITEKEY=

# Behold.so Instagram feed ID (defaults to the @collectivelibrary.id production feed)
NEXT_PUBLIC_INSTAGRAM_FEED_ID=
```

### 3. Database setup

Apply migrations to your Supabase project. From the Supabase Dashboard:

1. Open **SQL Editor**
2. For each file in `supabase/migrations/` (in order: `0001_init.sql` → `0014_feedback.sql`):
   - Open the file
   - Copy its contents
   - Paste + Run in SQL Editor

Alternatively, with the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase db push
```

After 0014 runs, bootstrap your first admin:

```sql
update public.profiles set is_admin = true where username = 'YOUR-USERNAME';
```

### 4. Run

```bash
npm run dev   # → http://localhost:3000
```

## Deployment

`git push origin main` → Vercel auto-builds and deploys (~2 min). Watch the Vercel dashboard `Deployments` tab for status. Function logs are in `Logs` → filter by route (e.g. `/api/feedback`).

The repo is connected to Vercel via the [Supabase Vercel integration](https://supabase.com/dashboard/project/_/settings/integrations) — Supabase env vars (URL / anon key / service role) auto-sync. Discord / Sentry / hCaptcha env vars must be set manually in Vercel `Settings → Environment Variables`.

### Optional: Supabase Database Webhook → Discord activity channel

If you want activity events (book added, member joined, WTB posted) to appear in your Discord channel:

1. Set the 3 Discord env vars in Vercel (above)
2. Supabase Dashboard → **Database → Webhooks → Create**:
   - Name: `activity-discord-fanout`
   - Table: `activity_log`
   - Events: `INSERT`
   - Type: HTTP Request, POST
   - URL: `https://<your-domain>/api/discord-webhook`
   - HTTP Header: `Authorization: Bearer <DISCORD_WEBHOOK_SECRET>`

## Contributing

This is a community project. Contributions welcome.

- **Read [`docs/STATE.md`](./docs/STATE.md) first** — it's the living handoff doc covering brand, schema, decisions log, and active backlog
- Branch from `main`, never commit directly
- Open a PR with a description of what changes and why
- Follow existing conventions: TypeScript strict, Tailwind v4, server components by default
- Don't add new features without checking against the strategic guardrails (Naval/Thiel/Godin tests in STATE.md)

## Architecture decisions

A few opinionated calls made along the way:

- **No internal chat ever** — WhatsApp + IG DM + Discord deep-links only. This is a feature, not a bug. We're not building Slack.
- **Activity feed is event-based** (Postgres triggers → `activity_log` table), not app-emit. Cross-entity ordering for free, no race conditions.
- **WhatsApp privacy via masked view** (`profiles_public`) — direct `profiles` SELECT is self-only via RLS.
- **Image compression client-side** before Supabase upload — saves 70-90% storage, no Vercel function body limit.
- **Search uses Postgres FTS** with `websearch_to_tsquery`, ilike fallback for partial tokens. No Algolia / Meilisearch.
- **Map = Leaflet + OSM**, not Google Maps — no API key, no billing card.
- **Login-nudge modal** instead of `/auth/login` bounce — Seth-Godin-style invitation when anon clicks a card.
- **Permission-style Discord invite distribution** — footer + onboarding bonus + auth-page subtitle. No popups.

See full decision log in `docs/STATE.md`.

## License

TBD. Currently closed-source; will probably go open-source once the codebase stabilizes. For now: don't redistribute without permission.

---

Built by Cole, Initiator Journey Perintis & Collective Library.
Reach out: [@nikolaswidad_](https://instagram.com/nikolaswidad_) on IG.
