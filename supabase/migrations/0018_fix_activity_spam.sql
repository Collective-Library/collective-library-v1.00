-- 1. Cleanup: Remove ghost activity logs (BOOK_ADDED where book_id is NULL)
-- This fixes the current spam from user indraga and others who deleted books.
delete from public.activity_log
where type = 'BOOK_ADDED' and book_id is null;

-- 2. Database Fix: Change activity_log.book_id to ON DELETE CASCADE
-- So that when a book is deleted, the corresponding activity log is also removed.
alter table public.activity_log
drop constraint if exists activity_log_book_id_fkey,
add constraint activity_log_book_id_fkey
  foreign key (book_id)
  references public.books(id)
  on delete cascade;

-- 3. Also change wanted_id to ON DELETE CASCADE for consistency
alter table public.activity_log
drop constraint if exists activity_log_wanted_id_fkey,
add constraint activity_log_wanted_id_fkey
  foreign key (wanted_id)
  references public.wanted_requests(id)
  on delete cascade;
