-- =============================================================================
-- Migration 0010 — consolidate 0005 + 0009 (remediation)
--
-- Some columns from 0005 didn't get applied in prod (likely a stale paste of
-- the earlier 0005 that only had currently_reading_book_id). This block is
-- idempotent and ensures the schema matches what 0005 + 0009 promised.
-- Safe to re-run.
-- =============================================================================

-- 0005 columns
alter table public.profiles
  add column if not exists currently_reading_book_id uuid
    references public.books(id) on delete set null;

alter table public.profiles
  add column if not exists show_on_map boolean default false not null;

alter table public.profiles
  add column if not exists map_lat double precision;

alter table public.profiles
  add column if not exists map_lng double precision;

-- 0009 columns
alter table public.profiles
  add column if not exists sub_interests text[];

alter table public.profiles
  add column if not exists intents text[];

create index if not exists idx_profiles_intents
  on public.profiles using gin(intents);

-- Recreate view with the full set of columns
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
  sub_interests,
  intents,
  favorite_genres,
  open_for_discussion,
  open_for_lending,
  open_for_selling,
  open_for_trade,
  is_admin,
  currently_reading_book_id,
  show_on_map,
  map_lat,
  map_lng,
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
