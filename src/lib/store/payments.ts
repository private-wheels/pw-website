import { startListingCheckout } from "@/app/actions/payments";

export class PaymentError extends Error {}

/** Sends the browser to Paystack's checkout for a listing's fee. */
export async function goToCheckout(listingId: string): Promise<void> {
  const result = await startListingCheckout(listingId);
  if ("error" in result) throw new PaymentError(result.error);
  window.location.assign(result.url);
}
