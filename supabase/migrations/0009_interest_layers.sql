-- =============================================================================
-- Migration 0009 — interest taxonomy: Layer 2 (sub-interests) + Layer 3 (intent)
--
-- Layer 1 already exists as profiles.interests text[] (broad domains).
-- This adds:
--   sub_interests text[]  — Layer 2: granular topics within a broad interest
--                           (e.g. "eksistensialisme" under filsafat)
--   intents       text[]  — Layer 3: what the member wants to DO
--                           (diskusi, book-club, pinjam-meminjam, etc)
--
-- Both flat text arrays. App-side validates against the canonical taxonomy
-- in lib/interests.ts so the schema can stay schema-less + flexible.
--
-- Recreates profiles_public to expose the new columns.
-- =============================================================================

alter table public.profiles
  add column if not exists sub_interests text[];

alter table public.profiles
  add column if not exists intents text[];

create index if not exists idx_profiles_intents on public.profiles using gin(intents);

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
