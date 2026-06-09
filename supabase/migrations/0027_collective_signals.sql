-- =============================================================================
-- Migration 0027 — Collective Signals (auto-unlock achievement engine)
--
-- Collective Signals are NOT admin-awarded badges. They unlock automatically
-- from member activity (Strava / Apple Fitness / Spotify Wrapped vibe):
--
--   activity_log row  →  /api/signals/evaluate  →  count metric vs threshold
--                     →  user_signals (idempotent)  →  user_notifications
--                     →  (milestone only) activity_log SIGNAL_UNLOCKED → Discord
--
-- This migration lands the data layer only:
--   - signal_definitions  (config: what each Signal is)
--   - signal_rules        (config: unlock condition — metric + threshold)
--   - user_signals        (materialized unlock state, idempotent per user+signal)
--   - activity_log extension (SIGNAL_UNLOCKED type + user_signal_id FK column)
--   - seed of the v0 Signal definitions + rules
--
-- activity_log stays the source of truth (event-sourced); user_signals is the
-- materialized unlock state rendered on profiles. The TS engine + webhook land
-- in later slices. Backfill/eval is idempotent via the unique(user_id, slug).
--
-- Pattern reference: mirrors 0024_library_nodes.sql for the activity_log
-- extension (drop-then-add type constraint, add FK column, index) and RLS idiom.
--
-- Idempotent: safe to re-run.
-- =============================================================================

-- =============================================================================
-- 1. signal_definitions — what each Signal is (config, public-readable)
-- =============================================================================
create table if not exists public.signal_definitions (
  slug text primary key check (slug ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  name text not null check (length(name) between 2 and 80),
  description text check (description is null or length(description) <= 500),
  emoji text,
  category text not null default 'community'
    check (category in ('books', 'events', 'community', 'voice', 'places')),
  announce boolean not null default false,
  card_headline text,
  card_subcopy text,
  sort_order int not null default 0,
  created_at timestamptz default now() not null
);

-- =============================================================================
-- 2. signal_rules — unlock condition (config, service-role only)
--
--   One rule = "metric >= threshold over window". v0 windows are all_time.
--   unique(signal_slug, metric) keeps the seed idempotent and allows a future
--   signal to have multiple metric rules (AND-combined by the engine).
-- =============================================================================
create table if not exists public.signal_rules (
  id uuid primary key default gen_random_uuid(),
  signal_slug text not null references public.signal_definitions(slug) on delete cascade,
  metric text not null check (metric in (
    'any_activity',
    'books_added',
    'lendable_books',
    'events_hosted',
    'events_rsvped',
    'manifests_posted',
    'wtb_posted',
    'spots_created',
    'feedback_submitted',
    'referrals',
    'curations'
  )),
  threshold int not null default 1 check (threshold >= 1),
  window_kind text not null default 'all_time' check (window_kind in ('all_time')),
  is_active boolean not null default true,
  created_at timestamptz default now() not null,
  unique (signal_slug, metric)
);

create index if not exists idx_signal_rules_active_metric
  on public.signal_rules(metric) where is_active = true;

-- =============================================================================
-- 3. user_signals — materialized unlock state (public-readable, engine-written)
--
--   unique(user_id, signal_slug) is the idempotency guarantee: re-running the
--   engine or the backfill never double-unlocks.
-- =============================================================================
create table if not exists public.user_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  signal_slug text not null references public.signal_definitions(slug) on delete cascade,
  unlocked_at timestamptz default now() not null,
  source_activity_id uuid references public.activity_log(id) on delete set null,
  unique (user_id, signal_slug)
);

create index if not exists idx_user_signals_user
  on public.user_signals(user_id, unlocked_at desc);
create index if not exists idx_user_signals_slug
  on public.user_signals(signal_slug);

-- =============================================================================
-- 4. RLS
--
--   - signal_definitions: public read (profiles + cards render names/emoji).
--   - user_signals:       public read (public profiles render unlocked Signals).
--   - signal_rules:       RLS on, NO policy → only the service-role engine reads.
--   No INSERT/UPDATE/DELETE policies on any of these: writes are service-role
--   only (the engine), so members cannot forge unlocks. Mirrors activity_log.
-- =============================================================================
alter table public.signal_definitions enable row level security;
alter table public.signal_rules enable row level security;
alter table public.user_signals enable row level security;

drop policy if exists "signal_definitions_select_all" on public.signal_definitions;
create policy "signal_definitions_select_all" on public.signal_definitions
  for select using (true);

drop policy if exists "user_signals_select_all" on public.user_signals;
create policy "user_signals_select_all" on public.user_signals
  for select using (true);

-- (signal_rules: intentionally no policy — service-role engine only.)

-- =============================================================================
-- 5. activity_log extension — SIGNAL_UNLOCKED
--
--    The engine inserts a SIGNAL_UNLOCKED row (service-role) ONLY for milestone
--    signals (definition.announce = true). The existing Supabase DB webhook →
--    /api/discord-webhook then announces it, and it surfaces in the public feed.
--    The evaluate webhook MUST ignore this type (loop guard).
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
      'EVENT_RSVPED',
      'MANIFEST_POSTED',
      'NODE_CREATED',
      'SIGNAL_UNLOCKED'
    ));

alter table public.activity_log
  add column if not exists user_signal_id uuid
    references public.user_signals(id) on delete cascade;

create index if not exists idx_activity_user_signal
  on public.activity_log(user_signal_id);

-- =============================================================================
-- 6. Seed — v0 Signal definitions
--
--    on conflict do update keeps this migration the source of truth for copy.
-- =============================================================================
insert into public.signal_definitions
  (slug, name, description, emoji, category, announce, card_headline, card_subcopy, sort_order)
