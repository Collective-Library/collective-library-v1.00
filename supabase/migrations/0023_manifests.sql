-- =============================================================================
-- Migration 0023 — Manifests (Phase 1 growth loop)
--
-- Manifest = a short, public statement (curious thought, manifesto, idea
-- about books/community) that a member writes for the world to see. After
-- admin approval, manifests surface on /manifest + activity feed + RSS,
-- and can be hand-posted to X (@collectivelibrary.id) using a generated
-- template — bringing new eyeballs back to Collective Library.
--
-- Per BMC §3.5: manifest is the public-discovery / growth-loop layer.
-- "Activity creates visibility → curiosity → connection → trust → commerce."
-- Manifest is the exhale that lets Events' inhale reach the outside world.
--
-- Phase 1 is intentionally low-tech: manual admin approval, optional
-- semi-anonymous identity, X post via copy-paste template (no API).
-- Coin economy and scheduled posts are deferred — gate them on actual
-- behavior, not speculation.
-- =============================================================================

-- =============================================================================
-- 1. manifests table
-- =============================================================================
create table if not exists public.manifests (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(body) between 10 and 1200),
  mood text check (mood is null or mood in (
    'curious', 'hopeful', 'frustrated', 'grateful', 'reflective', 'playful'
  )),
  topic text check (topic is null or length(topic) <= 80),
  is_anonymous boolean not null default false,
  -- Optional links back to other surfaces (activity object referencing)
  linked_event_id uuid references public.events(id) on delete set null,
  linked_book_id uuid references public.books(id) on delete set null,
  linked_profile_id uuid references public.profiles(id) on delete set null,
  visibility text not null default 'public'
    check (visibility in ('public', 'community')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  moderation_note text check (moderation_note is null or length(moderation_note) <= 500),
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  is_hidden boolean not null default false,
  discord_announced_at timestamptz,
  -- When the admin hand-posts to X, can record the URL for backlink
  x_posted_url text,
  x_posted_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_manifests_status_created
  on public.manifests(status, created_at desc);
create index if not exists idx_manifests_author
  on public.manifests(author_id);
create index if not exists idx_manifests_public_approved
  on public.manifests(created_at desc)
  where status = 'approved' and is_hidden = false and visibility = 'public';

drop trigger if exists trg_manifests_updated_at on public.manifests;
create trigger trg_manifests_updated_at
  before update on public.manifests
  for each row execute function public.set_updated_at();

-- =============================================================================
-- 2. RLS
--    - select: approved + public + non-hidden for everyone; author sees own;
--             admins see all (for moderation queue)
--    - insert: only the author can insert (auth.uid() = author_id)
--    - update: admins (for approve/reject); author can edit own ONLY while
--             status='pending' (to fix typos before mod)
--    - delete: author can delete own; admins can delete
-- =============================================================================
alter table public.manifests enable row level security;

drop policy if exists "manifests_select_public" on public.manifests;
create policy "manifests_select_public" on public.manifests
  for select using (
    (status = 'approved' and is_hidden = false and visibility = 'public')
    or author_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

drop policy if exists "manifests_insert_own" on public.manifests;
create policy "manifests_insert_own" on public.manifests
  for insert with check (auth.uid() = author_id);

drop policy if exists "manifests_update_author_pending" on public.manifests;
create policy "manifests_update_author_pending" on public.manifests
  for update using (auth.uid() = author_id and status = 'pending')
  with check (auth.uid() = author_id and status = 'pending');

drop policy if exists "manifests_update_admin" on public.manifests;
create policy "manifests_update_admin" on public.manifests
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

drop policy if exists "manifests_delete_own_or_admin" on public.manifests;
create policy "manifests_delete_own_or_admin" on public.manifests
  for delete using (
    auth.uid() = author_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

-- =============================================================================
-- 3. Activity log extension — MANIFEST_POSTED
--
--    Fires only when status transitions to 'approved' (not on creation).
--    Public + non-hidden + visibility='public' only — admin-rejected and
--    community-only manifests stay out of the public feed.
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
      'MANIFEST_POSTED'
    ));

alter table public.activity_log
  add column if not exists manifest_id uuid
    references public.manifests(id) on delete cascade;

create index if not exists idx_activity_manifest on public.activity_log(manifest_id);

create or replace function public.emit_manifest_posted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status is distinct from new.status
     and new.status = 'approved'
     and new.is_hidden = false
     and new.visibility = 'public' then
    insert into public.activity_log(actor_user_id, type, manifest_id, created_at)
    values (new.author_id, 'MANIFEST_POSTED', new.id, coalesce(new.approved_at, now()));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_manifest_posted on public.manifests;
create trigger trg_manifest_posted
  after update on public.manifests
  for each row execute function public.emit_manifest_posted();

-- =============================================================================
-- 4. Comments
-- =============================================================================
comment on table public.manifests is
  'Public micro-statements from members. Pending until admin approval; approved manifests surface on /manifest, activity feed, RSS, and become hand-postable to X. Growth loop per BMC §3.5.';

comment on column public.manifests.is_anonymous is
  'When true, UI displays author as "Anonymous". author_id is still stored for moderation/audit — only the display is masked.';

comment on column public.manifests.x_posted_url is
  'URL of the published X post (filled in by admin after hand-posting via the copy-paste template). Used to backlink "see on X" from /manifest/[id].';
