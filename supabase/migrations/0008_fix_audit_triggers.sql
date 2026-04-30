-- =============================================================================
-- Migration 0008 — fix: split audit trigger into 3 table-specific functions
--
-- Problem with 0007's generic write_audit():
--   PL/pgSQL plans the function body before execution. Even though the CASE
--   branches are guarded by `tg_table_name = '...'`, PL/pgSQL still resolves
--   field references like `old.owner_id` against the record type of the
--   firing table. When fired on `profiles` (which has no `owner_id`), it
--   blows up with: record "old" has no field "owner_id".
--
-- Fix: one trigger function per table. Each only references fields that
-- actually exist on its table — no cross-table CASE acrobatics needed.
-- =============================================================================

-- Detach old triggers first (CREATE OR REPLACE FUNCTION won't replace if
-- signature differs and we want a clean break)
drop trigger if exists trg_audit_books on public.books;
drop trigger if exists trg_audit_wanted on public.wanted_requests;
drop trigger if exists trg_audit_profiles on public.profiles;

-- Drop the generic function (now unused)
drop function if exists public.write_audit() cascade;

-- =============================================================================
-- books → audit_log
-- =============================================================================
create or replace function public.write_audit_books()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid;
begin
  v_actor := coalesce(auth.uid(), case when tg_op = 'DELETE' then old.owner_id else new.owner_id end);
  if (tg_op = 'UPDATE') then
    insert into public.audit_log(table_name, row_id, action, actor_user_id, before, after)
    values ('books', new.id, 'UPDATE', v_actor, to_jsonb(old), to_jsonb(new));
    return new;
  elsif (tg_op = 'DELETE') then
    insert into public.audit_log(table_name, row_id, action, actor_user_id, before, after)
    values ('books', old.id, 'DELETE', v_actor, to_jsonb(old), null);
    return old;
  end if;
  return null;
end;
$$;

create trigger trg_audit_books
  after update or delete on public.books
  for each row execute function public.write_audit_books();

-- =============================================================================
-- wanted_requests → audit_log
-- =============================================================================
create or replace function public.write_audit_wanted()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid;
begin
  v_actor := coalesce(auth.uid(), case when tg_op = 'DELETE' then old.requester_id else new.requester_id end);
  if (tg_op = 'UPDATE') then
    insert into public.audit_log(table_name, row_id, action, actor_user_id, before, after)
    values ('wanted_requests', new.id, 'UPDATE', v_actor, to_jsonb(old), to_jsonb(new));
    return new;
  elsif (tg_op = 'DELETE') then
    insert into public.audit_log(table_name, row_id, action, actor_user_id, before, after)
    values ('wanted_requests', old.id, 'DELETE', v_actor, to_jsonb(old), null);
    return old;
  end if;
  return null;
end;
$$;

create trigger trg_audit_wanted
  after update or delete on public.wanted_requests
  for each row execute function public.write_audit_wanted();

-- =============================================================================
-- profiles → audit_log (actor = the profile being changed itself)
-- =============================================================================
create or replace function public.write_audit_profiles()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid;
begin
  v_actor := coalesce(auth.uid(), case when tg_op = 'DELETE' then old.id else new.id end);
  if (tg_op = 'UPDATE') then
    insert into public.audit_log(table_name, row_id, action, actor_user_id, before, after)
    values ('profiles', new.id, 'UPDATE', v_actor, to_jsonb(old), to_jsonb(new));
    return new;
  elsif (tg_op = 'DELETE') then
    insert into public.audit_log(table_name, row_id, action, actor_user_id, before, after)
    values ('profiles', old.id, 'DELETE', v_actor, to_jsonb(old), null);
    return old;
  end if;
  return null;
end;
$$;

create trigger trg_audit_profiles
  after update or delete on public.profiles
  for each row execute function public.write_audit_profiles();
