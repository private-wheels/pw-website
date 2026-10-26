import type { NextRequest } from "next/server";
import { fulfilPayment, isValidWebhookSignature } from "@/lib/paystack";

/**
 * Paystack webhook — set this URL under Settings → API Keys & Webhooks in the
 * Paystack dashboard. Only `charge.success` matters; anything else is
 * acknowledged and ignored. A non-2xx response makes Paystack retry, so we
 * only return one when fulfilling actually failed.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!isValidWebhookSignature(rawBody, request.headers.get("x-paystack-signature"))) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(rawBody) as { event: string; data?: { reference?: string } };
  if (event.event === "charge.success" && event.data?.reference) {
    try {
      await fulfilPayment(event.data.reference);
    } catch (err) {
      console.error("[paystack webhook]", err);
      return new Response("Couldn't record payment", { status: 500 });
    }
  }

  return new Response(null, { status: 200 });
}
