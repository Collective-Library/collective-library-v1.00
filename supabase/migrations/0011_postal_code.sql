-- =============================================================================
-- Migration 0011 — postal_code on profiles
--
-- Lets users pick their location via Indonesian postal code (kode pos) instead
-- of free-typing kecamatan name. The /api/postal-code/lookup endpoint resolves
-- code → { village, district, regency, province, lat, lng } and we cache the
-- result on the profile so /peta + /anggota filters stay snappy.
--
-- Recreates profiles_public to expose postal_code (read-side only; lat/lng
-- already exposed via map_lat / map_lng from migration 0005).
-- =============================================================================

alter table public.profiles
  add column if not exists postal_code text;

create index if not exists idx_profiles_postal_code
  on public.profiles(postal_code)
  where postal_code is not null;

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
  postal_code,
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
