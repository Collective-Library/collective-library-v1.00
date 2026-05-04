# Feature Proposal: Contributor Roles and Discord Sync

## Status

Proposed (MVP-first, low-risk rollout)

## Problem

Community contribution is valuable but often invisible.
Without visible identity signals, trust and coordination grow slower.

## Goal

Turn contribution into visible profile identity using role badges, starting with manual assignment and evolving into Discord/GitHub-integrated signals.

## MVP scope

- Define contributor role data model
- Enable manual role assignment by admins
- Display public badges on user profiles
- Allow one primary badge per user
- Document (not overbuild) Discord sync path

## Recommended roles

- Mastermind
- Core Builder
- Maintainer
- Steward
- Inventor
- Builder
- Explorer
- Connector
- Curator
- Storyteller
- Librarian
- Contributor
- Issue Hunter
- Pull Request Hero
- Docs Gardener
- Beta Tester

## Suggested schema

### `contributor_roles`

- `id`
- `name`
- `slug`
- `description`
- `color`
- `icon`
- `source` (`manual | discord | github | system`)
- `is_public`
- `priority`
- `created_at`
- `updated_at`

### `user_contributor_roles`

- `user_id`
- `role_id`
- `assigned_by`
- `assigned_at`
- `source`
- `evidence_url`
- `notes`
- `is_primary`

## Product behavior

- Users may have multiple roles.
- Exactly zero-or-one role may be `is_primary = true` at any time.
- Only public roles render on public profile.
- Admin assignment should capture source and optional evidence.

## Discord sync (future)

Potential path:

1. User links Discord account
2. System maps Discord role IDs to role slugs
3. Sync job applies adds/removals
4. Manual override remains available

## GitHub sync (future)

Potential path:

- Detect contribution events (PR merged, issues resolved, docs authored)
- Suggest or auto-assign badges with review controls

## Risks and mitigations

- Vanity roles → require evidence + moderator notes
- Role inflation → define role criteria and priority
- Sync drift → periodic reconciliation + manual override

## Definition of done (MVP)

- Data model approved
- Manual role assignment implemented/planned clearly
- Public profile badge rendering implemented/planned clearly
- Documentation published across README + docs
