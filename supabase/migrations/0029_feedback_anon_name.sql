alter table public.feedback
add column if not exists name text;

comment on column public.feedback.name is
  'Display name provided by anonymous feedback submitter for follow-up.';
