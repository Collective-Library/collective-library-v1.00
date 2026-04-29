-- =============================================================================
-- Migration 0002 — privacy fix: mask whatsapp behind whatsapp_public.
--
-- Problem (audit P0): RLS `profiles_select_all` allows any authenticated user
-- to query `whatsapp` directly via REST, bypassing the frontend's
-- `whatsapp_public` filter. Run this in Supabase SQL editor BEFORE deploy.
-- =============================================================================

-- 1. Restrict direct SELECT on profiles to OWN row only.
drop policy if exists "profiles_select_all" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- 2. Public-facing view that masks whatsapp unless the column owner has
--    opted in OR the requester IS the column owner.
--
-- The view runs with the privileges of the view's owner (postgres role by
-- default in Supabase), so it bypasses the row-level policy on profiles
-- and can return rows for everyone — but the CASE expression masks
-- whatsapp per-row.
create or replace view public.profiles_public as
select
  id,
  full_name,
  username,
  photo_url,
  cover_url,
  city,
  address_area,
  bio,
  instagram,
  discord,
  goodreads_url,
  storygraph_url,
  campus_or_workplace,
  favorite_genres,
  open_for_discussion,
  open_for_lending,
  open_for_selling,
  open_for_trade,
  is_admin,
  created_at,
  updated_at,
  whatsapp_public,
  case
    when whatsapp_public is true then whatsapp
    when id = auth.uid() then whatsapp
    else null
  end as whatsapp
from public.profiles;

-- 3. Make the view accessible to the same roles that previously read profiles.
grant select on public.profiles_public to authenticated, anon;

-- 4. Comment for future maintainers.
comment on view public.profiles_public is
  'Public read of profiles. whatsapp masked unless whatsapp_public=true OR self.';
