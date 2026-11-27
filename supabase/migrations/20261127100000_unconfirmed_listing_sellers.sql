-- Sellers of live listings who haven't confirmed an email address yet
-- (typically a /list seller who never clicked the confirmation link). Their
-- listing page locks "Enquire Now", since enquiries are emailed to the seller.
--
-- Security definer so the public site can ask without reading auth.users; it
-- only reveals seller ids that are already public on active listings.

create or replace function public.unconfirmed_listing_sellers()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select distinct l.seller_id
  from public.listings l
  join auth.users u on u.id = l.seller_id
  where l.status = 'active'
    and u.email_confirmed_at is null;
$$;

revoke all on function public.unconfirmed_listing_sellers() from public;
grant execute on function public.unconfirmed_listing_sellers() to anon, authenticated;
