-- =============================================================================
-- Migration 0017 — Mastermind: Admin Notes (polymorphic) + audit_log read
--
-- Two pieces:
--   1. admin_notes — polymorphic notes attached to any entity (user, book,
--      wanted, feedback, okr_objective, okr_key_result, team_task). Used
--      across the Mastermind dashboard for inline founder annotations like
--      "watch this user — possible core contributor", "duplicate ISBN —
--      verify", or "promoted to admin on 2026-04-30".
--
--   2. audit_log SELECT policy — opens audit_log to admins via RLS so the
--      dashboard can render history without going through service-role.
--      Audit_log inserts remain trigger-only (already enforced in 0007/0008).
-- =============================================================================

-- =============================================================================
-- admin_notes — polymorphic on (entity_type, entity_id)
-- =============================================================================
create table if not exists public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in (
    'user', 'book', 'wanted', 'feedback',
    'okr_objective', 'okr_key_result', 'team_task'
  )),
  entity_id uuid not null,
  note text not null check (length(note) between 1 and 4000),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now() not null
);

-- Composite index for fast entity-detail-drawer lookups (newest first)
create index if not exists idx_admin_notes_entity
  on public.admin_notes(entity_type, entity_id, created_at desc);
create index if not exists idx_admin_notes_author
  on public.admin_notes(created_by, created_at desc);

-- =============================================================================
-- RLS — admin-only on everything
-- =============================================================================
alter table public.admin_notes enable row level security;

drop policy if exists "admin_notes_admin_all" on public.admin_notes;
create policy "admin_notes_admin_all" on public.admin_notes
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  ) with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

-- =============================================================================
-- audit_log — open SELECT to admins (was service-role only in 0007).
-- INSERT remains trigger-only; UPDATE/DELETE still locked. Migration 0007
-- created the table with RLS enabled and no policies (deny-all by default).
-- We add a single SELECT policy for admins.
-- =============================================================================
drop policy if exists "audit_log_select_admin" on public.audit_log;
create policy "audit_log_select_admin" on public.audit_log
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

comment on table public.admin_notes is
  'Mastermind: polymorphic admin annotations on any entity. Admin-only RLS.';
