-- Draft listings: a seller can save a half-finished listing and come back to
-- it later, and it's kept if they stop at identity verification.
--
-- A draft may have blank fields (no make, body type, year or price yet).
-- Every other status still needs a complete listing, so a draft can't move on
-- to payment until it's filled in. Drafts are only visible to their seller
-- (the existing select policies show other people `active` listings only).

-- ---------------------------------------------------------------------------
-- Blank fields allowed on drafts only
-- ---------------------------------------------------------------------------

alter table public.listings
  alter column year drop not null,
  alter column price drop not null,
  add constraint listings_complete_unless_draft
    check (status = 'draft' or (year is not null and price is not null));

alter table public.listings
  drop constraint listings_make_check,
  add constraint listings_make_check
    check (char_length(make) <= 60 and (status = 'draft' or char_length(make) >= 1)),
  drop constraint listings_model_check,
  add constraint listings_model_check
    check (char_length(model) <= 80 and (status = 'draft' or char_length(model) >= 1)),
  drop constraint listings_seller_name_check,
  add constraint listings_seller_name_check
    check (char_length(seller_name) <= 80 and (status = 'draft' or char_length(seller_name) >= 1)),
  drop constraint listings_transmission_check,
  add constraint listings_transmission_check
    check (transmission in ('Manual', 'Automatic', 'Semi-Automatic', 'CVT')
      or (status = 'draft' and transmission = '')),
  drop constraint listings_fuel_type_check,
  add constraint listings_fuel_type_check
    check (fuel_type in ('Petrol', 'Diesel', 'Hybrid', 'Electric')
      or (status = 'draft' and fuel_type = '')),
  drop constraint listings_body_type_check,
  add constraint listings_body_type_check
    check (body_type in ('SUV', 'Sedan', 'Bakkie', 'Hatchback', 'Coupe', 'Convertible', 'MPV')
      or (status = 'draft' and body_type = '')),
  drop constraint listings_province_check,
  add constraint listings_province_check
    check (province in (
        'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
        'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'
      )
      or (status = 'draft' and province = '')),
  drop constraint listings_condition_check,
  add constraint listings_condition_check
    check (condition in ('New', 'Used', 'Demo')
      or (status = 'draft' and condition = '')),
  drop constraint listings_service_history_check,
  add constraint listings_service_history_check
    check (service_history in (
        'Full Service History (Agents)', 'Full Service History (Independent)',
        'Partial Service History', 'No Service History'
      )
      or (status = 'draft' and service_history = '')),
  drop constraint listings_accident_history_check,
  add constraint listings_accident_history_check
    check (accident_history in ('No Accident History', 'Minor Accident (Repaired)')
      or (status = 'draft' and accident_history = ''));

-- ---------------------------------------------------------------------------
-- Sellers may move their own draft on to payment
-- ---------------------------------------------------------------------------
-- Same rules as before (20261027090000_roles_and_review.sql), plus
-- draft → pending_payment.

create or replace function private.listings_guard_seller_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user <> 'authenticated' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status not in ('pending_payment', 'draft') then
      new.status := 'pending_payment';
    end if;
    return new;
  end if;

  if new.status is distinct from old.status and not (
    -- Pause, resume or mark sold once approved.
    (old.approved_at is not null
      and old.status in ('active', 'paused', 'sold')
      and new.status in ('active', 'paused', 'sold'))
    -- Resubmit after making the requested changes.
    or (old.status = 'changes_requested' and new.status = 'pending_review')
    -- Finish a draft and go on to pay.
    or (old.status = 'draft' and new.status = 'pending_payment')
  ) then
    raise exception 'You can''t change this listing from % to %.', old.status, new.status
      using errcode = '42501';
  end if;

  if (to_jsonb(new) - array['status', 'updated_at', 'original_price', 'edited_at'])
     is distinct from
     (to_jsonb(old) - array['status', 'updated_at', 'original_price', 'edited_at']) then
    new.edited_at := now();
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Price drops only count once a listing has been approved
-- ---------------------------------------------------------------------------
-- Otherwise lowering the price while still writing a draft (or before review)
-- would show buyers a "price dropped" badge on a brand-new listing.

create or replace function private.listings_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();

  if new.price < old.price and old.approved_at is not null then
    new.original_price := coalesce(old.original_price, old.price);
  end if;

  if new.original_price is not null and (new.price is null or new.price >= new.original_price) then
    new.original_price := null;
  end if;

  return new;
end;
$$;
