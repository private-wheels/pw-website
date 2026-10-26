-- Roles and listing review.
--
-- Accounts are `member` (everyone) or `admin`. Admin work (approving,
-- rejecting, refunds, publishing without payment) runs on the server with the
-- secret key after checking the role, so no admin RLS policies are needed.
--
-- Listing lifecycle:
--   pending_payment → (paid) → pending_review → active
--                                  ↓    ↑ resubmit
--                          changes_requested
--   pending_review / active → rejected (by an admin)
--   active ↔ paused, active/paused → sold (by the seller, once approved)
--
-- A trigger stops sellers making any other status change themselves, so a
-- paid listing can't skip review.

-- ---------------------------------------------------------------------------
-- profiles.role
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column role text not null default 'member' check (role in ('member', 'admin'));

-- Not in the profiles update grant, so nobody can change their own role.

update public.profiles set role = 'admin'
where id in (
  select id from auth.users
  where email in ('jpswart80@gmail.com', 'will@private-wheels.co.za')
);

-- ---------------------------------------------------------------------------
-- listings: review state
-- ---------------------------------------------------------------------------

alter table public.listings
  add column approved_at timestamptz,
  add column reviewed_by uuid references auth.users (id) on delete set null,
  add column review_note text not null default '' check (char_length(review_note) <= 2000),
  -- Set when the seller changes the listing's content; flags edits made
  -- after approval for a spot-check.
  add column edited_at timestamptz,
  -- Published by an admin without paying the listing fee.
  add column fee_waived boolean not null default false;

create index listings_reviewed_by_idx on public.listings (reviewed_by);

-- Everything public today was effectively approved.
update public.listings
set approved_at = coalesce(paid_at, created_at)
where status in ('active', 'paused', 'sold');

alter table public.listings drop constraint listings_status_check;
alter table public.listings add constraint listings_status_check
  check (status in (
    'pending_payment', 'pending_review', 'changes_requested',
    'active', 'paused', 'sold', 'rejected', 'draft'
  ));

-- Replaced by the broader rule below.
alter table public.listings drop constraint listings_active_requires_payment;

alter table public.listings add constraint listings_paid_statuses
  check (
    status not in ('pending_review', 'changes_requested', 'active', 'paused', 'sold')
    or paid_at is not null
  );

alter table public.listings add constraint listings_approved_statuses
  check (status not in ('active', 'paused', 'sold') or approved_at is not null);

-- Sellers (the `authenticated` role) may only make these changes. The server
-- (secret key) and the SQL editor aren't restricted.
create function private.listings_guard_seller_changes()
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

create trigger listings_guard_seller_changes
  before insert or update on public.listings
  for each row execute function private.listings_guard_seller_changes();

-- ---------------------------------------------------------------------------
-- payments: refunds
-- ---------------------------------------------------------------------------

alter table public.payments drop constraint payments_status_check;
alter table public.payments add constraint payments_status_check
  check (status in ('pending', 'success', 'failed', 'abandoned', 'refund_pending', 'refunded'));

alter table public.payments
  add column refunded_at timestamptz,
  add column refund_note text not null default '' check (char_length(refund_note) <= 500);
