"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { isListingId } from "@/lib/listings";
import { LISTING_FEE_CENTS } from "@/lib/payments";
import { initializeTransaction } from "@/lib/paystack";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Starts Paystack checkout for one of the signed-in seller's unpaid listings.
 * Returns the hosted checkout URL for the browser to open.
 */
export async function startListingCheckout(
  listingId: string,
): Promise<{ url: string } | { error: string }> {
  if (!isListingId(listingId)) return { error: "Listing not found." };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Please sign in again." };

  // Read as the user, so RLS guarantees they own the listing.
  const { data: listing } = await supabase
    .from("listings")
    .select("id, seller_id, status, paid_at, year, make, model")
    .eq("id", listingId)
    .maybeSingle();
  if (!listing || listing.seller_id !== user.id) return { error: "Listing not found." };
  if (listing.paid_at) return { error: "This listing has already been paid for." };

  const reference = `pw_${randomBytes(12).toString("hex")}`;
  const { error } = await createAdminClient().from("payments").insert({
    reference,
    listing_id: listing.id,
    seller_id: user.id,
    amount_cents: LISTING_FEE_CENTS,
  });
  if (error) {
    console.error("[payments] couldn't record payment:", error.message);
    return { error: "We couldn't start the payment. Please try again." };
  }

  try {
    const { authorization_url } = await initializeTransaction({
      email: user.email,
      amountCents: LISTING_FEE_CENTS,
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
