-- Which one-off emails a listing has had, so each goes out once.
--
--   reminder_sent_at       the "your draft / unpaid listing is waiting"
--                          reminder (daily job, once per listing)
--   launch_email_pending   approved before launch: owed a "we're live" email
--                          on launch day (sent from the admin dashboard)
--
-- Only the server (secret key) writes these; sellers have no grant on them.

alter table public.listings
  add column reminder_sent_at timestamptz,
  add column launch_email_pending boolean not null default false;

-- Listings already approved before launch are owed the launch-day email too.
update public.listings
set launch_email_pending = true
where approved_at is not null and status in ('active', 'paused');
