-- =============================================================================
-- Migration 0024 — fix feedback insert policy for anon submissions
-- =============================================================================

-- Ensure RLS is enabled (idempotent)
alter table public.feedback enable row level security;

-- Ensure anon + authenticated can insert rows (Data API exposure)
grant insert on public.feedback to anon, authenticated;

-- Recreate policy explicitly for anon/authenticated roles
drop policy if exists "feedback_insert_any" on public.feedback;
create policy "feedback_insert_any" on public.feedback
  for insert
  to anon, authenticated
  with check (true);
