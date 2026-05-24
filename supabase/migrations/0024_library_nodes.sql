-- =============================================================================
-- Migration 0024 — Library Nodes (Spots foundation, Phase 1.5)
--
-- Library Nodes are physical reading spaces with digital identity:
-- cafes, public bookshelves (Omah Baca Nawala-style), community venues,
-- school/campus reading corners, partner libraries, coworking spaces.
--
--   Internal model name: library_nodes
--   User-facing label:   "Spots"
--   Future public route: /spots (reserved, NOT built in this migration)
--
-- This migration lands ONLY the foundation:
--   - library_nodes table + indexes + RLS
--   - activity_log extension (NODE_CREATED type + node_id FK column)
--   - emit_node_created trigger (fires on status transition → 'active')
--
-- Deferred (do NOT build until later slices land + admin approves):
--   - public /spots list and detail pages
--   - map UI integration on /peta
--   - QR code generation
--   - node_visits table (visit/check-in activity)         [name reserved]
--   - books.node_id (book ↔ Spot linking)                  [name reserved]
--   - events.node_id (FK from events)                      [slice 3, mig 0025]
--   - node_host / partner role
--   - partner dashboard
--
-- Naming rationale: builders, the foundation doc, and partnership pitches all
-- talk in "Library Nodes" (graph-theory framing). End users see "Spots"
-- everywhere (concrete, casual). Internal model stays library_nodes; UI label
-- stays "Spots". Documented in docs/spots/README.md (slice 4).
--
-- Pattern reference: this migration mirrors 0023_manifests.sql for:
--   - status + admin-promotion flow (admin moves needs_audit → active)
--   - activity_log extension (drop-then-add constraint, new FK column, trigger)
--   - is_admin check via inline `exists(... from profiles ... is_admin=true)`
--
-- Idempotent: safe to re-run.
-- =============================================================================

-- =============================================================================
-- 1. library_nodes table
-- =============================================================================
create table if not exists public.library_nodes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 3 and 140),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  type text not null check (type in (
    'cafe',
    'public_shelf',
    'community_space',
    'school',
    'campus',
    'library',
    'coworking',
    'partner',
    'other'
  )),
  city text not null check (length(city) between 1 and 120),
  address text,
  latitude numeric,
  longitude numeric,
  maps_url text,
  description text check (description is null or length(description) <= 2000),
  image_url text,
  operating_hours text check (operating_hours is null or length(operating_hours) <= 500),
  community_id uuid references public.communities(id) on delete set null,
  status text not null default 'needs_audit'
    check (status in ('active', 'inactive', 'needs_audit')),
  is_active boolean not null default true,
  visibility text not null default 'public'
    check (visibility in ('public', 'community')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_library_nodes_visibility_status
  on public.library_nodes(is_active, visibility, status);
create index if not exists idx_library_nodes_city
  on public.library_nodes(city);
create index if not exists idx_library_nodes_created_by
  on public.library_nodes(created_by);
create index if not exists idx_library_nodes_active_recent
  on public.library_nodes(updated_at desc)
  where status = 'active' and is_active = true and visibility = 'public';

drop trigger if exists trg_library_nodes_updated_at on public.library_nodes;
create trigger trg_library_nodes_updated_at
  before update on public.library_nodes
  for each row execute function public.set_updated_at();

-- =============================================================================
-- 2. RLS
--
--   - select: active + public + is_active for everyone; owner sees own;
--             admins see all (triage queue).
--   - insert: only auth users with ≥1 hosted event can create. Default seed is
--             status='needs_audit'.
--   - update: owner or admin.
--   - delete: owner or admin.
--
--   NOTE: RLS allows owner to write any column including status/is_active.
--   The mastermind/admin route layer (slice 2) re-checks is_admin server-side
--   before accepting writes to those columns. Same pattern as /api/feedback.
-- =============================================================================
alter table public.library_nodes enable row level security;

drop policy if exists "spots_select_public" on public.library_nodes;
create policy "spots_select_public" on public.library_nodes
  for select using (
    (status = 'active' and visibility = 'public' and is_active = true)
    or created_by = auth.uid()
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

drop policy if exists "spots_insert_host_eligible" on public.library_nodes;
create policy "spots_insert_host_eligible" on public.library_nodes
  for insert with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.events
      where events.host_id = auth.uid()
    )
  );

