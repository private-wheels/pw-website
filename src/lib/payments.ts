/**
 * Listing fee, shared by the client (to show it) and the server (to charge
 * it). Paystack takes amounts in the currency's smallest unit — cents for ZAR.
 *
 * Founding sellers who pay before launch get 50% off. The server decides which
 * price applies (see `getListingFee` / `startListingCheckout`), never the
 * browser.
 */
export const LISTING_FEE_RAND = 249;
export const LISTING_FEE_CENTS = LISTING_FEE_RAND * 100;
export const FOUNDING_FEE_CENTS = 12450;
export const LISTING_FEE_CURRENCY = "ZAR";

export function listingFeeCents(preLaunch: boolean): number {
  return preLaunch ? FOUNDING_FEE_CENTS : LISTING_FEE_CENTS;
}

/** 24900 → "R249", 12450 → "R124.50" */
export function formatFee(cents: number): string {
  const rand = cents / 100;
  return `R${Number.isInteger(rand) ? rand : rand.toFixed(2)}`;
}

export type ListingFee = { cents: number; label: string; founding: boolean };

/** Where Paystack's callback lands the seller, read by the dashboard. */
export type PaymentOutcome = "success" | "failed" | "pending";
