-- Which view each listing photo shows: front, back, side, inside, or other.
--
-- `photo_views` runs parallel to `images` (same order, same length), so every
-- existing place that reads `images` keeps working unchanged. Listings saved
-- before this have an empty `photo_views` and show no tags. The listing form
-- and the payment/resubmit actions make sure the four required views are
-- there before a listing goes for review.

alter table public.listings
  add column photo_views text[] not null default '{}',
  add constraint listings_photo_views_check check (
    photo_views <@ array['front', 'back', 'side', 'inside', 'other']::text[]
    and (cardinality(photo_views) = 0 or cardinality(photo_views) = cardinality(images))
  );

-- Sellers set it alongside `images` (column-scoped grants, see
-- 20260927104449_tighten_table_grants.sql).
grant insert (photo_views), update (photo_views) on public.listings to authenticated;
