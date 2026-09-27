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
