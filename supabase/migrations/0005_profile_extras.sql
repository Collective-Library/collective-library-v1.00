-- =============================================================================
-- Migration 0005 — profile extras: currently_reading_book_id
--
-- Adds a single-book pointer for the "Currently reading" widget on profile.
-- profile.cover_url already exists; no migration needed for the banner upload.
--
-- Recreates profiles_public to expose currently_reading_book_id (whatsapp
-- masking from migration 0002 preserved).
-- =============================================================================

alter table public.profiles
  add column if not exists currently_reading_book_id uuid
    references public.books(id) on delete set null;

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
  currently_reading_book_id,
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
