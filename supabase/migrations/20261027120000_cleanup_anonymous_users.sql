-- The pre-launch /list flow gives visitors a temporary (anonymous) account
-- so they can fill in a listing before signing up. Most will finish, some
-- won't. Once a day, delete temporary accounts older than 30 days that never
-- paid for a listing. Their unpaid listings go with them (listings.seller_id
-- cascades). A temporary account that paid but never confirmed its email is
-- kept: it owns a real listing.
--
-- Needs "Allow anonymous sign-ins" switched on in Supabase Auth settings.

create extension if not exists pg_cron with schema pg_catalog;

create function private.delete_stale_anonymous_users()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  deleted integer;
begin
  delete from auth.users u
  where u.is_anonymous
    and u.created_at < now() - interval '30 days'
    and not exists (
      select 1 from public.listings l
      where l.seller_id = u.id and l.paid_at is not null
    );
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;

revoke all on function private.delete_stale_anonymous_users() from public;

select cron.schedule(
  'delete-stale-anonymous-users',
  '30 2 * * *', -- 02:30 UTC daily
  $$select private.delete_stale_anonymous_users()$$
);
