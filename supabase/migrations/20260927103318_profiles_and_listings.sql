-- Profiles (one per auth user) and vehicle listings.
--
-- Every table gets explicit, column-scoped GRANTs plus RLS. (The project's
-- legacy default privileges overrode these grants at first — fixed in
-- *_tighten_table_grants.sql.)

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  phone text not null default '' check (char_length(phone) <= 30),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

grant select on public.profiles to authenticated;
grant update (display_name, phone) on public.profiles to authenticated;

-- Create a profile row whenever someone signs up. Lives in the unexposed
-- `private` schema so it can't be called through the Data API.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(coalesce(new.email, ''), '@', 1));
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- listings
-- ---------------------------------------------------------------------------

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  -- Null only for the demo listings seeded before launch.
  seller_id uuid default auth.uid() references auth.users (id) on delete cascade,
  seller_name text not null check (char_length(seller_name) between 1 and 80),
  seller_phone text not null default '' check (char_length(seller_phone) <= 30),
  make text not null check (char_length(make) between 1 and 60),
  model text not null check (char_length(model) between 1 and 80),
  variant text not null default '' check (char_length(variant) <= 120),
  year smallint not null check (year between 1900 and 2100),
  price integer not null check (price >= 0),
  -- Pre-drop asking price. Maintained by the trigger below, not by clients.
  original_price integer check (original_price > 0),
  mileage integer not null default 0 check (mileage >= 0),
  transmission text not null
    check (transmission in ('Manual', 'Automatic', 'Semi-Automatic', 'CVT')),
  fuel_type text not null
    check (fuel_type in ('Petrol', 'Diesel', 'Hybrid', 'Electric')),
  body_type text not null
    check (body_type in ('SUV', 'Sedan', 'Bakkie', 'Hatchback', 'Coupe', 'Convertible', 'MPV')),
  province text not null
    check (province in (
      'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
      'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'
    )),
  town text not null default '' check (char_length(town) <= 80),
  condition text not null check (condition in ('New', 'Used', 'Demo')),
  previous_owners smallint not null default 0 check (previous_owners between 0 and 50),
  service_history text not null
    check (service_history in (
      'Full Service History (Agents)', 'Full Service History (Independent)',
      'Partial Service History', 'No Service History'
    )),
  accident_history text not null
    check (accident_history in ('No Accident History', 'Minor Accident (Repaired)')),
  colour text not null default '' check (char_length(colour) <= 40),
  features text[] not null default '{}' check (cardinality(features) <= 60),
  description text not null default '' check (char_length(description) <= 5000),
  images text[] not null default '{}' check (cardinality(images) <= 20),
  featured boolean not null default false,
  status text not null default 'active' check (status in ('active', 'paused', 'sold', 'draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_seller_id_idx on public.listings (seller_id);
create index listings_active_created_at_idx on public.listings (created_at desc)
  where status = 'active';

alter table public.listings enable row level security;

create policy "Anyone can read active listings"
  on public.listings for select
  to anon, authenticated
  using (status = 'active');

create policy "Sellers can read their own listings"
  on public.listings for select
  to authenticated
  using ((select auth.uid()) = seller_id);

create policy "Sellers can create their own listings"
  on public.listings for insert
  to authenticated
  with check ((select auth.uid()) = seller_id);

create policy "Sellers can update their own listings"
  on public.listings for update
  to authenticated
  using ((select auth.uid()) = seller_id)
  with check ((select auth.uid()) = seller_id);

create policy "Sellers can delete their own listings"
  on public.listings for delete
  to authenticated
  using ((select auth.uid()) = seller_id);

-- Column-scoped writes: sellers can't set id, seller_id (defaults to
-- auth.uid()), featured, original_price or timestamps themselves.
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

-- Keeps updated_at current and tracks price drops: lowering the price
-- remembers the pre-drop price (shown as a strikethrough); raising it back to
-- or above that price clears it.
create function private.listings_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();

  if new.price < old.price then
    new.original_price := coalesce(old.original_price, old.price);
  end if;

  if new.original_price is not null and new.price >= new.original_price then
    new.original_price := null;
  end if;

  return new;
end;
$$;

create trigger listings_before_update
  before update on public.listings
  for each row execute function private.listings_before_update();