values
  ('first_spark',     'First Spark',        'Unlock dari aktivitas pertama kamu di Collective.', '✨', 'community', false, 'First Spark',        'Langkah pertama di Collective Library.',        10),
  ('book_starter',    'Book Starter',       'Unlock waktu kamu naikin buku pertama.',            '📖', 'books',     false, 'Book Starter',       'Buku pertama naik ke rak komunitas.',           20),
  ('library_builder', 'Library Builder',    'Unlock setelah 5 buku ditaro ke rak.',              '📚', 'books',     true,  'Library Builder',    '5 buku ditaro ke ekosistem.',                   30),
  ('open_shelf',      'Open Shelf',         'Unlock waktu buku pertama dibuka buat dipinjam.',   '🤝', 'books',     true,  'Open Shelf',         'Buku pertama dibuka buat dipinjam.',            40),
  ('event_host',      'Event Host',         'Unlock waktu kamu bikin event pertama.',            '🎙️', 'events',    true,  'Event Host',         'Bikin event pertama buat komunitas.',           50),
  ('event_goer',      'Event Goer',         'Unlock waktu kamu RSVP event pertama.',             '🙌', 'events',    false, 'Event Goer',         'RSVP event pertama. Sampai ketemu di sana.',    60),
  ('manifesto',       'Manifesto',          'Unlock waktu manifest pertama kamu naik.',          '🔥', 'voice',     true,  'Manifesto',          'Manifest pertama dilempar ke publik.',          70),
  ('seeker',          'Seeker',             'Unlock waktu kamu posting WTB pertama.',            '🔎', 'books',     false, 'Seeker',             'Nyari buku pertama lewat Wanted.',              80),
  ('placemaker',      'Placemaker',         'Unlock waktu Spot pertama kamu aktif.',             '📍', 'places',    true,  'Placemaker',         'Bikin Spot pertama di peta komunitas.',         90),
  ('feedback_friend', 'Feedback Friend',    'Unlock waktu kamu kasih masukan pertama.',          '💬', 'community', false, 'Feedback Friend',    'Kasih masukan pertama buat Collective.',        100),
  ('connector',       'Connector',          'Unlock waktu kamu ngajak member pertama gabung.',   '🔗', 'community', true,  'Connector',          'Ngajak orang pertama gabung.',                  110),
  ('curator',         'Knowledge Curator',  'Unlock waktu kamu bikin kurasi pertama.',           '🗂️', 'community', true,  'Knowledge Curator',  'Bikin kurasi pertama.',                         120)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  emoji = excluded.emoji,
  category = excluded.category,
  announce = excluded.announce,
  card_headline = excluded.card_headline,
  card_subcopy = excluded.card_subcopy,
  sort_order = excluded.sort_order;

-- =============================================================================
-- 7. Seed — v0 Signal rules
--
--    connector + curator are reserved (is_active=false): no data source yet.
-- =============================================================================
insert into public.signal_rules (signal_slug, metric, threshold, is_active)
values
  ('first_spark',     'any_activity',       1, true),
  ('book_starter',    'books_added',        1, true),
  ('library_builder', 'books_added',        5, true),
  ('open_shelf',      'lendable_books',     1, true),
  ('event_host',      'events_hosted',      1, true),
  ('event_goer',      'events_rsvped',      1, true),
  ('manifesto',       'manifests_posted',   1, true),
  ('seeker',          'wtb_posted',         1, true),
  ('placemaker',      'spots_created',      1, true),
  ('feedback_friend', 'feedback_submitted', 1, true),
  ('connector',       'referrals',          1, false),
  ('curator',         'curations',          1, false)
on conflict (signal_slug, metric) do update set
  threshold = excluded.threshold,
  is_active = excluded.is_active;

-- =============================================================================
-- 8. Comments
-- =============================================================================
comment on table public.signal_definitions is
  'Collective Signals catalog (config). Public-readable so profiles/cards render. announce=true means a SIGNAL_UNLOCKED activity row + Discord "Signal Drop" fires on unlock (milestone-only).';
comment on table public.signal_rules is
  'Unlock conditions (config). Service-role only. metric >= threshold over window_kind. unique(signal_slug, metric) keeps seeding idempotent.';
comment on table public.user_signals is
  'Materialized unlock state. Engine-written (service-role). unique(user_id, signal_slug) makes unlocks idempotent.';
comment on column public.activity_log.user_signal_id is
  'Set on SIGNAL_UNLOCKED rows (milestone signals). Links the public feed entry / Discord announce back to the unlocked user_signals row.';

-- =============================================================================
-- ROLLBACK (manual; commented for reference):
--
--   drop index if exists public.idx_activity_user_signal;
--   alter table public.activity_log drop column if exists user_signal_id;
--   alter table public.activity_log drop constraint if exists activity_log_type_check;
--   alter table public.activity_log
--     add constraint activity_log_type_check
--       check (type in (
--         'USER_JOINED', 'BOOK_ADDED', 'BOOK_STATUS_CHANGED', 'WTB_POSTED',
--         'EVENT_CREATED', 'EVENT_RSVPED', 'MANIFEST_POSTED', 'NODE_CREATED'
--       ));
--   drop policy if exists "user_signals_select_all" on public.user_signals;
--   drop policy if exists "signal_definitions_select_all" on public.signal_definitions;
--   drop index if exists public.idx_user_signals_slug;
--   drop index if exists public.idx_user_signals_user;
--   drop table if exists public.user_signals;
--   drop index if exists public.idx_signal_rules_active_metric;
--   drop table if exists public.signal_rules;
--   drop table if exists public.signal_definitions;
-- =============================================================================
