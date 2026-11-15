"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { isListingId } from "@/lib/listings";
import { formatFee, listingFeeCents, type ListingFee } from "@/lib/payments";
import { isFoundingPriceActive } from "@/lib/site";
import { COMPLETENESS_COLUMNS, missingDetails } from "@/lib/listing-complete";
import { initializeTransaction } from "@/lib/paystack";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Starts Paystack checkout for one of the signed-in seller's unpaid listings.
 * Returns the hosted checkout URL for the browser to open, or asks for
 * identity verification first.
 */
export async function startListingCheckout(
  listingId: string,
): Promise<{ url: string } | { error: string; needsVerification?: true }> {
  // An unexpected failure (a missing setting, an outage) comes back as a
  // message the seller can act on, not a bare "something went wrong".
  try {
    return await checkout(listingId);
  } catch (err) {
    console.error("[payments] checkout failed", err);
    return {
      error: "We couldn't start the payment because of a problem on our side. Please try again in a minute, or email hello@private-wheels.co.za.",
    };
  }
}

async function checkout(
  listingId: string,
): Promise<{ url: string } | { error: string; needsVerification?: true }> {
  if (!isListingId(listingId)) return { error: "Listing not found." };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Anonymous sellers (the pre-launch /list flow) have a pending email until
  // they confirm it; Paystack only needs somewhere to send the receipt.
  const email = user?.email || user?.new_email;
  if (!user || !email) return { error: "Please add your email address first." };

  // Read as the user, so RLS guarantees they own the listing.
  const { data: listing } = await supabase
    .from("listings")
    .select(`id, seller_id, status, paid_at, ${COMPLETENESS_COLUMNS}`)
    .eq("id", listingId)
    .maybeSingle();
  if (!listing || listing.seller_id !== user.id) return { error: "Listing not found." };
  if (listing.paid_at) return { error: "This listing has already been paid for." };
  const missing = missingDetails(listing);
  if (missing.length > 0) {
    return { error: `Your listing is missing ${missing.join(", ")}. Edit it to add them, then pay.` };
  }

  // Sellers verify their identity (Smile ID) before they can pay.
  const { data: profile } = await supabase
    .from("profiles")
    .select("identity_status")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.identity_status !== "verified") {
    return { error: "Please verify your identity before paying.", needsVerification: true };
  }

  const reference = `pw_${randomBytes(12).toString("hex")}`;
  const amountCents = listingFeeCents(isFoundingPriceActive());
  const { error } = await createAdminClient().from("payments").insert({
    reference,
    listing_id: listing.id,
    seller_id: user.id,
    amount_cents: amountCents,
  });
  if (error) {
    console.error("[payments] couldn't record payment:", error.message);
    return { error: "We couldn't start the payment. Please try again." };
  }

  try {
    const { authorization_url } = await initializeTransaction({
      email,
      amountCents,
      reference,
      callbackUrl: `${await siteOrigin()}/api/paystack/callback`,
      metadata: {
        listing_id: listing.id,
        seller_id: user.id,
        custom_fields: [
          {
            display_name: "Listing",
            variable_name: "listing",
            value: `${listing.year} ${listing.make} ${listing.model}`,
          },
        ],
      },
    });
    return { url: authorization_url };
  } catch (err) {
    console.error("[payments]", err);
    return { error: "We couldn't reach our payment provider. Please try again." };
  }
}

/**
 * The origin the seller is browsing on (localhost in dev, the real domain in
 * production), so Paystack sends them back to the same site. Next has already
 * checked that a Server Action's Origin matches its host.
 */
async function siteOrigin(): Promise<string> {
  const origin = (await headers()).get("origin");
  return origin ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/** The fee a seller would pay right now (founding price before launch). */
export async function getListingFee(): Promise<ListingFee> {
  const founding = isFoundingPriceActive();
  const cents = listingFeeCents(founding);
  return { cents, label: formatFee(cents), founding };
}
