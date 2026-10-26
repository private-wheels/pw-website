"use server";

import { updateTag } from "next/cache";
import { isListingId } from "@/lib/listings";
import { refundPayment } from "@/lib/paystack";
import { getAdmin } from "@/lib/server/admin";
import { notifyListing } from "@/lib/server/listing-emails";
import { createAdminClient } from "@/lib/supabase/admin";
import { LISTINGS_TAG } from "@/lib/supabase/server";

/**
 * Admin review actions. Each one checks the caller is an admin, then writes
 * with the secret key (sellers can't make these changes themselves — see the
 * listings_guard_seller_changes trigger).
 */

type Result = { ok: true; warning?: string } | { ok: false; error: string };

const NOT_ADMIN: Result = { ok: false, error: "Only admins can do that." };

function cleanNote(note: string): string {
  return note.trim().slice(0, 2000);
}

async function loadListing(id: string) {
  if (!isListingId(id)) return null;
  const { data } = await createAdminClient()
    .from("listings")
    .select("id, status, paid_at, approved_at, fee_waived")
    .eq("id", id)
    .maybeSingle();
  return data;
}

/** Approve: the listing goes live (or waits for launch day, while gated). */
export async function approveListing(id: string): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  const listing = await loadListing(id);
  if (!listing) return { ok: false, error: "Listing not found." };
  if (!["pending_review", "changes_requested"].includes(listing.status)) {
    return { ok: false, error: `This listing is ${listing.status.replace("_", " ")}, not awaiting review.` };
  }

  const { error } = await createAdminClient()
    .from("listings")
    .update({
      status: "active",
      approved_at: listing.approved_at ?? new Date().toISOString(),
      reviewed_by: admin.id,
      review_note: "",
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  updateTag(LISTINGS_TAG);
  await notifyListing(id, { type: "approved" });
  return { ok: true };
}

/** Send it back to the seller with a note; they fix it and resubmit for free. */
export async function requestChanges(id: string, note: string): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  const text = cleanNote(note);
  if (!text) return { ok: false, error: "Tell the seller what to change." };
  const listing = await loadListing(id);
  if (!listing) return { ok: false, error: "Listing not found." };
  if (!["pending_review", "active", "paused"].includes(listing.status)) {
    return { ok: false, error: `Can't request changes on a ${listing.status.replace("_", " ")} listing.` };
  }

  const { error } = await createAdminClient()
    .from("listings")
    .update({ status: "changes_requested", reviewed_by: admin.id, review_note: text })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  updateTag(LISTINGS_TAG);
  await notifyListing(id, { type: "changes_requested", note: text });
  return { ok: true };
}

/**
 * Reject (or take down) a listing, optionally refunding its fee in full. The
 * listing is rejected even if the refund fails — the result then carries a
 * warning so the admin can refund from the Payments page or Paystack.
 */
export async function rejectListing(id: string, note: string, refund: boolean): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  const text = cleanNote(note);
  if (!text) return { ok: false, error: "Give the seller a reason." };
  const listing = await loadListing(id);
  if (!listing) return { ok: false, error: "Listing not found." };
  if (listing.status === "rejected") return { ok: false, error: "This listing is already rejected." };

  const db = createAdminClient();
  const { error } = await db
    .from("listings")
    .update({ status: "rejected", reviewed_by: admin.id, review_note: text })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  updateTag(LISTINGS_TAG);

  let refunded = false;
  let refundedAmount: string | undefined;
  let warning: string | undefined;
  if (refund) {
    const { data: payment } = await db
      .from("payments")
      .select("id, amount_cents")
      .eq("listing_id", id)
      .eq("status", "success")
      .order("paid_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!payment) {
      warning = "Rejected, but there was no successful payment to refund.";
    } else {
      try {
        await refundPayment(payment.id, `Listing rejected: ${text}`);
        refunded = true;
        refundedAmount = `R${(payment.amount_cents / 100).toFixed(2).replace(/\.00$/, "")}`;
      } catch (err) {
        console.error("[admin] refund failed", err);
        warning = "Rejected, but the refund failed. Retry it from Payments or refund in the Paystack dashboard.";
      }
    }
  }

  await notifyListing(id, { type: "rejected", note: text, refund: refunded, amount: refundedAmount });
  return warning ? { ok: true, warning } : { ok: true };
}

/** Refund a payment on its own (duplicate charge, founding-seller cancellation…). */
export async function refundPaymentAction(paymentId: string, note: string): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  const text = note.trim();
  if (!text) return { ok: false, error: "Add a short reason for the refund." };
  try {
    await refundPayment(paymentId, text);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Refund failed." };
  }
}

/**
 * Admins list without paying or waiting for review: publishes one of their
 * own unpaid listings straight away (waiting for launch day while gated).
 */
export async function publishWithoutPayment(id: string): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  if (!isListingId(id)) return { ok: false, error: "Listing not found." };

  const now = new Date().toISOString();
  const { data, error } = await createAdminClient()
    .from("listings")
    .update({
      status: "active",
      paid_at: now,
      approved_at: now,
      fee_waived: true,
      reviewed_by: admin.id,
    })
    .eq("id", id)
    .eq("seller_id", admin.id)
    .is("paid_at", null)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (data.length === 0) return { ok: false, error: "This listing isn't yours or is already published." };

  updateTag(LISTINGS_TAG);
  return { ok: true };
}
