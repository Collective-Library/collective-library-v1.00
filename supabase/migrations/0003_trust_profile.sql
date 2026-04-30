-- =============================================================================
-- Migration 0003 — Trust Profile expansion
--
-- Adds personal-branding fields (LinkedIn, website, profession) and a flat
-- interests[] for the chip-based discovery layer. Recreates
-- public.profiles_public to include the new columns (whatsapp masking
-- preserved).
-- =============================================================================

-- 1. New columns on profiles. All optional, all default null.
alter table public.profiles
  add column if not exists linkedin_url text,
  add column if not exists website_url text,
  add column if not exists profession text,
  add column if not exists interests text[];

-- 2. Recreate the public view with the new columns. The CASE expression for
--    whatsapp keeps the privacy guarantee from migration 0002.
drop view if exists public.profiles_public;

create view public.profiles_public as
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
  linkedin_url,
  website_url,
  profession,
  campus_or_workplace,
  interests,
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

grant select on public.profiles_public to authenticated, anon;

comment on view public.profiles_public is
  'Public read of profiles. whatsapp masked unless whatsapp_public=true OR self.';
