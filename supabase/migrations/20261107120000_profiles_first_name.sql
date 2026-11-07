-- First name, asked for on the register form, for personal touches: the
-- dashboard welcome and email greetings. Kept separate from display_name,
-- which the listing wizard overwrites with the seller name on each listing.
--
-- The register form sends it as sign-up metadata (`first_name`); the
-- new-user trigger copies it here. Accounts from before this (and temporary
-- /list accounts) have '' and fall back to display_name.

alter table public.profiles
  add column first_name text not null default '' check (char_length(first_name) <= 50);

grant update (first_name) on public.profiles to authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  first_name text := left(btrim(coalesce(new.raw_user_meta_data ->> 'first_name', '')), 50);
begin
  insert into public.profiles (id, display_name, first_name)
  values (
    new.id,
    coalesce(nullif(first_name, ''), split_part(coalesce(new.email, ''), '@', 1)),
    first_name
  );
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;
