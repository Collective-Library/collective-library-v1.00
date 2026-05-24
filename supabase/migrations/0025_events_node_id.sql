-- =============================================================================
-- Migration 0025 — events.node_id (Spots ↔ Events link, Phase 1.5 slice 3)
--
-- Adds optional FK from events to library_nodes so hosts can attach a Spot
-- (cafe / public shelf / community space) to their event. Coexists with
-- existing free-text location_text / location_url / is_online — never
-- replaces them. Existing events untouched (column is nullable).
--
-- Public event detail page (app/(app)/event/[id]/page.tsx) is NOT modified
-- in this slice — only the create/edit forms gain the picker. Public
-- rendering of attached Spots ships in a later slice.
--
-- Idempotent: safe to re-run.
-- =============================================================================

alter table public.events
  add column if not exists node_id uuid
    references public.library_nodes(id) on delete set null;

create index if not exists idx_events_node on public.events(node_id);

comment on column public.events.node_id is
  'Optional FK to a Library Node (Spot). Coexists with location_text/location_url — does not replace them. Public surfaces continue to render free-text location until a future slice adds the Spot section.';

-- =============================================================================
-- ROLLBACK (manual; commented):
--   drop index if exists public.idx_events_node;
--   alter table public.events drop column if exists node_id;
-- =============================================================================
