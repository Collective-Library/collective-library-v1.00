-- =============================================================================
-- Migration 0020 — Events + RSVPs (Phase 1 "activation spine")
--
-- Adds two tables (events, event_rsvps) and extends activity_log so event
-- creation + RSVPs surface in the unified feed, RSS, and JSON Feed. Mirrors:
--   - books RLS pattern (0001_init.sql) for events
--   - saved_books / community_members composite-PK pattern for event_rsvps
--   - activity_log trigger philosophy from 0004 + 0018 (INSERT-only, no spam)
--
-- Manual Discord announce uses events.discord_announced_at as idempotency
-- timestamp (UI shows "Diumumkan X menit lalu — umumkan lagi?").
-- =============================================================================

-- =============================================================================
-- 1. events table
-- =============================================================================
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  community_id uuid references public.communities(id) on delete set null,
  title text not null check (length(title) between 3 and 140),
  description text check (length(description) <= 4000),
  starts_at timestamptz not null,
  ends_at timestamptz check (ends_at is null or ends_at > starts_at),
  timezone text not null default 'Asia/Jakarta',
  location_text text,
  location_url text,
  is_online boolean not null default false,
  capacity integer check (capacity is null or capacity > 0),
  cover_url text,
  contact_method text not null default 'whatsapp'
    check (contact_method in ('whatsapp', 'instagram', 'discord')),
  visibility text not null default 'public'
    check (visibility in ('public', 'community')),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'cancelled', 'completed')),
  is_hidden boolean not null default false,
  discord_announced_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_events_starts on public.events(starts_at);
create index if not exists idx_events_host on public.events(host_id);
create index if not exists idx_events_upcoming
  on public.events(starts_at)
  where is_hidden = false and status = 'scheduled';

drop trigger if exists trg_events_updated_at on public.events;
create trigger trg_events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- =============================================================================
-- 2. event_rsvps table — composite PK gives uniqueness for free
-- =============================================================================
create table if not exists public.event_rsvps (
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'going'
    check (status in ('going', 'maybe', 'declined')),
  note text check (note is null or length(note) <= 280),
  created_at timestamptz default now() not null,
  primary key (event_id, profile_id)
);

create index if not exists idx_event_rsvps_event on public.event_rsvps(event_id);
create index if not exists idx_event_rsvps_profile on public.event_rsvps(profile_id);

-- =============================================================================
-- 3. RLS — events mirror books policies; rsvps mirror saved_books
-- =============================================================================
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;

drop policy if exists "events_select_public" on public.events;
create policy "events_select_public" on public.events
  for select using (
    is_hidden = false and (visibility = 'public' or host_id = auth.uid())
  );

drop policy if exists "events_insert_own" on public.events;
create policy "events_insert_own" on public.events
  for insert with check (auth.uid() = host_id);

drop policy if exists "events_update_own" on public.events;
create policy "events_update_own" on public.events
  for update using (auth.uid() = host_id) with check (auth.uid() = host_id);

drop policy if exists "events_delete_own" on public.events;
create policy "events_delete_own" on public.events
  for delete using (auth.uid() = host_id);

drop policy if exists "event_rsvps_select_all" on public.event_rsvps;
create policy "event_rsvps_select_all" on public.event_rsvps
  for select using (true);

drop policy if exists "event_rsvps_insert_own" on public.event_rsvps;
create policy "event_rsvps_insert_own" on public.event_rsvps
  for insert with check (auth.uid() = profile_id);

drop policy if exists "event_rsvps_update_own" on public.event_rsvps;
create policy "event_rsvps_update_own" on public.event_rsvps
  for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

drop policy if exists "event_rsvps_delete_own" on public.event_rsvps;
create policy "event_rsvps_delete_own" on public.event_rsvps
  for delete using (auth.uid() = profile_id);

-- =============================================================================
-- 4. Activity log extension — EVENT_CREATED + EVENT_RSVPED
-- =============================================================================
alter table public.activity_log
  drop constraint if exists activity_log_type_check;

alter table public.activity_log
  add constraint activity_log_type_check
    check (type in (
      'USER_JOINED',
      'BOOK_ADDED',
      'BOOK_STATUS_CHANGED',
      'WTB_POSTED',
      'EVENT_CREATED',
      'EVENT_RSVPED'
    ));

alter table public.activity_log
  add column if not exists event_id uuid
    references public.events(id) on delete cascade;

create index if not exists idx_activity_event on public.activity_log(event_id);

-- Event created → EVENT_CREATED (public + non-hidden only)
create or replace function public.emit_event_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_hidden = false and new.visibility = 'public' then
    insert into public.activity_log(actor_user_id, type, event_id, created_at)
    values (new.host_id, 'EVENT_CREATED', new.id, new.created_at);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_event_created on public.events;
create trigger trg_event_created
  after insert on public.events
  for each row execute function public.emit_event_created();

-- RSVP inserted with status='going' → EVENT_RSVPED
-- INSERT-only; toggling maybe → going → maybe doesn't spam the feed.
create or replace function public.emit_event_rsvped()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  ev public.events%rowtype;
begin
  select * into ev from public.events where id = new.event_id;
  if ev.is_hidden = false and ev.visibility = 'public' and new.status = 'going' then
    insert into public.activity_log(actor_user_id, type, event_id, metadata, created_at)
    values (
      new.profile_id,
      'EVENT_RSVPED',
      new.event_id,
      jsonb_build_object('rsvp_status', new.status),
      new.created_at
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_event_rsvped on public.event_rsvps;
create trigger trg_event_rsvped
  after insert on public.event_rsvps
  for each row execute function public.emit_event_rsvped();

-- =============================================================================
-- 5. Comments
-- =============================================================================
comment on table public.events is
  'Community events. EVENT_CREATED activity emitted on insert (public + non-hidden only). Mastermind knowledge-artifact extensions land in a later migration.';

comment on table public.event_rsvps is
  'Composite PK (event_id, profile_id) ensures one row per attendee. EVENT_RSVPED activity fires on INSERT with status=going only — re-RSVP toggles via UPDATE do not spam the feed.';
