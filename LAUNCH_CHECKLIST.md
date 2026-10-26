# Launch checklist

Everything between now and launch day, in order. Tick items off as they're
done. "Vercel" means the production project's Environment Variables (redeploy
after changing them).

## 1. Production configuration (do now)

`main` already has payments, admin review and the `/list` pre-launch flow. If
Vercel deploys `main`, `/list` is reachable on the live site, so it needs these
before anyone uses it.

- [ ] **Vercel env vars** (see `.env.example` for what each one does):
  - `SUPABASE_SECRET_KEY`: Supabase → Project Settings → API Keys (`sb_secret_…`).
    Server-only, never `NEXT_PUBLIC_`.
  - `PAYSTACK_SECRET_KEY`: the **test** key (`sk_test_…`) until step 3.
  - `RESEND_API_KEY`: needed for the listing review emails as well as leads.
  - `NEXT_PUBLIC_SITE_URL=https://www.private-wheels.co.za`
  - Optional: `LISTING_EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL` (both default to
    hello@private-wheels.co.za).
  - Leave `FOUNDING_PRICE` **unset** in production, so sellers pay R125 until
    launch and R249 after.
- [ ] **Paystack webhook (test mode):** Paystack → Settings → API Keys &
      Webhooks → Test Webhook URL
      `https://www.private-wheels.co.za/api/paystack/webhook`
- [ ] **Turnstile (bot check), in this order:**
  1. Cloudflare → Turnstile → Add widget. Hostnames: `private-wheels.co.za`,
     `www.private-wheels.co.za`, `localhost`. Mode: Managed.
  2. Put the **site key** in Vercel as `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (and in
     `.env.local`), then **deploy**.
  3. Only once that's live (the bot check shows on `/login`): Supabase →
     Authentication → Attack Protection (under Configuration) → CAPTCHA
     protection → Turnstile → paste the **secret key**.

  Doing step 3 first blocks every sign-in and sign-up until step 2 is deployed.
- [ ] **Minimum password length 8:** Supabase → Authentication → Sign In /
      Providers → Email → Minimum password length `8` (the site already asks
      for 8). Leave "Password requirements" unset so the site's error message
      matches.
- [ ] *(Pro plan only)* Leaked password protection: same Email panel, "Prevent
      use of leaked passwords". Not available on the free plan; turn it on if
      you upgrade.

Already done:

- [x] Payments, roles/review and anonymous clean-up migrations applied
- [x] Admins: jpswart80@gmail.com, will@private-wheels.co.za
- [x] Auth emails sent through Resend (custom SMTP), with a raised email rate limit
- [x] Email templates use `token_hash` links, so confirmations work on any device
- [x] Anonymous sign-ins switched on (needed for `/list`)
- [x] `private-wheels.co.za` verified in Resend

## 2. Test on the live site (test card)

Paystack test card: `4084 0840 8408 4081`, any future expiry, CVV `408`.

- [ ] **`/list` as a new seller:** in a private window, go to
      `/list` → Start your listing → add a car with photos → I'm new here (an
      email you can check) → pay **R125** → "You're all set!"
  - [ ] Received "We've received your listing" and the confirm-email link
  - [ ] The link opens `/list/password`, and the password works on `/login`
- [ ] **`/list` with an existing account:** choose "I have an account" and sign
      in. The listing (and photos) show up on that account's dashboard.
- [ ] **Admin review** (signed in as an admin → Dashboard → Admin):
  - [ ] Approve one: the seller gets the "approved" email
  - [ ] Request changes on one: the seller sees the note, edits, presses
        **Save & Resubmit**, and it's back in the queue
  - [ ] Reject one with refund ticked: Payments shows *refund pending*, then
        *refunded* once Paystack confirms
- [ ] **Admin listing:** create a listing as an admin. It publishes without
      payment.
- [ ] **Gate:** signed out, `/`, `/cars` and `/finance` show the coming-soon
      page; `/list`, `/login`, `/register` and `/legal/*` open.

## 3. Go live with payments

- [ ] Vercel: switch `PAYSTACK_SECRET_KEY` to the **live** key (`sk_live_…`).
      Keep `sk_test_…` in `.env.local`.
- [ ] Paystack → Live Webhook URL:
      `https://www.private-wheels.co.za/api/paystack/webhook`
- [ ] One real R125 payment through `/list`, then refund it from
      Admin → Payments. Check it reaches the card.

## 4. Legal and compliance

- [ ] Set the policies' effective date: `LEGAL_LAST_UPDATED` /
      `[EFFECTIVE DATE]` in `src/lib/legal.ts`.
- [ ] Attorney review of `/legal/privacy`, `/legal/terms` and `/legal/refunds`.
- [ ] Register the Information Officer (Wilhelm Stoltz) with the Information
      Regulator (inforegulator.org.za).
- [ ] Confirm whether a PAIA manual is required, or the small private body
      exemption applies.

## 5. Before inviting sellers (recommended)

- [ ] **Forgot password.** "Forgot password?" on `/login` is plain text with no
      reset flow. Without one, anyone who forgets their password, or a `/list`
      seller who lost the confirm-email link, can't get back in.

## 6. Launch day

- [ ] **Delete the demo listings.** The 43 seeded cars are the only rows with
      no seller. In the Supabase SQL editor:

      ```sql
      delete from public.listings where seller_id is null;
      ```

      Their photos are static files in `public/listings/` (not in Storage).
      Optionally remove `public/listings/bmw-x1-sdrive18d/` afterwards.
- [ ] **Vercel: `SITE_LAUNCHED=true`** and redeploy. The marketplace opens,
      approved founding listings go live, and new listings cost R249 (unless
      `FOUNDING_PRICE=on`).
- [ ] **Check the public site:** home page, `/cars`, a listing page, and
      Sell your car → listing → pay **R249** → review.
- [ ] Tell the founding sellers they're live.

## Later

- [ ] Smile ID seller verification (waiting on their team)
