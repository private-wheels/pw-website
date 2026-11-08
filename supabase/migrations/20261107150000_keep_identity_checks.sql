-- Keep identity check records when a seller deletes their account, so the
-- admin Finance page still counts what was spent on Smile ID. The record
-- loses its link to the person (user_id becomes null); what's left is the
-- outcome, dates and Smile ID's job reference.

alter table public.identity_verifications
  alter column user_id drop not null,
  drop constraint identity_verifications_user_id_fkey,
  add constraint identity_verifications_user_id_fkey
    foreign key (user_id) references auth.users (id) on delete set null;
