-- Identity verification (Smile ID Biometric KYC: SA ID number + selfie,
-- matched against the Home Affairs photo). Sellers must be verified before
-- they can pay for a listing. Admins skip it.
--
-- Private Wheels never sees the ID photo or selfie: they go straight from the
-- browser to Smile ID. We keep one row per attempt with the outcome only.
--
-- Every write goes through the server with the secret key, so sellers can't
-- mark themselves verified (no write grants on either column or table).
--
-- profiles.identity_status:
--   unverified → (submits) → pending → verified          (Smile ID: clear)
--                                    → review → verified/failed   (attention; an admin decides)
--                                    → unverified        (block or error, retries left)
--                                    → failed            (no retries left; contact support)

-- ---------------------------------------------------------------------------
-- profiles: verification state
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column identity_status text not null default 'unverified'
    check (identity_status in ('unverified', 'pending', 'review', 'verified', 'failed')),
  add column identity_verified_at timestamptz;

-- ---------------------------------------------------------------------------
-- identity_verifications: one row per attempt
-- ---------------------------------------------------------------------------

create table public.identity_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Smile ID's job ID, known once the browser has submitted the check.
  job_id text unique check (char_length(job_id) <= 100),
  -- started: session opened, nothing submitted yet (doesn't count as an attempt)
  -- processing: submitted, waiting for Smile ID
  -- clear / attention / block / error: Smile ID's verdict
  status text not null default 'started'
    check (status in ('started', 'processing', 'clear', 'attention', 'block', 'error')),
  -- Smile ID's reason code, e.g. face_verification_failed (null when clear).
  reason text check (char_length(reason) <= 100),
  -- Admin decision on an `attention` result.
  review_decision text check (review_decision in ('approved', 'rejected')),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  completed_at timestamptz
);

create index identity_verifications_user_id_idx
  on public.identity_verifications (user_id, created_at desc);
create index identity_verifications_reviewed_by_idx
  on public.identity_verifications (reviewed_by);
create index identity_verifications_attention_idx
  on public.identity_verifications (completed_at)
  where status = 'attention' and review_decision is null;

alter table public.identity_verifications enable row level security;

create policy "Users can read their own verifications"
  on public.identity_verifications for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.identity_verifications from anon, authenticated;
grant select on public.identity_verifications to authenticated;

-- ---------------------------------------------------------------------------
-- Admins don't need verifying.
-- ---------------------------------------------------------------------------

update public.profiles
set identity_status = 'verified', identity_verified_at = now()
where role = 'admin';