drop policy if exists "spots_update_owner_or_admin" on public.library_nodes;
create policy "spots_update_owner_or_admin" on public.library_nodes
  for update using (
    auth.uid() = created_by
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  )
  with check (
    auth.uid() = created_by
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

drop policy if exists "spots_delete_owner_or_admin" on public.library_nodes;
create policy "spots_delete_owner_or_admin" on public.library_nodes
  for delete using (
    auth.uid() = created_by
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

-- =============================================================================
-- 3. Activity log extension — NODE_CREATED
--
--    Fires only when status transitions to 'active' AND is_active=true AND
--    visibility='public'. Creation alone does NOT emit; admin promotion is the
--    trigger point. Mirrors emit_manifest_posted in 0023.
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
      'NODE_CREATED'
    ));

alter table public.activity_log
  add column if not exists node_id uuid
    references public.library_nodes(id) on delete cascade;

create index if not exists idx_activity_node on public.activity_log(node_id);

create or replace function public.emit_node_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status is distinct from new.status
     and new.status = 'active'
     and new.is_active = true
     and new.visibility = 'public' then
    insert into public.activity_log(actor_user_id, type, node_id, created_at)
    values (
      coalesce(new.created_by, auth.uid()),
      'NODE_CREATED',
      new.id,
      now()
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_node_created on public.library_nodes;
create trigger trg_node_created
  after update on public.library_nodes
  for each row execute function public.emit_node_created();

-- =============================================================================
-- 4. Comments
-- =============================================================================
comment on table public.library_nodes is
  'Physical reading spaces with digital identity (UI label: "Spots"). Cafes, public bookshelves (Nawala-style), community venues, schools/campuses, partner libraries, coworking spaces. Default status=needs_audit; admin promotes to active to make discoverable. Public /spots UI deferred — see docs/spots/README.md.';

comment on column public.library_nodes.status is
  'Curation lifecycle: needs_audit (default, hidden from public) → active (discoverable) → inactive (archived). Admin-only column write via /api/admin/spots; RLS does not column-restrict, the API layer does.';

comment on column public.library_nodes.is_active is
  'Hard admin kill-switch independent of status lifecycle. Both is_active=true AND status=active AND visibility=public must hold for the row to surface publicly.';

comment on column public.library_nodes.created_by is
  'Member who created the Spot. Permission rule: any auth user with at least one hosted event in public.events may insert. Set null on profile delete to preserve attribution.';

-- =============================================================================
-- 5. Reserved names for future slices (DO NOT create now)
-- =============================================================================
-- Reserved table:  public.node_visits        (slice: visit/check-in activity)
-- Reserved column: public.books.node_id      (slice: book ↔ Spot linking)
-- Reserved column: public.events.node_id     (slice 3, migration 0025)
-- Reserved type constant: 'NODE_VISITED'     (slice: visit/check-in activity)
--
-- These are name-squatted intentionally so naming stays consistent when those
-- slices land. Do not introduce until the public /spots layer ships and the
-- foundation has been validated in production.

-- =============================================================================
-- ROLLBACK (manual; commented for reference):
--
--   drop trigger if exists trg_node_created on public.library_nodes;
--   drop function if exists public.emit_node_created();
--   drop index if exists public.idx_activity_node;
--   alter table public.activity_log drop column if exists node_id;
--   alter table public.activity_log drop constraint if exists activity_log_type_check;
--   alter table public.activity_log
--     add constraint activity_log_type_check
--       check (type in (
--         'USER_JOINED', 'BOOK_ADDED', 'BOOK_STATUS_CHANGED', 'WTB_POSTED',
--         'EVENT_CREATED', 'EVENT_RSVPED', 'MANIFEST_POSTED'
--       ));
--   drop policy if exists "spots_delete_owner_or_admin" on public.library_nodes;
--   drop policy if exists "spots_update_owner_or_admin" on public.library_nodes;
--   drop policy if exists "spots_insert_host_eligible" on public.library_nodes;
--   drop policy if exists "spots_select_public" on public.library_nodes;
--   drop trigger if exists trg_library_nodes_updated_at on public.library_nodes;
--   drop index if exists public.idx_library_nodes_active_recent;
--   drop index if exists public.idx_library_nodes_created_by;
--   drop index if exists public.idx_library_nodes_city;
--   drop index if exists public.idx_library_nodes_visibility_status;
--   drop table if exists public.library_nodes;
-- =============================================================================
