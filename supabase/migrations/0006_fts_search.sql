-- =============================================================================
-- Migration 0006 — Full-text search on books
--
-- Adds a generated tsvector column on books + a GIN index. Replaces the
-- ilike-based search in lib/books.ts:searchBooks for better ranking and
-- performance once the catalog grows past a few hundred entries.
--
-- The library/app code can keep using ilike until traffic demands an upgrade;
-- this migration is forward-compatible. Switch the query later via:
--   .textSearch('search_text', 'sapiens harari', { type: 'websearch' })
-- =============================================================================

-- 1. Generated tsvector column — combines title (weight A) + author (weight B)
alter table public.books
  add column if not exists search_text tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(author, '')), 'B')
  ) stored;

-- 2. GIN index for fast match
create index if not exists idx_books_search_text on public.books using gin (search_text);

comment on column public.books.search_text is
  'Generated tsvector — title (A) + author (B). Search via websearch_to_tsquery.';
