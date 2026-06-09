-- =============================================================================
-- Migration 0028 — user_notifications (Personal Notification Center v0)
--
-- The private personal inbox. Distinct from the other two layers:
--   activity_log       = what happened in the community   (public)
--   user_signals       = what THIS user has unlocked       (durable state)
--   user_notifications = what needs THIS user's attention  (private inbox)  ← here
--
-- v0 only carries type='SIGNAL_UNLOCKED' (object_type='signal',
-- object_id = user_signals.id), written by the Signal engine (service-role)
-- on every new unlock — including non-milestone ones that stay silent on
-- Discord. Future types: EVENT_RSVP_RECEIVED, BOOK_SAVED, etc.
--
-- The unique(recipient_user_id, type, object_type, object_id) constraint dedupes
-- (NOTE: object_id is NON-NULL for v0 SIGNAL_UNLOCKED rows; with NULL object_id
-- Postgres treats rows as distinct, so future null-object types would need
-- `nulls not distinct` — out of scope for v0).
--
-- Idempotent: safe to re-run.
-- =============================================================================

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references public.profiles(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  type text not null,
  object_type text not null,
  object_id uuid,
  title text not null check (length(title) between 1 and 200),
  body text,
  url text,
  image_url text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (recipient_user_id, type, object_type, object_id)
);

-- Fast unread count + inbox listing, both scoped to the recipient.
create index if not exists idx_user_notifications_recipient_unread
  on public.user_notifications(recipient_user_id, created_at desc)
  where read_at is null;
create index if not exists idx_user_notifications_recipient_created
  on public.user_notifications(recipient_user_id, created_at desc);

-- =============================================================================
-- RLS — recipient reads/updates own; NO insert policy (service-role only).
--
--   UPDATE needs a SELECT policy to see the row first (Postgres RLS rule); the
--   select_own policy provides it. The client only ever sets read_at; column-
--   level restriction isn't enforced by RLS (accepted v0 tradeoff — a user can
--   only touch their own private rows).
-- =============================================================================
alter table public.user_notifications enable row level security;

drop policy if exists "user_notifications_select_own" on public.user_notifications;
create policy "user_notifications_select_own" on public.user_notifications
  for select using (recipient_user_id = auth.uid());

drop policy if exists "user_notifications_update_own" on public.user_notifications;
create policy "user_notifications_update_own" on public.user_notifications
  for update using (recipient_user_id = auth.uid())
  with check (recipient_user_id = auth.uid());

-- (No INSERT/DELETE policy — only the service-role engine inserts.)

comment on table public.user_notifications is
  'Private personal inbox. Service-role written, recipient-readable. v0 type=SIGNAL_UNLOCKED. NOT a second activity feed — only things addressed to the recipient.';

-- =============================================================================
-- ROLLBACK (manual; commented for reference):
--
--   drop policy if exists "user_notifications_update_own" on public.user_notifications;
--   drop policy if exists "user_notifications_select_own" on public.user_notifications;
--   drop index if exists public.idx_user_notifications_recipient_created;
--   drop index if exists public.idx_user_notifications_recipient_unread;
--   drop table if exists public.user_notifications;
-- =============================================================================
