-- =============================================================================
-- Migration 0013 — cover_url on wanted_requests
--
-- Lets WTB cards show a thumbnail of the book they're hunting for. Cover URL
-- is auto-fetched from Open Library at submit time using title + author. If
-- the lookup fails, the column stays null and the card falls back to a typed
-- placeholder (same as books without covers).
-- =============================================================================

alter table public.wanted_requests
  add column if not exists cover_url text;

comment on column public.wanted_requests.cover_url is
  'Auto-fetched from Open Library at submit-time using title + author.';
