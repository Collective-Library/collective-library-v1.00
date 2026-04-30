-- =============================================================================
-- Migration 0012 — fix OAuth avatar fetch on signup
--
-- The 0001 trigger only checked `raw_user_meta_data->>'avatar_url'`. Google
-- stores the picture URL under `picture`, not `avatar_url`, so Google sign-ups
-- ended up with a NULL `photo_url` and the FE rendered the "?" initials
-- placeholder. Discord uses `avatar_url`, GitHub uses `avatar_url`, but Google
-- uses `picture`. We coalesce both.
--
-- Also backfills existing profiles where photo_url is null but the OAuth
-- provider did stash an avatar URL on auth.users.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, photo_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Backfill: copy avatar from OAuth metadata to existing profiles that don't
-- have a custom-uploaded photo yet. We never overwrite a non-null photo_url
-- (user might have uploaded their own).
update public.profiles p
set photo_url = coalesce(
  u.raw_user_meta_data->>'avatar_url',
  u.raw_user_meta_data->>'picture'
)
from auth.users u
where p.id = u.id
  and p.photo_url is null
  and (
    u.raw_user_meta_data->>'avatar_url' is not null
    or u.raw_user_meta_data->>'picture' is not null
  );

-- Same for full_name where missing
update public.profiles p
set full_name = coalesce(
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'name'
)
from auth.users u
where p.id = u.id
  and p.full_name is null
  and (
    u.raw_user_meta_data->>'full_name' is not null
    or u.raw_user_meta_data->>'name' is not null
  );
