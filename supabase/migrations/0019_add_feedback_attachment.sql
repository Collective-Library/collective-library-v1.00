-- Add attachments column to feedback table
-- Using text to store multiple URLs as a simple string (e.g. comma or newline separated)
alter table public.feedback 
add column if not exists attachments text;

comment on column public.feedback.attachments is 'User-provided links to screenshots or recordings, stored as a string.';
