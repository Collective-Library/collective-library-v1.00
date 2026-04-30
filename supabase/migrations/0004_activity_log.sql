-- =============================================================================
-- Migration 0004 — Event-based Activity Log
--
-- Centralized event log for the activity feed. Triggers on books,
-- wanted_requests, and profiles emit rows here automatically; the app
-- reads from this table to render /aktivitas + the /shelf widget.
--
-- Backfill at the end seeds existing books, wanted requests, and joined
-- users so the feed is non-empty on first load after migration.
-- =============================================================================

-- 1. Table
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete cascade,
  type text not null check (type in (
    'USER_JOINED',
    'BOOK_ADDED',
    'BOOK_STATUS_CHANGED',
    'WTB_POSTED'
  )),
  book_id uuid references public.books(id) on delete set null,
  wanted_id uuid references public.wanted_requests(id) on delete set null,
  metadata jsonb,
  created_at timestamptz default now() not null
);

create index if not exists idx_activity_created on public.activity_log(created_at desc);
create index if not exists idx_activity_type on public.activity_log(type);
create index if not exists idx_activity_actor on public.activity_log(actor_user_id);

-- 2. RLS — anyone can read; only service-role / triggers can write
alter table public.activity_log enable row level security;

drop policy if exists "activity_select_all" on public.activity_log;
create policy "activity_select_all" on public.activity_log
  for select using (true);

-- (No insert policy — triggers run with security definer; direct user
-- inserts are blocked by default.)

-- =============================================================================
-- 3. Triggers
-- =============================================================================

-- Book created → BOOK_ADDED
create or replace function public.emit_book_added()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_hidden = false and new.visibility = 'public' then
    insert into public.activity_log(actor_user_id, type, book_id, created_at)
    values (new.owner_id, 'BOOK_ADDED', new.id, new.created_at);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_book_added on public.books;
create trigger trg_book_added
  after insert on public.books
  for each row execute function public.emit_book_added();

-- Book status flips to sell/lend/trade → BOOK_STATUS_CHANGED
create or replace function public.emit_book_status_changed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status is distinct from new.status
     and new.status in ('sell', 'lend', 'trade')
     and new.is_hidden = false
     and new.visibility = 'public' then
    insert into public.activity_log(actor_user_id, type, book_id, metadata)
    values (
      new.owner_id,
      'BOOK_STATUS_CHANGED',
      new.id,
      jsonb_build_object('old_status', old.status, 'new_status', new.status)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_book_status_changed on public.books;
create trigger trg_book_status_changed
  after update on public.books
  for each row execute function public.emit_book_status_changed();

-- WTB posted → WTB_POSTED
create or replace function public.emit_wtb_posted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.activity_log(actor_user_id, type, wanted_id, created_at)
  values (new.requester_id, 'WTB_POSTED', new.id, new.created_at);
  return new;
end;
$$;

drop trigger if exists trg_wtb_posted on public.wanted_requests;
create trigger trg_wtb_posted
  after insert on public.wanted_requests
  for each row execute function public.emit_wtb_posted();

-- Profile completion (username set for the first time) → USER_JOINED
create or replace function public.emit_user_joined()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.username is null and new.username is not null then
    insert into public.activity_log(actor_user_id, type)
    values (new.id, 'USER_JOINED');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_user_joined on public.profiles;
create trigger trg_user_joined
  after update on public.profiles
  for each row execute function public.emit_user_joined();

-- =============================================================================
-- 4. Backfill — seed activity_log from existing data so the feed is hydrated
-- =============================================================================

-- Backfill BOOK_ADDED for every existing public book
insert into public.activity_log(actor_user_id, type, book_id, created_at)
select b.owner_id, 'BOOK_ADDED', b.id, b.created_at
from public.books b
where b.is_hidden = false and b.visibility = 'public'
  and not exists (
    select 1 from public.activity_log a
    where a.type = 'BOOK_ADDED' and a.book_id = b.id
  );

-- Backfill WTB_POSTED for every existing wanted request
insert into public.activity_log(actor_user_id, type, wanted_id, created_at)
select w.requester_id, 'WTB_POSTED', w.id, w.created_at
from public.wanted_requests w
where not exists (
  select 1 from public.activity_log a
  where a.type = 'WTB_POSTED' and a.wanted_id = w.id
);

-- Backfill USER_JOINED for users who completed onboarding (username set)
insert into public.activity_log(actor_user_id, type, created_at)
select p.id, 'USER_JOINED', p.created_at
from public.profiles p
where p.username is not null
  and not exists (
    select 1 from public.activity_log a
    where a.type = 'USER_JOINED' and a.actor_user_id = p.id
  );

-- =============================================================================
-- 5. Comment
-- =============================================================================
comment on table public.activity_log is
  'Append-only event log powering the /aktivitas feed. Populated by triggers.';
