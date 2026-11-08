# Launch checklist

Things to do before the site goes live (before setting `SITE_LAUNCHED=true`
in Vercel). Tick them off as they're done.

## Test the seller flow end to end

- [ ] Run through it both locally (`npm run dev`) and on the live site
      (unlocked with the preview PIN): register → click the confirmation email
      link → publish a listing with a few photos → check it appears on the
      home page, `/cars` and its own page → pause, edit (change the price and
      photos) and delete it from the dashboard.

## Supabase

- [ ] **Send auth emails through Resend instead of Supabase's built-in email
      sender.** The built-in sender is heavily rate-limited and meant for
      testing only, so sign-up confirmation emails will stop arriving once real
      users register.
      Supabase dashboard → Authentication → Emails → SMTP Settings → enable
      custom SMTP:
      - Host `smtp.resend.com`, port `465`, username `resend`
      - Password: a Resend API key with sending access
      - Sender: an address on `private-wheels.co.za`, e.g.
        `Private Wheels <noreply@private-wheels.co.za>`

      This needs `private-wheels.co.za` verified in Resend (resend.com/domains),
      the same prerequisite as the lead-form emails.

- [ ] **Delete the demo listings.** The 43 cars carried over from the old seed
      data have made-up seller names and phone numbers. They're the only rows
      with no seller, so in the Supabase SQL editor run:

      ```sql
      delete from public.listings where seller_id is null;
      ```

      Their photos are static files in `public/listings/` (not in Storage), so
      nothing else needs cleaning up. Optionally remove
      `public/listings/bmw-x1-sdrive18d/` afterwards.

## Smile ID (identity verification)

Sellers can't pay for a listing until they're verified, so this must be live
before anyone can list (including founding sellers on the `/list` link).
While testing before launch, Vercel Production can run on the **sandbox**
values (`SMILE_ID_ENV=sandbox`, sandbox key), so test checks cost nothing.
Steps 2–3 below switch it to production and must be done before
`SITE_LAUNCHED=true`. If the `SMILE_ID_*` variables are missing altogether,
nobody can verify, so nobody can pay.

- [x] **1. Apply the database migrations** (done 7 Nov 2026; local dev and
      the live site share one database):
      `20261107090000_identity_verification.sql`,
      `20261107120000_profiles_first_name.sql`,
      `20261107150000_keep_identity_checks.sql`.
- [ ] **2. Production credentials.** Smile ID portal → Developers → Security
      Settings → switch to Production → Create Credential. Then in Vercel →
      Settings → Environment Variables:

      | Variable | Production | Preview |
      |---|---|---|
      | `SMILE_ID_PARTNER_ID` | your partner number | your partner number |
      | `SMILE_ID_API_KEY` | **production** key (mark *Sensitive*) | **sandbox** key |
      | `SMILE_ID_ENV` | `production` | `sandbox` |
      | `SMILE_ID_CALLBACK_URL` | leave unset | `https://www.private-wheels.co.za/api/smileid/webhook` (or unset) |

      Preview stays on sandbox so testing a preview link never spends wallet
      money. Development needs nothing (local dev reads `.env.local`).
- [ ] **3. Production callback URL.** Same portal page → Callback URLs →
      Production → add `https://www.private-wheels.co.za/api/smileid/webhook`.
      Add the same URL under Sandbox too, for preview deployments.
- [ ] **4. Redeploy** after changing the variables. Vercel only picks up new
      variables on a new deployment.
- [ ] **Wallet balance.** Each check costs $1.30 (Biometric KYC, SA ID). Top up
      before launch and keep an eye on it; checks fail when the wallet is empty.
- [ ] **Test it once for real** with your own ID on the live site, then check
      `/dashboard/admin/verifications`.

## Paystack receipts and the Finance page

- [ ] **Turn on payment receipts for sellers.** Paystack dashboard → Settings
      → Preferences → enable emailing receipts to customers. That's the
      seller's proof of payment (we don't issue our own invoices yet).
- [ ] **Check the Finance page against Paystack** after the first live
      payments: open a row's "Paystack" link and confirm it lands on that
      transaction, and that "Waiting at Paystack" matches the dashboard.
- [ ] **Update the Smile ID estimate if prices change.** `SMILE_CHECK_COST_USD`
      and `APPROX_ZAR_PER_USD` in `src/lib/server/finance-report.ts`.
