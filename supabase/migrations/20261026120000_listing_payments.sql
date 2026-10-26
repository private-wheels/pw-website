-- Paid listings (Paystack). A new listing starts as `pending_payment` and only
-- the server can make it public: it records the payment, sets `paid_at` and
-- flips the status to `active`. Sellers can't write `paid_at` (no column
-- grant), and the check constraints stop them setting `active` on an unpaid
-- listing themselves.

-- ---------------------------------------------------------------------------
-- listings: payment state
-- ---------------------------------------------------------------------------

alter table public.listings add column paid_at timestamptz;

-- Everything listed before payments existed (the demo listings and any test
-- listings) is treated as paid, so it stays public.
update public.listings set paid_at = created_at where paid_at is null;

alter table public.listings drop constraint listings_status_check;
alter table public.listings add constraint listings_status_check
  check (status in ('pending_payment', 'active', 'paused', 'sold', 'draft'));

alter table public.listings alter column status set default 'pending_payment';

-- Only a paid listing can be public; only an unpaid one can await payment.
alter table public.listings add constraint listings_active_requires_payment
  check (status <> 'active' or paid_at is not null);
alter table public.listings add constraint listings_pending_payment_unpaid
  check (status <> 'pending_payment' or paid_at is null);

-- ---------------------------------------------------------------------------
-- payments: one row per Paystack checkout attempt
-- ---------------------------------------------------------------------------

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  -- Our transaction reference, sent to Paystack and echoed back on verify.
  reference text not null unique check (char_length(reference) between 1 and 100),
  -- Kept (as null) if the listing or account is later deleted, for the books.
  listing_id uuid references public.listings (id) on delete set null,
  seller_id uuid references auth.users (id) on delete set null,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'ZAR' check (currency = 'ZAR'),
  status text not null default 'pending'
    check (status in ('pending', 'success', 'failed', 'abandoned')),
  paystack_transaction_id bigint,
  channel text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_listing_id_idx on public.payments (listing_id);
create index payments_seller_id_idx on public.payments (seller_id);

alter table public.payments enable row level security;

-- Sellers can see their own payments; every write goes through the server
-- with the secret key (which bypasses RLS), so there are no write policies.
create policy "Sellers can read their own payments"
  on public.payments for select
  to authenticated
  using ((select auth.uid()) = seller_id);

grant select on public.payments to authenticated;

create function private.payments_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger payments_before_update
  before update on public.payments
  for each row execute function private.payments_before_update();
