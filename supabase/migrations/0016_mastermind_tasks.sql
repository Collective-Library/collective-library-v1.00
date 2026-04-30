-- =============================================================================
-- Migration 0016 — Mastermind: Team & Task Tracker
--
-- Internal execution layer. Each task can link to an OKR Objective and/or
-- a specific Key Result, giving the founder a "task → KR → Objective"
-- traceability so weekly progress on KRs is grounded in real work.
--
-- Seeded with the 14 Ownership Tasks from the masterprompt as starting
-- backlog. Owner assignments left null — admin assigns via inline edit.
--
-- RLS: admin-only across the board (same pattern as 0014/0015).
-- =============================================================================

create table if not exists public.team_tasks (
  id uuid primary key default gen_random_uuid(),
  -- Stable code (e.g. "Q2-T01") so app code can reference a task without
  -- UUID coupling. Optional — only seeded tasks get codes.
  code text unique,
  title text not null,
  detail text,
  related_objective_id uuid references public.okr_objectives(id) on delete set null,
  related_kr_id uuid references public.okr_key_results(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  priority text not null default 'med' check (priority in ('low','med','high','urgent')),
  status text not null default 'todo' check (status in ('todo','in_progress','blocked','done','canceled')),
  progress_pct numeric(5,2) not null default 0 check (progress_pct between 0 and 100),
  start_date date,
  end_date date,
  milestone text,
  deliverable text,
  output_link text,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_team_tasks_status on public.team_tasks(status, end_date);
create index if not exists idx_team_tasks_owner on public.team_tasks(owner_id, status);
create index if not exists idx_team_tasks_objective on public.team_tasks(related_objective_id);
create index if not exists idx_team_tasks_kr on public.team_tasks(related_kr_id);

drop trigger if exists trg_team_tasks_updated on public.team_tasks;
create trigger trg_team_tasks_updated
  before update on public.team_tasks
  for each row execute function public.set_updated_at();

-- =============================================================================
-- RLS — admin-only
-- =============================================================================
alter table public.team_tasks enable row level security;

drop policy if exists "team_tasks_admin_all" on public.team_tasks;
create policy "team_tasks_admin_all" on public.team_tasks
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  ) with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

-- =============================================================================
-- Seed: 14 Ownership Tasks from masterprompt
-- Idempotent via ON CONFLICT (code).
-- Initial status assignments reflect what the masterprompt + STATE.md show
-- as already-done vs still-open.
-- =============================================================================

insert into public.team_tasks (code, title, status, priority, related_objective_id, related_kr_id)
select 'Q2-T01', 'Membuat OKRs Q2 2026', 'done', 'high',
       (select id from public.okr_objectives where code = 'Q2-2026-O5'),
       null
on conflict (code) do update set title = excluded.title, status = excluded.status, priority = excluded.priority, related_objective_id = excluded.related_objective_id;

insert into public.team_tasks (code, title, status, priority, related_objective_id, related_kr_id)
select 'Q2-T02', 'Membuat MoM (Minutes of Meeting) per weekly sync', 'todo', 'med',
       (select id from public.okr_objectives where code = 'Q2-2026-O5'),
       (select id from public.okr_key_results where code = 'Q2-2026-O5-KR2')
on conflict (code) do update set title = excluded.title, status = excluded.status, priority = excluded.priority, related_objective_id = excluded.related_objective_id, related_kr_id = excluded.related_kr_id;

insert into public.team_tasks (code, title, status, priority, related_objective_id, related_kr_id)
select 'Q2-T03', 'Mapping Skill core team', 'todo', 'med',
       (select id from public.okr_objectives where code = 'Q2-2026-O5'),
       (select id from public.okr_key_results where code = 'Q2-2026-O5-KR5')
on conflict (code) do update set title = excluded.title, status = excluded.status, priority = excluded.priority, related_objective_id = excluded.related_objective_id, related_kr_id = excluded.related_kr_id;

insert into public.team_tasks (code, title, status, priority, related_objective_id, related_kr_id)
select 'Q2-T04', 'Maintenance Instagram (@collectivelibrary.id)', 'in_progress', 'high',
       (select id from public.okr_objectives where code = 'Q2-2026-O1'),
       null
on conflict (code) do update set title = excluded.title, status = excluded.status, priority = excluded.priority, related_objective_id = excluded.related_objective_id;

insert into public.team_tasks (code, title, status, priority, related_objective_id, related_kr_id)
select 'Q2-T05', 'Membuat SOP sistem peminjaman & pengembalian', 'todo', 'urgent',
       (select id from public.okr_objectives where code = 'Q2-2026-O3'),
       (select id from public.okr_key_results where code = 'Q2-2026-O3-KR3')
on conflict (code) do update set title = excluded.title, status = excluded.status, priority = excluded.priority, related_objective_id = excluded.related_objective_id, related_kr_id = excluded.related_kr_id;

insert into public.team_tasks (code, title, status, priority, related_objective_id, related_kr_id)
select 'Q2-T06', 'Identifikasi potensi masalah sistem & solusi', 'in_progress', 'med',
       (select id from public.okr_objectives where code = 'Q2-2026-O3'),
       null
on conflict (code) do update set title = excluded.title, status = excluded.status, priority = excluded.priority, related_objective_id = excluded.related_objective_id;

insert into public.team_tasks (code, title, status, priority, related_objective_id, related_kr_id)
select 'Q2-T07', 'Implementasi database member & catalog', 'done', 'high',
       (select id from public.okr_objectives where code = 'Q2-2026-O2'),
       (select id from public.okr_key_results where code = 'Q2-2026-O2-KR1')
on conflict (code) do update set title = excluded.title, status = excluded.status, priority = excluded.priority, related_objective_id = excluded.related_objective_id, related_kr_id = excluded.related_kr_id;

insert into public.team_tasks (code, title, status, priority, related_objective_id, related_kr_id)
select 'Q2-T08', 'Merancang struktur data / ERD', 'done', 'high',
       (select id from public.okr_objectives where code = 'Q2-2026-O2'),
       null
on conflict (code) do update set title = excluded.title, status = excluded.status, priority = excluded.priority, related_objective_id = excluded.related_objective_id;

insert into public.team_tasks (code, title, status, priority, related_objective_id, related_kr_id)
select 'Q2-T09', 'Identifikasi core fitur MVP', 'done', 'high',
       (select id from public.okr_objectives where code = 'Q2-2026-O3'),
       (select id from public.okr_key_results where code = 'Q2-2026-O3-KR1')
on conflict (code) do update set title = excluded.title, status = excluded.status, priority = excluded.priority, related_objective_id = excluded.related_objective_id, related_kr_id = excluded.related_kr_id;

insert into public.team_tasks (code, title, status, priority, related_objective_id, related_kr_id)
select 'Q2-T10', 'Copywriting & content (landing, about, onboarding)', 'in_progress', 'med',
       (select id from public.okr_objectives where code = 'Q2-2026-O1'),
       null
on conflict (code) do update set title = excluded.title, status = excluded.status, priority = excluded.priority, related_objective_id = excluded.related_objective_id;

insert into public.team_tasks (code, title, status, priority, related_objective_id, related_kr_id)
select 'Q2-T11', 'Linktree / linktr.ee/collectivelibrary.id', 'done', 'low',
       (select id from public.okr_objectives where code = 'Q2-2026-O1'),
       null
on conflict (code) do update set title = excluded.title, status = excluded.status, priority = excluded.priority, related_objective_id = excluded.related_objective_id;

insert into public.team_tasks (code, title, status, priority, related_objective_id, related_kr_id)
select 'Q2-T12', 'Instagram feed design system', 'in_progress', 'med',
       (select id from public.okr_objectives where code = 'Q2-2026-O1'),
       null
on conflict (code) do update set title = excluded.title, status = excluded.status, priority = excluded.priority, related_objective_id = excluded.related_objective_id;

insert into public.team_tasks (code, title, status, priority, related_objective_id, related_kr_id)
select 'Q2-T13', 'Developing flow core mekanisme system', 'in_progress', 'high',
       (select id from public.okr_objectives where code = 'Q2-2026-O3'),
       (select id from public.okr_key_results where code = 'Q2-2026-O3-KR4')
on conflict (code) do update set title = excluded.title, status = excluded.status, priority = excluded.priority, related_objective_id = excluded.related_objective_id, related_kr_id = excluded.related_kr_id;

insert into public.team_tasks (code, title, status, priority, related_objective_id, related_kr_id)
select 'Q2-T14', 'Rancangan isi form pinjam & kembali', 'todo', 'high',
       (select id from public.okr_objectives where code = 'Q2-2026-O3'),
       (select id from public.okr_key_results where code = 'Q2-2026-O3-KR2')
on conflict (code) do update set title = excluded.title, status = excluded.status, priority = excluded.priority, related_objective_id = excluded.related_objective_id, related_kr_id = excluded.related_kr_id;

comment on table public.team_tasks is
  'Mastermind: internal team tasks. Linkable to OKR Objective + KR for traceability.';
