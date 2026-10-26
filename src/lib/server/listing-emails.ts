import { adminNotifyRecipients, sendEmail } from "@/lib/email";
import {
  adminReviewNeededEmail,
  changesRequestedEmail,
  isPreLaunch,
  listingApprovedEmail,
  listingReceivedEmail,
  listingRejectedEmail,
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
  | { type: "rejected"; note: string; refund: boolean; amount?: string };

export function listingTitle(l: { year: number; make: string; model: string; variant: string }) {
  return [l.year, l.make, l.model, l.variant].filter(Boolean).join(" ");
}

export async function notifyListing(listingId: string, event: ListingEvent): Promise<void> {
  try {
    const db = createAdminClient();
    const { data: listing } = await db
      .from("listings")
      .select("id, seller_id, seller_name, year, make, model, variant")
      .eq("id", listingId)
      .maybeSingle();
    if (!listing?.seller_id) return;

    const { data: seller } = await db.auth.admin.getUserById(listing.seller_id);
    const to = seller.user?.email;
    const data: ListingEmailData = {
      sellerName: listing.seller_name,
      listingTitle: listingTitle(listing),
      listingId: listing.id,
    };

    if (event.type === "received") {
      if (to) await sendEmail(to, listingReceivedEmail({ ...data, resubmitted: event.resubmitted }));
      await sendEmail(
        adminNotifyRecipients(),
        adminReviewNeededEmail({ ...data, resubmitted: event.resubmitted }),
      );
      return;
    }
    if (!to) return;
    if (event.type === "approved") {
      await sendEmail(to, listingApprovedEmail({ ...data, preLaunch: isPreLaunch() }));
    } else if (event.type === "changes_requested") {
      await sendEmail(to, changesRequestedEmail({ ...data, note: event.note }));
    } else {
      await sendEmail(
        to,
        listingRejectedEmail({ ...data, note: event.note, refund: event.refund, amount: event.amount }),
      );
    }
  } catch (err) {
    console.error("[listing email]", err);
  }
}
