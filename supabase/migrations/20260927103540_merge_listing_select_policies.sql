-- One SELECT policy per role instead of two overlapping permissive ones
-- (Supabase performance advisor: multiple_permissive_policies).

drop policy "Anyone can read active listings" on public.listings;
drop policy "Sellers can read their own listings" on public.listings;

create policy "Visitors can read active listings"
  on public.listings for select
  to anon
  using (status = 'active');

create policy "Signed-in users can read active listings and their own"
  on public.listings for select
  to authenticated
  using (status = 'active' or (select auth.uid()) = seller_id);
