import type { NextRequest } from "next/server";
import { fulfilPayment, isValidWebhookSignature, recordRefundOutcome } from "@/lib/paystack";

/**
 * Paystack webhook — set this URL under Settings → API Keys & Webhooks in the
 * Paystack dashboard. Handles `charge.success` and the refund outcomes;
 * anything else is acknowledged and ignored. A non-2xx response makes Paystack retry, so we
 * only return one when fulfilling actually failed.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!isValidWebhookSignature(rawBody, request.headers.get("x-paystack-signature"))) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(rawBody) as {
    event: string;
    data?: {
      reference?: string;
      transaction_reference?: string;
      transaction?: { reference?: string };
    };
  };

  try {
    if (event.event === "charge.success" && event.data?.reference) {
      await fulfilPayment(event.data.reference);
    } else if (event.event === "refund.processed" || event.event === "refund.failed") {
      const reference = event.data?.transaction_reference ?? event.data?.transaction?.reference;
      if (reference) await recordRefundOutcome(reference, event.event === "refund.processed");
    }
  } catch (err) {
    console.error("[paystack webhook]", err);
    return new Response("Couldn't record event", { status: 500 });
  }

  return new Response(null, { status: 200 });
}
