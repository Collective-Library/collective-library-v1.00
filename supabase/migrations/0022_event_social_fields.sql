-- =============================================================================
-- Migration 0022 — Event social activation fields + RSVP context
--
-- Builds on 0020 (events MVP). The MVP event was a "database page" — title,
-- date, location, RSVP list. This migration turns it into a social activation
-- object: themed copy, what-to-expect bullets, external registration support,
-- Instagram/community links, hashtags, plus optional RSVP context so attendee
-- cards become real social signals (what book they're bringing, what topic).
--
-- All columns are additive + nullable. Existing events continue to work.
-- =============================================================================

-- =============================================================================
-- 1. events — social / copywriting fields
-- =============================================================================
alter table public.events
  add column if not exists theme text check (theme is null or length(theme) <= 200),
  add column if not exists what_to_expect text[],
  add column if not exists hashtags text[],
  add column if not exists reminder_text text check (reminder_text is null or length(reminder_text) <= 1000),
  -- External registration (Google Form, Lu.ma, etc.) — Collective Library acts
  -- as visibility layer, not necessarily the registration source of truth.
  add column if not exists registration_url text,
  add column if not exists registration_label text,
  add column if not exists registration_deadline timestamptz,
  -- Social links for this event + the hosting community
  add column if not exists instagram_url text,
  add column if not exists community_name text,
  add column if not exists community_instagram_url text,
  add column if not exists community_logo_url text;

-- =============================================================================
-- 2. event_rsvps — optional context fields (RSVP becomes a social signal)
-- =============================================================================
alter table public.event_rsvps
  add column if not exists origin_city text check (origin_city is null or length(origin_city) <= 80),
  add column if not exists bringing_book text check (bringing_book is null or length(bringing_book) <= 200),
  add column if not exists conversation_topic text check (conversation_topic is null or length(conversation_topic) <= 200);

-- =============================================================================
-- 3. Comment
-- =============================================================================
comment on column public.events.what_to_expect is
  'Bulleted list of what attendees can expect (rendered as <ul> in event detail). Stored as text[] for easy iteration without JSON parsing overhead.';

comment on column public.events.registration_url is
  'External registration URL (Google Form, Lu.ma, Eventbrite, etc.). When present, UI shows a "Daftar via form penyelenggara" CTA alongside the in-app RSVP. RSVP at Collective Library remains the social visibility layer.';

comment on column public.event_rsvps.bringing_book is
  'Optional: title of book the attendee plans to bring. Surfaces on attendee card to make the event feel concrete ("oh, ada yang bawa Atomic Habits!"). Encourages but never blocks RSVP.';
