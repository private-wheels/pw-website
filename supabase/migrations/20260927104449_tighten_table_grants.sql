-- This project still has Supabase's legacy default privileges, which give
-- anon/authenticated ALL privileges on every new table in `public`. That made
-- the column-scoped grants in the first migration ineffective (a seller could
-- set `featured` or `original_price` on their own listing). Reset to exactly
-- the intended privileges. RLS policies are unchanged.

revoke all on public.listings from anon, authenticated;
revoke all on public.profiles from anon, authenticated;

grant select on public.listings to anon, authenticated;
grant insert (
  seller_name, seller_phone, make, model, variant, year, price, mileage,
  transmission, fuel_type, body_type, province, town, condition,
  previous_owners, service_history, accident_history, colour, features,
  description, images, status
) on public.listings to authenticated;
grant update (
  seller_name, seller_phone, make, model, variant, year, price, mileage,
  transmission, fuel_type, body_type, province, town, condition,
  previous_owners, service_history, accident_history, colour, features,
  description, images, status
) on public.listings to authenticated;
grant delete on public.listings to authenticated;

grant select on public.profiles to authenticated;
grant update (display_name, phone) on public.profiles to authenticated;

-- Stop future tables in `public` from being exposed automatically; grant
-- access per table instead.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, public;
