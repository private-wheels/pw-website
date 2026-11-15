/**
 * Google Analytics events (through the Google tag, see GoogleTag). Page
 * views are tracked automatically, including client-side navigation (GA4
 * "enhanced measurement"). These are the key steps of selling and buying, so
 * the funnel shows up in GA4 under Reports → Engagement → Events.
 *
 * Never send personal information (names, emails, phone numbers, ID numbers).
 * Without the tag (local dev, previews) calls are a no-op.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export type AnalyticsEvent =
  | "listing_started"
  | "listing_draft_saved"
  | "listing_submitted"
  | "verification_started"
  | "verification_result"
  | "checkout_started"
  | "payment_completed"
  | "sign_up"
  | "login"
  | "enquiry_sent"
  | "seller_number_revealed"
  | "finance_apply_clicked";

export function track(event: AnalyticsEvent, params: Record<string, string | number | boolean> = {}): void {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", event, params);
  } catch {
    // Analytics must never break the page.
  }
}
