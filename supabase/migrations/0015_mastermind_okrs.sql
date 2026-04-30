-- =============================================================================
-- Migration 0015 — Mastermind: OKR Control Tower (Objectives + Key Results)
--
-- Strategic brain of the founder cockpit. Two append-style tables tracked by
-- quarter. Seeded with Q2 2026 OKRs verbatim from the masterprompt.
--
-- Auto-compute hookup: any KR with `auto_compute_key` non-null gets its
-- `current_value` resolved at query time from live app data via the
-- registry in lib/mastermind/kr-compute.ts. Manual KRs (no auto-compute key)
-- get their value edited inline at /mastermind/okrs.
--
-- RLS: admin-only across the board. Non-admins do not see OKRs.
-- =============================================================================

-- =============================================================================
-- Tables
-- =============================================================================

create table if not exists public.okr_objectives (
  id uuid primary key default gen_random_uuid(),
  -- Stable code (e.g. "Q2-2026-O1") so app code can reference an objective
  -- without UUID coupling
  code text unique not null,
  title text not null,
  detail text,
  category text not null check (category in ('people','data','system','integration','foundation','activation')),
  quarter text not null, -- e.g. "Q2-2026"
  status text not null default 'on_track' check (status in ('on_track','at_risk','behind','done')),
  progress_pct numeric(5,2) not null default 0 check (progress_pct between 0 and 100),
  owner_id uuid references public.profiles(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_okr_objectives_quarter on public.okr_objectives(quarter, sort_order);
create index if not exists idx_okr_objectives_owner on public.okr_objectives(owner_id);

create table if not exists public.okr_key_results (
  id uuid primary key default gen_random_uuid(),
  objective_id uuid not null references public.okr_objectives(id) on delete cascade,
  -- Stable code so app code can target a KR (e.g. "Q2-2026-O1-KR1")
  code text unique not null,
  title text not null,
  detail text,
  target_value numeric(12,2) not null,
  target_unit text not null default 'count', -- 'count' | 'percent' | 'people' | 'event' | 'transaksi'
  current_value numeric(12,2) not null default 0,
  -- When non-null, current_value is resolved live from the registry in
  -- lib/mastermind/kr-compute.ts. When null, current_value is editable
  -- via the admin form.
  auto_compute_key text,
  status text not null default 'on_track' check (status in ('on_track','at_risk','behind','done')),
  owner_id uuid references public.profiles(id) on delete set null,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_okr_key_results_objective on public.okr_key_results(objective_id, sort_order);
create index if not exists idx_okr_key_results_auto on public.okr_key_results(auto_compute_key) where auto_compute_key is not null;

-- updated_at auto-bump
drop trigger if exists trg_okr_objectives_updated on public.okr_objectives;
create trigger trg_okr_objectives_updated
  before update on public.okr_objectives
  for each row execute function public.set_updated_at();

drop trigger if exists trg_okr_key_results_updated on public.okr_key_results;
create trigger trg_okr_key_results_updated
  before update on public.okr_key_results
  for each row execute function public.set_updated_at();

-- =============================================================================
-- RLS — admin-only on everything (matches feedback table 0014 pattern)
-- =============================================================================
alter table public.okr_objectives enable row level security;
alter table public.okr_key_results enable row level security;

drop policy if exists "okr_objectives_admin_all" on public.okr_objectives;
create policy "okr_objectives_admin_all" on public.okr_objectives
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

drop policy if exists "okr_key_results_admin_all" on public.okr_key_results;
create policy "okr_key_results_admin_all" on public.okr_key_results
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
-- Seed: Q2 2026 OKRs (verbatim from masterprompt)
-- Idempotent via ON CONFLICT (code) — re-running this migration is safe.
-- =============================================================================

-- Objective 1 — Build active & committed community
insert into public.okr_objectives (code, title, detail, category, quarter, sort_order)
values
  ('Q2-2026-O1', 'Build active & committed community',
   'Membentuk komunitas yang aktif, sadar misi, dan mau berkontribusi nyata.',
   'people', 'Q2-2026', 1)
on conflict (code) do update set
  title = excluded.title,
  detail = excluded.detail,
  category = excluded.category,
  quarter = excluded.quarter,
  sort_order = excluded.sort_order;

insert into public.okr_key_results (code, objective_id, title, target_value, target_unit, auto_compute_key, sort_order)
select 'Q2-2026-O1-KR1', id, '100 anggota terdaftar dengan profile basic', 100, 'people', 'members_with_complete_profile', 1
from public.okr_objectives where code = 'Q2-2026-O1'
on conflict (code) do update set title = excluded.title, target_value = excluded.target_value, target_unit = excluded.target_unit, auto_compute_key = excluded.auto_compute_key, sort_order = excluded.sort_order;

insert into public.okr_key_results (code, objective_id, title, target_value, target_unit, auto_compute_key, sort_order)
select 'Q2-2026-O1-KR2', id, '60% anggota ikut minimal 1 activity', 60, 'percent', null, 2
from public.okr_objectives where code = 'Q2-2026-O1'
on conflict (code) do update set title = excluded.title, target_value = excluded.target_value, target_unit = excluded.target_unit, auto_compute_key = excluded.auto_compute_key, sort_order = excluded.sort_order;

insert into public.okr_key_results (code, objective_id, title, target_value, target_unit, auto_compute_key, sort_order)
select 'Q2-2026-O1-KR3', id, 'Minimum 4 event berjalan', 4, 'event', null, 3
from public.okr_objectives where code = 'Q2-2026-O1'
on conflict (code) do update set title = excluded.title, target_value = excluded.target_value, target_unit = excluded.target_unit, auto_compute_key = excluded.auto_compute_key, sort_order = excluded.sort_order;

insert into public.okr_key_results (code, objective_id, title, target_value, target_unit, auto_compute_key, sort_order)
select 'Q2-2026-O1-KR4', id, '20 orang jadi core contributor', 20, 'people', null, 4
from public.okr_objectives where code = 'Q2-2026-O1'
on conflict (code) do update set title = excluded.title, target_value = excluded.target_value, target_unit = excluded.target_unit, auto_compute_key = excluded.auto_compute_key, sort_order = excluded.sort_order;

insert into public.okr_key_results (code, objective_id, title, target_value, target_unit, auto_compute_key, sort_order)
select 'Q2-2026-O1-KR5', id, 'Engagement aktif mingguan ≥ 30 orang', 30, 'people', 'weekly_active_members', 5
from public.okr_objectives where code = 'Q2-2026-O1'
on conflict (code) do update set title = excluded.title, target_value = excluded.target_value, target_unit = excluded.target_unit, auto_compute_key = excluded.auto_compute_key, sort_order = excluded.sort_order;

-- Objective 2 — Build structured & trusted data
insert into public.okr_objectives (code, title, detail, category, quarter, sort_order)
values
  ('Q2-2026-O2', 'Build structured & trusted data',
   'Sistem data komunitas yang lengkap, terpercaya, dan bisa dipakai semua orang.',
   'data', 'Q2-2026', 2)
on conflict (code) do update set
  title = excluded.title,
  detail = excluded.detail,
  category = excluded.category,
  quarter = excluded.quarter,
  sort_order = excluded.sort_order;

insert into public.okr_key_results (code, objective_id, title, target_value, target_unit, auto_compute_key, sort_order)
select 'Q2-2026-O2-KR1', id, '300+ buku terdata dalam sistem', 300, 'count', 'books_total', 1
from public.okr_objectives where code = 'Q2-2026-O2'
on conflict (code) do update set title = excluded.title, target_value = excluded.target_value, target_unit = excluded.target_unit, auto_compute_key = excluded.auto_compute_key, sort_order = excluded.sort_order;

insert into public.okr_key_results (code, objective_id, title, target_value, target_unit, auto_compute_key, sort_order)
select 'Q2-2026-O2-KR2', id, '100% buku punya owner jelas', 100, 'percent', 'books_with_owner_pct', 2
from public.okr_objectives where code = 'Q2-2026-O2'
on conflict (code) do update set title = excluded.title, target_value = excluded.target_value, target_unit = excluded.target_unit, auto_compute_key = excluded.auto_compute_key, sort_order = excluded.sort_order;

insert into public.okr_key_results (code, objective_id, title, target_value, target_unit, auto_compute_key, sort_order)
select 'Q2-2026-O2-KR3', id, '80% member punya minimal 1 book entry', 80, 'percent', 'members_with_at_least_one_book_pct', 3
from public.okr_objectives where code = 'Q2-2026-O2'
on conflict (code) do update set title = excluded.title, target_value = excluded.target_value, target_unit = excluded.target_unit, auto_compute_key = excluded.auto_compute_key, sort_order = excluded.sort_order;

insert into public.okr_key_results (code, objective_id, title, target_value, target_unit, auto_compute_key, sort_order)
select 'Q2-2026-O2-KR4', id, 'Sistem tracking peminjaman berjalan', 1, 'count', null, 4
from public.okr_objectives where code = 'Q2-2026-O2'
on conflict (code) do update set title = excluded.title, target_value = excluded.target_value, target_unit = excluded.target_unit, auto_compute_key = excluded.auto_compute_key, sort_order = excluded.sort_order;

insert into public.okr_key_results (code, objective_id, title, target_value, target_unit, auto_compute_key, sort_order)
select 'Q2-2026-O2-KR5', id, 'Tidak ada konflik trust besar tanpa solusi', 0, 'count', null, 5
from public.okr_objectives where code = 'Q2-2026-O2'
on conflict (code) do update set title = excluded.title, target_value = excluded.target_value, target_unit = excluded.target_unit, auto_compute_key = excluded.auto_compute_key, sort_order = excluded.sort_order;

-- Objective 3 — Build MVP system
insert into public.okr_objectives (code, title, detail, category, quarter, sort_order)
values
  ('Q2-2026-O3', 'Build MVP system',
   'Web app jadi titik pusat: katalog, peminjaman, dan flow user yang jelas. Diadaptasi dari KR Notion ke web app yang sekarang sudah live.',
   'system', 'Q2-2026', 3)
on conflict (code) do update set
  title = excluded.title,
  detail = excluded.detail,
  category = excluded.category,
  quarter = excluded.quarter,
  sort_order = excluded.sort_order;

insert into public.okr_key_results (code, objective_id, title, target_value, target_unit, auto_compute_key, sort_order)
select 'Q2-2026-O3-KR1', id, 'Web app katalog live & dipakai (replacement: Katalog Notion live)', 1, 'count', 'app_live', 1
from public.okr_objectives where code = 'Q2-2026-O3'
on conflict (code) do update set title = excluded.title, target_value = excluded.target_value, target_unit = excluded.target_unit, auto_compute_key = excluded.auto_compute_key, sort_order = excluded.sort_order;

insert into public.okr_key_results (code, objective_id, title, target_value, target_unit, auto_compute_key, sort_order)
select 'Q2-2026-O3-KR2', id, 'Minimal 10 transaksi peminjaman berhasil', 10, 'transaksi', null, 2
from public.okr_objectives where code = 'Q2-2026-O3'
on conflict (code) do update set title = excluded.title, target_value = excluded.target_value, target_unit = excluded.target_unit, auto_compute_key = excluded.auto_compute_key, sort_order = excluded.sort_order;

insert into public.okr_key_results (code, objective_id, title, target_value, target_unit, auto_compute_key, sort_order)
select 'Q2-2026-O3-KR3', id, 'SOP peminjaman & pengembalian ada', 1, 'count', null, 3
from public.okr_objectives where code = 'Q2-2026-O3'
on conflict (code) do update set title = excluded.title, target_value = excluded.target_value, target_unit = excluded.target_unit, auto_compute_key = excluded.auto_compute_key, sort_order = excluded.sort_order;

insert into public.okr_key_results (code, objective_id, title, target_value, target_unit, auto_compute_key, sort_order)
select 'Q2-2026-O3-KR4', id, 'Flow join → lihat katalog → pinjam → return jelas', 1, 'count', null, 4
from public.okr_objectives where code = 'Q2-2026-O3'
on conflict (code) do update set title = excluded.title, target_value = excluded.target_value, target_unit = excluded.target_unit, auto_compute_key = excluded.auto_compute_key, sort_order = excluded.sort_order;

insert into public.okr_key_results (code, objective_id, title, target_value, target_unit, auto_compute_key, sort_order)
select 'Q2-2026-O3-KR5', id, '80% user ngerti cara pakai sistem', 80, 'percent', null, 5
from public.okr_objectives where code = 'Q2-2026-O3'
on conflict (code) do update set title = excluded.title, target_value = excluded.target_value, target_unit = excluded.target_unit, auto_compute_key = excluded.auto_compute_key, sort_order = excluded.sort_order;

-- Objective 4 — Connect community & knowledge
insert into public.okr_objectives (code, title, detail, category, quarter, sort_order)
values
  ('Q2-2026-O4', 'Connect community & knowledge',
   'Hubungkan member dengan ide, ide dengan buku, buku dengan event. Knowledge circulation, bukan cuma book lending.',
   'integration', 'Q2-2026', 4)
on conflict (code) do update set
  title = excluded.title,
  detail = excluded.detail,
  category = excluded.category,
  quarter = excluded.quarter,
  sort_order = excluded.sort_order;

insert into public.okr_key_results (code, objective_id, title, target_value, target_unit, auto_compute_key, sort_order)
select 'Q2-2026-O4-KR1', id, 'Setiap event ada output knowledge', 100, 'percent', null, 1
from public.okr_objectives where code = 'Q2-2026-O4'
on conflict (code) do update set title = excluded.title, target_value = excluded.target_value, target_unit = excluded.target_unit, auto_compute_key = excluded.auto_compute_key, sort_order = excluded.sort_order;

insert into public.okr_key_results (code, objective_id, title, target_value, target_unit, auto_compute_key, sort_order)
select 'Q2-2026-O4-KR2', id, '30% aktivitas terhubung dengan buku', 30, 'percent', 'activity_book_linked_pct', 2
from public.okr_objectives where code = 'Q2-2026-O4'
on conflict (code) do update set title = excluded.title, target_value = excluded.target_value, target_unit = excluded.target_unit, auto_compute_key = excluded.auto_compute_key, sort_order = excluded.sort_order;

insert into public.okr_key_results (code, objective_id, title, target_value, target_unit, auto_compute_key, sort_order)
select 'Q2-2026-O4-KR3', id, 'Minimal 10 koneksi dari buku', 10, 'count', null, 3
from public.okr_objectives where code = 'Q2-2026-O4'
on conflict (code) do update set title = excluded.title, target_value = excluded.target_value, target_unit = excluded.target_unit, auto_compute_key = excluded.auto_compute_key, sort_order = excluded.sort_order;

insert into public.okr_key_results (code, objective_id, title, target_value, target_unit, auto_compute_key, sort_order)
select 'Q2-2026-O4-KR4', id, 'Format event → insight → masuk ke sistem', 1, 'count', null, 4
from public.okr_objectives where code = 'Q2-2026-O4'
on conflict (code) do update set title = excluded.title, target_value = excluded.target_value, target_unit = excluded.target_unit, auto_compute_key = excluded.auto_compute_key, sort_order = excluded.sort_order;

-- Objective 5 — Internal system + activation
insert into public.okr_objectives (code, title, detail, category, quarter, sort_order)
values
  ('Q2-2026-O5', 'Internal system + activation',
   'Internal team rapi & aktif; existing member di-activate dari Notion ke sistem.',
   'foundation', 'Q2-2026', 5)
on conflict (code) do update set
  title = excluded.title,
  detail = excluded.detail,
  category = excluded.category,
  quarter = excluded.quarter,
  sort_order = excluded.sort_order;

insert into public.okr_key_results (code, objective_id, title, target_value, target_unit, auto_compute_key, sort_order)
select 'Q2-2026-O5-KR1', id, 'Semua task punya owner jelas', 100, 'percent', 'task_owned_pct', 1
from public.okr_objectives where code = 'Q2-2026-O5'
on conflict (code) do update set title = excluded.title, target_value = excluded.target_value, target_unit = excluded.target_unit, auto_compute_key = excluded.auto_compute_key, sort_order = excluded.sort_order;

insert into public.okr_key_results (code, objective_id, title, target_value, target_unit, auto_compute_key, sort_order)
select 'Q2-2026-O5-KR2', id, 'Weekly sync berjalan minimum 8x', 8, 'count', null, 2
from public.okr_objectives where code = 'Q2-2026-O5'
on conflict (code) do update set title = excluded.title, target_value = excluded.target_value, target_unit = excluded.target_unit, auto_compute_key = excluded.auto_compute_key, sort_order = excluded.sort_order;

insert into public.okr_key_results (code, objective_id, title, target_value, target_unit, auto_compute_key, sort_order)
select 'Q2-2026-O5-KR3', id, 'Notion workspace rapi & aktif dipakai', 1, 'count', null, 3
from public.okr_objectives where code = 'Q2-2026-O5'
on conflict (code) do update set title = excluded.title, target_value = excluded.target_value, target_unit = excluded.target_unit, auto_compute_key = excluded.auto_compute_key, sort_order = excluded.sort_order;

insert into public.okr_key_results (code, objective_id, title, target_value, target_unit, auto_compute_key, sort_order)
select 'Q2-2026-O5-KR4', id, 'PMO update progress mingguan', 100, 'percent', null, 4
from public.okr_objectives where code = 'Q2-2026-O5'
on conflict (code) do update set title = excluded.title, target_value = excluded.target_value, target_unit = excluded.target_unit, auto_compute_key = excluded.auto_compute_key, sort_order = excluded.sort_order;

insert into public.okr_key_results (code, objective_id, title, target_value, target_unit, auto_compute_key, sort_order)
select 'Q2-2026-O5-KR5', id, '100% core team aktif', 100, 'percent', null, 5
from public.okr_objectives where code = 'Q2-2026-O5'
on conflict (code) do update set title = excluded.title, target_value = excluded.target_value, target_unit = excluded.target_unit, auto_compute_key = excluded.auto_compute_key, sort_order = excluded.sort_order;

insert into public.okr_key_results (code, objective_id, title, target_value, target_unit, auto_compute_key, sort_order)
select 'Q2-2026-O5-KR6', id, '70% dari 30 member existing masuk sistem', 70, 'percent', null, 6
from public.okr_objectives where code = 'Q2-2026-O5'
on conflict (code) do update set title = excluded.title, target_value = excluded.target_value, target_unit = excluded.target_unit, auto_compute_key = excluded.auto_compute_key, sort_order = excluded.sort_order;

insert into public.okr_key_results (code, objective_id, title, target_value, target_unit, auto_compute_key, sort_order)
select 'Q2-2026-O5-KR7', id, '20 member existing aktif interaksi', 20, 'people', null, 7
from public.okr_objectives where code = 'Q2-2026-O5'
on conflict (code) do update set title = excluded.title, target_value = excluded.target_value, target_unit = excluded.target_unit, auto_compute_key = excluded.auto_compute_key, sort_order = excluded.sort_order;

insert into public.okr_key_results (code, objective_id, title, target_value, target_unit, auto_compute_key, sort_order)
select 'Q2-2026-O5-KR8', id, '10 member melakukan aksi nyata', 10, 'people', null, 8
from public.okr_objectives where code = 'Q2-2026-O5'
on conflict (code) do update set title = excluded.title, target_value = excluded.target_value, target_unit = excluded.target_unit, auto_compute_key = excluded.auto_compute_key, sort_order = excluded.sort_order;

comment on table public.okr_objectives is
  'Mastermind: quarterly Objectives. Admin-only RLS. Seed: Q2 2026 from masterprompt.';
comment on table public.okr_key_results is
  'Mastermind: Key Results per Objective. auto_compute_key resolves current_value live from app data via lib/mastermind/kr-compute.ts.';
