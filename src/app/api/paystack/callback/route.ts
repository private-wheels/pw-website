import { NextResponse, type NextRequest } from "next/server";
import type { PaymentOutcome } from "@/lib/payments";
import { fulfilPayment } from "@/lib/paystack";

/**
 * Where Paystack sends the seller after checkout (`?reference=…`). Confirms
 * the payment with Paystack, then lands them on the dashboard, which shows
 * the outcome. The webhook does the same work in case they never get here.
 */
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference");
  let outcome: PaymentOutcome = "failed";
  let listingId: string | null = null;

  if (reference) {
    try {
      ({ outcome, listingId } = await fulfilPayment(reference));
    } catch (err) {
      console.error("[paystack callback]", err);
      // Paid but not yet confirmed — the webhook will finish the job.
      outcome = "pending";
    }
  }

  const url = new URL("/dashboard", request.nextUrl.origin);
  url.searchParams.set("payment", outcome);
  if (listingId) url.searchParams.set("listing", listingId);
  return NextResponse.redirect(url);
}
