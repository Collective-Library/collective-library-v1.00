# Collective Library

> Where books connect people, and ideas become a movement.

Collective Library is a **community-driven knowledge ecosystem**.
It helps people share books from personal shelves, discover ideas through trusted peers, and build meaningful relationships through learning.

This is not a traditional library app. It is distributed, social, trust-based, and open-source.

- 🌐 Live: [collectivelibrary.vercel.app](https://collectivelibrary.vercel.app)
- 📸 Instagram: [@collectivelibrary.id](https://www.instagram.com/collectivelibrary.id)
- 💬 Discord: [discord.gg/2nCu5p9Hsd](https://discord.gg/2nCu5p9Hsd)

---

## Why this exists

Books are already everywhere: on people’s shelves, in reading circles, and inside communities.
What is usually missing is shared visibility and connection.

Collective Library exists to make knowledge networks visible and usable:

- show who has what books
- make borrowing/lending/discovery easier
- help readers find each other
- turn contribution into identity and trust

---

## Who this is for

- Readers who want to discover books from real people
- Community members who want to lend, borrow, or exchange books
- Organizers building local learning ecosystems
- Contributors who want to grow an open-source social knowledge platform

---

## Current features (MVP+)

- Book shelf with filtering and search
- Community activity feed + RSS/JSON feed
- Member directory + map discovery
- Wanted-to-buy requests
- Public user profiles
- Auth (email/password, Google, Discord)
- Admin feedback inbox
- Discord webhook relay for selected activities

For a complete list, see [`docs/FEATURES.md`](./docs/FEATURES.md).

---

## Upcoming features

- Contributor role badges on profiles
- Manual role assignment for admins (first MVP step)
- Discord role mapping and sync (future phase)
- GitHub contribution-aware badges (future phase)
- Expanded community event workflows

See:
- [`docs/ROADMAP.md`](./docs/ROADMAP.md)
- [`docs/features/CONTRIBUTOR_ROLES_AND_DISCORD_SYNC.md`](./docs/features/CONTRIBUTOR_ROLES_AND_DISCORD_SYNC.md)

---

## Contributor identity: badges + Discord roles

Collective Library is building a contributor identity layer where contributions become visible trust signals.

Example roles include:

- Inventor
- Builder
- Explorer
- Connector
- Curator
- Storyteller
- Librarian
- Contributor
- Maintainer
- Docs Gardener
- Pull Request Hero

MVP principle:

- users can have multiple badges
- one badge can be marked as primary for public display
- assignment is manual first
- Discord/GitHub sync is documented now, implemented later

Read details in [`docs/DISCORD_ROLES.md`](./docs/DISCORD_ROLES.md).

---

## Getting started locally

### 1) Install

```bash
git clone https://github.com/Collective-Library/collective-library-v1.00.git
cd collective-library-v1.00
npm install
```

### 2) Configure environment

Copy and edit environment values:

```bash
cp .env.example .env.local
```

Minimum required values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional services include Discord webhooks, Sentry, and hCaptcha.

### 3) Database

Run Supabase migrations in `supabase/migrations` (via Supabase SQL Editor or Supabase CLI).

```bash
supabase db push
```

### 4) Start dev server

```bash
npm run dev
```

Then open `http://localhost:3000`.

---

## Contributing

We welcome builders, writers, organizers, and curious learners.

1. Read [`docs/PROJECT_VISION.md`](./docs/PROJECT_VISION.md)
2. Read [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md)
3. Check [`docs/ROADMAP.md`](./docs/ROADMAP.md)
4. Open or join an issue
5. Submit a pull request

### First issue proposal

**Title:** `feat: add contributor role badges and Discord role mapping`

**Description:**

```md
Build a contributor badge system for Collective Library users, starting with manual admin assignment and future support for Discord role sync.

This feature turns community contribution into visible identity:
- Inventor
- Builder
- Explorer
- Connector
- Curator
- Storyteller
- Librarian
- Contributor
- Maintainer
- Docs Gardener
- Pull Request Hero

MVP:
- define contributor role data model
- allow role assignment to users
- show public badges on user profile
- document Discord sync as future integration

Future:
- Discord OAuth
- Discord bot role sync
- GitHub contribution badge sync
```

---

## Issues and pull requests

- Use templates in `.github/ISSUE_TEMPLATE/`
- Keep issues specific and actionable
- In PRs, explain **what changed**, **why**, and **how to test**
- Link related issues whenever possible

Template files:

- [Bug Report](./.github/ISSUE_TEMPLATE/bug_report.md)
- [Feature Request](./.github/ISSUE_TEMPLATE/feature_request.md)
- [Community Event](./.github/ISSUE_TEMPLATE/community_event.md)
- [Contributor Role Request](./.github/ISSUE_TEMPLATE/contributor_role.md)
- [Pull Request Template](./.github/PULL_REQUEST_TEMPLATE.md)

---

## Docs index

- [`docs/PROJECT_VISION.md`](./docs/PROJECT_VISION.md)
- [`docs/FEATURES.md`](./docs/FEATURES.md)
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- [`docs/ROADMAP.md`](./docs/ROADMAP.md)
- [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md)
- [`docs/DISCORD_ROLES.md`](./docs/DISCORD_ROLES.md)
- [`docs/features/CONTRIBUTOR_ROLES_AND_DISCORD_SYNC.md`](./docs/features/CONTRIBUTOR_ROLES_AND_DISCORD_SYNC.md)

Legacy context docs:

- [`docs/STATE.md`](./docs/STATE.md)
- [`docs/AUDIT.md`](./docs/AUDIT.md)
- [`docs/PRE-DEPLOY-CHECKLIST.md`](./docs/PRE-DEPLOY-CHECKLIST.md)

---

## Community links

- Instagram: https://www.instagram.com/collectivelibrary.id
- Discord: https://discord.gg/2nCu5p9Hsd
- Web app: https://collectivelibrary.vercel.app

If you care about books, ideas, and community learning, you are welcome here.
