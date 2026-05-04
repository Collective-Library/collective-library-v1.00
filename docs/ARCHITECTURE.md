# Architecture Overview

## Stack summary

- Next.js App Router web app
- Supabase for auth + database + RLS
- Tailwind CSS for UI
- Discord webhooks for selected notifications

## High-level flow

1. Users authenticate and manage profiles/books
2. Data is stored in Supabase tables with policy controls
3. Community surfaces (shelf, activity, members, map) query and render shared data
4. Some activity events fan out to Discord

## Contributor role system (planned)

Planned additions:

- `contributor_roles` table
- `user_contributor_roles` join table
- Admin assignment UI/API
- Profile badge rendering with a single primary badge

Detailed proposal lives in:
`docs/features/CONTRIBUTOR_ROLES_AND_DISCORD_SYNC.md`
