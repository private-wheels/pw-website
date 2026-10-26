/**
 * Listing fee, shared by the client (to show it) and the server (to charge
 * it). Paystack takes amounts in the currency's smallest unit — cents for ZAR.
 */
export const LISTING_FEE_RAND = 249;
export const LISTING_FEE_CENTS = LISTING_FEE_RAND * 100;
export const LISTING_FEE_CURRENCY = "ZAR";

/** Where Paystack's callback lands the seller, read by the dashboard. */
export type PaymentOutcome = "success" | "failed" | "pending";
