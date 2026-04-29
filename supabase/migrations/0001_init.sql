-- =============================================================================
-- Collective Library — initial schema
-- Run this entire file in the Supabase SQL editor (Dashboard → SQL Editor → New).
-- Idempotent: safe to re-run; uses CREATE ... IF NOT EXISTS / DROP ... IF EXISTS.
-- =============================================================================

-- Required extensions
create extension if not exists "pgcrypto";

-- =============================================================================
-- Tables
-- =============================================================================

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  username text unique,
  photo_url text,
  cover_url text,
  city text default 'Semarang',
  address_area text,
  bio text,
  -- Social & contact links
  instagram text,
  whatsapp text,
  whatsapp_public boolean default false not null,
  discord text,
  goodreads_url text,
  storygraph_url text,
  -- Community / preferences
  campus_or_workplace text,
  favorite_genres text[],
  open_for_discussion boolean default true not null,
  open_for_lending boolean default true not null,
  open_for_selling boolean default true not null,
  open_for_trade boolean default true not null,
  -- Admin
  is_admin boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Communities
create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  city text,
  cover_url text,
  created_at timestamptz default now() not null
);

-- Community membership
create table if not exists public.community_members (
  user_id uuid not null references public.profiles(id) on delete cascade,
  community_id uuid not null references public.communities(id) on delete cascade,
  role text default 'member' check (role in ('member', 'moderator', 'admin')),
  joined_at timestamptz default now() not null,
  primary key (user_id, community_id)
);

-- Books
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  isbn text,
  cover_url text,
  genre text,
  language text default 'Indonesia',
  publisher text,
  description text,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  community_id uuid references public.communities(id) on delete set null,
  status text not null default 'unavailable' check (status in ('sell','lend','trade','unavailable')),
  visibility text not null default 'public' check (visibility in ('public','community','trusted')),
  condition text not null default 'good' check (condition in ('new','like_new','good','used','heavily_used')),
  price integer,
  negotiable boolean default false not null,
  lending_duration_days integer,
  deposit_required boolean default false not null,
  deposit_amount integer,
  pickup_area text,
  contact_method text default 'whatsapp' check (contact_method in ('whatsapp','instagram','discord')),
  notes text,
  source text default 'manual' check (source in ('manual','goodreads_import')),
  is_featured boolean default false not null,
  is_hidden boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_books_owner on public.books(owner_id);
create index if not exists idx_books_status on public.books(status) where is_hidden = false;
create index if not exists idx_books_created on public.books(created_at desc);

-- Wanted requests (WTB)
create table if not exists public.wanted_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  author text,
  max_budget integer,
  desired_condition text,
  city text default 'Semarang',
  notes text,
  status text default 'open' check (status in ('open','fulfilled','closed')),
  created_at timestamptz default now() not null
);

create index if not exists idx_wanted_status on public.wanted_requests(status);
create index if not exists idx_wanted_created on public.wanted_requests(created_at desc);

-- Saved books (bookmarks)
create table if not exists public.saved_books (
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  created_at timestamptz default now() not null,
  primary key (user_id, book_id)
);

-- Reports
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  target_type text check (target_type in ('book','user','wanted')),
  target_id uuid,
  reason text,
  created_at timestamptz default now() not null
);

-- =============================================================================
-- updated_at trigger
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_books_updated_at on public.books;
create trigger trg_books_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Auto-create profile on signup
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, photo_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.books enable row level security;
alter table public.wanted_requests enable row level security;
alter table public.saved_books enable row level security;
alter table public.reports enable row level security;

-- Profiles: anyone can read; only owner can update; owner can insert (trigger uses security definer)
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Communities: anyone can read; only admins can write (via service-role)
drop policy if exists "communities_select_all" on public.communities;
create policy "communities_select_all" on public.communities
  for select using (true);

-- Community members: anyone can read; user can insert/delete their own membership
drop policy if exists "community_members_select_all" on public.community_members;
create policy "community_members_select_all" on public.community_members
  for select using (true);

drop policy if exists "community_members_insert_own" on public.community_members;
create policy "community_members_insert_own" on public.community_members
  for insert with check (auth.uid() = user_id);

drop policy if exists "community_members_delete_own" on public.community_members;
create policy "community_members_delete_own" on public.community_members
  for delete using (auth.uid() = user_id);

-- Books: anyone can read non-hidden public books; owner has full control
drop policy if exists "books_select_public" on public.books;
create policy "books_select_public" on public.books
  for select using (
    is_hidden = false and (
      visibility = 'public' or owner_id = auth.uid()
    )
  );

drop policy if exists "books_insert_own" on public.books;
create policy "books_insert_own" on public.books
  for insert with check (auth.uid() = owner_id);

drop policy if exists "books_update_own" on public.books;
create policy "books_update_own" on public.books
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "books_delete_own" on public.books;
create policy "books_delete_own" on public.books
  for delete using (auth.uid() = owner_id);

-- Wanted requests: anyone can read open ones; only requester can mutate
drop policy if exists "wanted_select_all" on public.wanted_requests;
create policy "wanted_select_all" on public.wanted_requests
  for select using (true);

drop policy if exists "wanted_insert_own" on public.wanted_requests;
create policy "wanted_insert_own" on public.wanted_requests
  for insert with check (auth.uid() = requester_id);

drop policy if exists "wanted_update_own" on public.wanted_requests;
create policy "wanted_update_own" on public.wanted_requests
  for update using (auth.uid() = requester_id) with check (auth.uid() = requester_id);

drop policy if exists "wanted_delete_own" on public.wanted_requests;
create policy "wanted_delete_own" on public.wanted_requests
  for delete using (auth.uid() = requester_id);

-- Saved books: only the user can read/mutate their own
drop policy if exists "saved_books_select_own" on public.saved_books;
create policy "saved_books_select_own" on public.saved_books
  for select using (auth.uid() = user_id);

drop policy if exists "saved_books_insert_own" on public.saved_books;
create policy "saved_books_insert_own" on public.saved_books
  for insert with check (auth.uid() = user_id);

drop policy if exists "saved_books_delete_own" on public.saved_books;
create policy "saved_books_delete_own" on public.saved_books
  for delete using (auth.uid() = user_id);

-- Reports: insert-only for authenticated users
drop policy if exists "reports_insert_authenticated" on public.reports;
create policy "reports_insert_authenticated" on public.reports
  for insert with check (auth.uid() is not null);

-- =============================================================================
-- Storage bucket for book covers
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('book-covers', 'book-covers', true)
on conflict (id) do update set public = true;

drop policy if exists "book_covers_public_read" on storage.objects;
create policy "book_covers_public_read" on storage.objects
  for select using (bucket_id = 'book-covers');

drop policy if exists "book_covers_owner_write" on storage.objects;
create policy "book_covers_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'book-covers' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "book_covers_owner_update" on storage.objects;
create policy "book_covers_owner_update" on storage.objects
  for update using (
    bucket_id = 'book-covers' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "book_covers_owner_delete" on storage.objects;
create policy "book_covers_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'book-covers' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================================================
-- Seed: Journey Perintis community
-- =============================================================================
insert into public.communities (name, slug, description, city)
values (
  'Journey Perintis',
  'journey-perintis',
  'Komunitas pembaca dan penjelajah ide di Semarang.',
  'Semarang'
)
on conflict (slug) do nothing;
