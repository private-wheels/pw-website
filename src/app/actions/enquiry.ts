"use server";

import { headers } from "next/headers";
import { sendEmail } from "@/lib/email";
import { enquiryCopyEmail, enquiryToSellerEmail } from "@/lib/email-templates";
import { isListingId } from "@/lib/listings";
import { listingTitle } from "@/lib/server/listing-emails";
import { verifyTurnstile } from "@/lib/server/turnstile";
import { createAdminClient } from "@/lib/supabase/admin";

export type EnquiryInput = {
  listingId: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  captchaToken?: string;
  /** Honeypot: hidden field only bots fill in. */
  website?: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * A buyer's message from a listing page. Emailed to the seller with the
 * buyer as reply-to (so the seller just hits reply), plus a copy to the
 * buyer. The seller's email address is never shown on the site. Protected by
 * Turnstile, and only for live listings.
 */
export async function sendEnquiry(input: EnquiryInput): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.website) return { ok: true };

  const name = input.name.trim().slice(0, 80);
  const email = input.email.trim().slice(0, 200);
  const phone = input.phone.trim().slice(0, 30);
  const message = input.message.trim().slice(0, 2000);
  if (!name || !EMAIL.test(email) || message.length < 2) {
    return { ok: false, error: "Please add your name, a valid email address and a message." };
  }
  if (!isListingId(input.listingId)) return { ok: false, error: "This listing isn't available any more." };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  if (!(await verifyTurnstile(input.captchaToken, ip))) {
    return { ok: false, error: "The security check didn't go through. Please try again." };
  }

  const db = createAdminClient();
  const { data: listing } = await db
    .from("listings")
    .select("id, seller_id, seller_name, status, year, make, model, variant")
    .eq("id", input.listingId)
    .maybeSingle();
  if (!listing || listing.status !== "active" || !listing.seller_id) {
    return { ok: false, error: "This listing isn't available any more." };
  }

  const [{ data: seller }, { data: profile }] = await Promise.all([
    db.auth.admin.getUserById(listing.seller_id),
    db.from("profiles").select("first_name").eq("id", listing.seller_id).maybeSingle(),
  ]);
  const sellerEmail = seller.user?.email || seller.user?.new_email;
  if (!sellerEmail) {
    return { ok: false, error: "We couldn't reach this seller right now. Please call them instead." };
  }

  const data = {
    listingTitle: listingTitle(listing),
    listingId: listing.id,
    sellerName: profile?.first_name || listing.seller_name,
    buyerName: name,
    buyerEmail: email,
    buyerPhone: phone,
    message,
  };
  const sent = await sendEmail(sellerEmail, enquiryToSellerEmail(data), { replyTo: email });
  if (!sent) return { ok: false, error: "We couldn't send your message just now. Please try again in a minute." };

  await sendEmail(email, enquiryCopyEmail(data));
  return { ok: true };
}
