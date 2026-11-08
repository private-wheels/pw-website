import { startListingCheckout } from "@/app/actions/payments";

export class PaymentError extends Error {}

/**
 * Sends the browser to Paystack's checkout for a listing's fee, or to identity
 * verification first if the seller hasn't done it yet.
 */
export async function goToCheckout(listingId: string): Promise<void> {
  const result = await startListingCheckout(listingId);
  if ("needsVerification" in result) {
    // Called from event handlers all over the sell flow, outside any router.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/list/verify?listing=${encodeURIComponent(listingId)}`);
    return;
  }
  if ("error" in result) throw new PaymentError(result.error);
  window.location.assign(result.url);
}
