import { adminNotifyRecipients, sendEmail } from "@/lib/email";
import {
  adminReviewNeededEmail,
  changesRequestedEmail,
  isPreLaunch,
  listingApprovedEmail,
  listingLiveEmail,
  listingReceivedEmail,
  listingRejectedEmail,
  listingReminderEmail,
  refundIssuedEmail,
  type ListingEmailData,
} from "@/lib/email-templates";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Looks up a listing and its seller's email, then sends one of the listing
 * emails. Best effort: a missing listing or failed send is logged, never
 * thrown, so it can't undo the payment or review decision that triggered it.
 */

type ListingEvent =
  | { type: "received"; resubmitted?: boolean }
  | { type: "approved" }
  | { type: "changes_requested"; note: string }
  | { type: "rejected"; note: string; refund: boolean; amount?: string }
  /** Launch day: approved before launch, now public. */
  | { type: "live" }
  /** Saved a while ago and not finished (draft) or not paid. */
  | { type: "reminder"; stage: "draft" | "unpaid" };

export function listingTitle(l: { year: number | null; make: string; model: string; variant: string }) {
  return [l.year, l.make, l.model, l.variant].filter(Boolean).join(" ");
}

/** Returns whether an email went to the seller (admin alerts aside). */
export async function notifyListing(listingId: string, event: ListingEvent): Promise<boolean> {
  try {
    const db = createAdminClient();
    const { data: listing } = await db
      .from("listings")
      .select("id, seller_id, seller_name, year, make, model, variant")
      .eq("id", listingId)
      .maybeSingle();
    if (!listing?.seller_id) return false;

    const [{ data: seller }, { data: profile }] = await Promise.all([
      db.auth.admin.getUserById(listing.seller_id),
      db.from("profiles").select("first_name").eq("id", listing.seller_id).maybeSingle(),
    ]);
    const to = seller.user?.email || seller.user?.new_email;
    const data: ListingEmailData = {
      sellerName: listing.seller_name,
      listingTitle: listingTitle(listing),
      listingId: listing.id,
    };
    // Seller emails greet them by the first name they registered with; the
    // admin alert keeps the name on the listing.
    const toSeller: ListingEmailData = { ...data, sellerName: profile?.first_name || listing.seller_name };

    if (event.type === "received") {
      const sent = to ? await sendEmail(to, listingReceivedEmail({ ...toSeller, resubmitted: event.resubmitted })) : false;
      await sendEmail(
        adminNotifyRecipients(),
        adminReviewNeededEmail({ ...data, resubmitted: event.resubmitted }),
      );
      return sent;
    }
    if (!to) return false;
    switch (event.type) {
      case "approved":
        return await sendEmail(to, listingApprovedEmail({ ...toSeller, preLaunch: isPreLaunch() }));
      case "changes_requested":
        return await sendEmail(to, changesRequestedEmail({ ...toSeller, note: event.note }));
      case "rejected":
        return await sendEmail(
          to,
          listingRejectedEmail({ ...toSeller, note: event.note, refund: event.refund, amount: event.amount }),
        );
      case "live":
        return await sendEmail(to, listingLiveEmail(toSeller));
      case "reminder":
        // Only to confirmed emails: a temporary /list account's pending
        // address hasn't been confirmed by its owner yet.
        if (!seller.user?.email) return false;
        return await sendEmail(seller.user.email, listingReminderEmail({ ...toSeller, stage: event.stage }));
    }
  } catch (err) {
    console.error("[listing email]", err);
    return false;
  }
}

/** A refund made on its own (not while rejecting): tell the seller. Best effort. */
export async function notifyRefund(paymentId: string): Promise<boolean> {
  try {
    const db = createAdminClient();
    const { data: payment } = await db
      .from("payments")
      .select("seller_id, listing_id, amount_cents")
      .eq("id", paymentId)
      .maybeSingle();
    if (!payment?.seller_id) return false;

    const [{ data: seller }, { data: profile }, { data: listing }] = await Promise.all([
      db.auth.admin.getUserById(payment.seller_id),
      db.from("profiles").select("first_name, display_name").eq("id", payment.seller_id).maybeSingle(),
      payment.listing_id
        ? db.from("listings").select("year, make, model, variant").eq("id", payment.listing_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    const to = seller.user?.email || seller.user?.new_email;
    if (!to) return false;
    return await sendEmail(
      to,
      refundIssuedEmail({
        sellerName: profile?.first_name || profile?.display_name || "",
        amount: `R${(payment.amount_cents / 100).toFixed(2).replace(/\.00$/, "")}`,
        listingTitle: listing ? listingTitle(listing) : null,
      }),
    );
  } catch (err) {
    console.error("[refund email]", err);
    return false;
  }
}
