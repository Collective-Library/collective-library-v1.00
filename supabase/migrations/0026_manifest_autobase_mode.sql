-- =============================================================================
-- Migration 0026 — Manifest Autobase Mode
--
-- Switches manifest publishing from admin-approval gate to autobase:
-- user submits → manifest immediately public → activity_log fires →
-- Discord auto-announce via existing webhook.
--
-- Admin moderation stays as retroactive safety net: admin can hide or
-- reject any manifest after publishing. No pre-approval gate.
--
-- Changes:
--   1. status default: 'pending' → 'approved'
--   2. approved_at default: null → now()
--   3. Trigger: UPDATE-only → INSERT OR UPDATE (so auto-approved inserts
--      still emit MANIFEST_POSTED into activity_log)
--   4. Author-edit policy: was locked to status='pending' rows; updated
--      to allow editing own non-hidden, non-rejected manifests
-- =============================================================================

-- 1. Default status → approved
alter table public.manifests
  alter column status set default 'approved';

-- 2. Default approved_at → now() so newly inserted manifests carry a timestamp
alter table public.manifests
  alter column approved_at set default now();

-- 3. Update trigger function to handle INSERT (autobase) and UPDATE (legacy admin approval)
create or replace function public.emit_manifest_posted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- INSERT path: manifest created with status='approved' (new autobase default)
  if TG_OP = 'INSERT'
     and new.status = 'approved'
     and new.is_hidden = false
     and new.visibility = 'public' then
    insert into public.activity_log(actor_user_id, type, manifest_id, created_at)
    values (new.author_id, 'MANIFEST_POSTED', new.id, coalesce(new.approved_at, now()));
    return new;
  end if;

  -- UPDATE path: legacy pending manifest manually approved by admin
  if TG_OP = 'UPDATE'
     and (old.status is distinct from new.status)
     and new.status = 'approved'
     and new.is_hidden = false
     and new.visibility = 'public' then
    insert into public.activity_log(actor_user_id, type, manifest_id, created_at)
    values (new.author_id, 'MANIFEST_POSTED', new.id, coalesce(new.approved_at, now()));
    return new;
  end if;

  return new;
end;
$$;

-- 4. Replace UPDATE-only trigger with INSERT OR UPDATE
drop trigger if exists trg_manifest_posted on public.manifests;
create trigger trg_manifest_posted
  after insert or update on public.manifests
  for each row execute function public.emit_manifest_posted();

-- 5. Update author-edit policy.
--    Old: locked to status='pending' rows — with autobase all manifests start
--    approved, locking authors out of editing their own content entirely.
--    New: authors can update own non-hidden, non-rejected manifests.
--    (No edit UI exists yet but policy should be correct.)
drop policy if exists "manifests_update_author_pending" on public.manifests;
create policy "manifests_update_author_pending" on public.manifests
  for update
  using (
    auth.uid() = author_id
    and is_hidden = false
    and status != 'rejected'
  )
  with check (
    auth.uid() = author_id
    and is_hidden = false
    and status != 'rejected'
  );
