-- =============================================================================
-- Migration 0020 — allow non-admin users to SELECT their own feedback
-- =============================================================================

drop policy if exists "feedback_select_own" on public.feedback;
create policy "feedback_select_own" on public.feedback
  for select
  to authenticated
  using (auth.uid() = user_id);
