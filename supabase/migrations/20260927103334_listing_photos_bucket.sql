-- Public bucket for listing photos. Anyone can view a photo by its public URL;
-- only the signed-in owner can upload, replace or delete files, and only
-- inside their own `<user id>/` folder.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-photos',
  'listing-photos',
  true,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy "Sellers can upload listing photos to their own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Needed for delete/upsert; public reads go through the public URL instead.
create policy "Sellers can read their own listing photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Sellers can replace their own listing photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Sellers can delete their own listing photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
