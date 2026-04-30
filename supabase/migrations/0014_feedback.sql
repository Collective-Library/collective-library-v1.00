-- =============================================================================
-- Migration 0014 — user feedback / ticketing
--
-- Powers the floating "Cerita ke kita" chip across the app. Captures every
-- piece of user input — ideas, bugs, friction, appreciation, other — into a
-- single triage-able backlog. Discord webhook fans out for real-time signal;
-- this table is the source of truth for status tracking + admin triage.
--
-- Anon visitors can submit (encourages low-friction signal); we capture the
-- session user_id when authed so we can attribute follow-ups.
-- =============================================================================

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  category text not null check (category in ('idea', 'bug', 'friction', 'appreciation', 'other')),
  message text not null check (length(message) between 3 and 4000),
  email text,
  page_url text,
  user_agent text,
  status text not null default 'new' check (status in ('new', 'triaged', 'planned', 'shipped', 'wontfix')),
  internal_note text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_feedback_status on public.feedback(status, created_at desc);
create index if not exists idx_feedback_category on public.feedback(category, created_at desc);
create index if not exists idx_feedback_user on public.feedback(user_id, created_at desc);

-- updated_at auto-bump on UPDATE
drop trigger if exists trg_feedback_updated_at on public.feedback;
create trigger trg_feedback_updated_at
  before update on public.feedback
  for each row execute function public.set_updated_at();

-- =============================================================================
-- RLS — anyone can INSERT (anon + auth); only admins can SELECT / UPDATE
-- =============================================================================
alter table public.feedback enable row level security;

drop policy if exists "feedback_insert_any" on public.feedback;
create policy "feedback_insert_any" on public.feedback
  for insert
  with check (true);

drop policy if exists "feedback_select_admin" on public.feedback;
create policy "feedback_select_admin" on public.feedback
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

drop policy if exists "feedback_update_admin" on public.feedback;
create policy "feedback_update_admin" on public.feedback
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

-- =============================================================================
-- Bootstrap admin — set is_admin = true for the first user. Replace the
-- username before running OR run the comment block manually after applying
-- this migration. (Idempotent — safe to skip if already true.)
-- =============================================================================
-- update public.profiles set is_admin = true where username = 'YOUR-USERNAME';

comment on table public.feedback is
  'User feedback / ticketing backlog. Triage via /admin/feedback (admin-gated).';
