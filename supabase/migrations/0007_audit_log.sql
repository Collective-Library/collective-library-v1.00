-- =============================================================================
-- Migration 0007 — Audit log
--
-- Every UPDATE / DELETE on books, wanted_requests, profiles writes a row to
-- audit_log so admin can investigate "buku gue kok ilang" / "siapa yang ngubah".
-- Append-only; readable only via service-role (admin dashboard later).
-- =============================================================================

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  row_id uuid not null,
  action text not null check (action in ('UPDATE', 'DELETE')),
  actor_user_id uuid references public.profiles(id) on delete set null,
  before jsonb,
  after jsonb,
  created_at timestamptz default now() not null
);

create index if not exists idx_audit_table_row on public.audit_log(table_name, row_id);
create index if not exists idx_audit_actor on public.audit_log(actor_user_id);
create index if not exists idx_audit_created on public.audit_log(created_at desc);

-- RLS — only service-role reads. No user-facing access.
alter table public.audit_log enable row level security;

drop policy if exists "audit_no_user_access" on public.audit_log;
-- (No policies = no access for authenticated/anon. service-role bypasses RLS.)

-- Generic trigger function — works for any table whose row has an id uuid
-- and either owner_id or requester_id (used to attribute the actor).
create or replace function public.write_audit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid;
begin
  -- Best-effort actor attribution
  v_actor := coalesce(
    auth.uid(),
    (case when tg_table_name = 'books' then (case when tg_op = 'DELETE' then old.owner_id else new.owner_id end) end),
    (case when tg_table_name = 'wanted_requests' then (case when tg_op = 'DELETE' then old.requester_id else new.requester_id end) end),
    (case when tg_table_name = 'profiles' then (case when tg_op = 'DELETE' then old.id else new.id end) end)
  );

  if (tg_op = 'UPDATE') then
    insert into public.audit_log(table_name, row_id, action, actor_user_id, before, after)
    values (tg_table_name, new.id, 'UPDATE', v_actor, to_jsonb(old), to_jsonb(new));
    return new;
  elsif (tg_op = 'DELETE') then
    insert into public.audit_log(table_name, row_id, action, actor_user_id, before, after)
    values (tg_table_name, old.id, 'DELETE', v_actor, to_jsonb(old), null);
    return old;
  end if;
  return null;
end;
$$;

-- Wire triggers on the three tables we care about
drop trigger if exists trg_audit_books on public.books;
create trigger trg_audit_books
  after update or delete on public.books
  for each row execute function public.write_audit();

drop trigger if exists trg_audit_wanted on public.wanted_requests;
create trigger trg_audit_wanted
  after update or delete on public.wanted_requests
  for each row execute function public.write_audit();

drop trigger if exists trg_audit_profiles on public.profiles;
create trigger trg_audit_profiles
  after update or delete on public.profiles
  for each row execute function public.write_audit();

comment on table public.audit_log is
  'Append-only audit trail for UPDATE/DELETE on books, wanted_requests, profiles.';
