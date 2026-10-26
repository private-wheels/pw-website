import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { LISTING_FEE_CURRENCY, type PaymentOutcome } from "@/lib/payments";
import { createAdminClient } from "@/lib/supabase/admin";
import { LISTINGS_TAG } from "@/lib/supabase/server";

/**
 * Paystack (https://paystack.com/docs/api) — server only. Sellers pay the
 * listing fee on Paystack's hosted checkout; we never see card details.
 *
 *   1. startListingCheckout (server action) records a pending payment and
 *      gets a checkout URL from `initializeTransaction`.
 *   2. Paystack sends the seller back to /api/paystack/callback and, separately,
 *      posts `charge.success` to /api/paystack/webhook. Both call
 *      `fulfilPayment`, which re-checks the transaction with Paystack before
 *      activating the listing, so a forged callback or replayed webhook can't
 *      publish an unpaid listing. Running it twice is harmless.
 */

const API = "https://api.paystack.co";

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set.");
  return key;
}

async function paystack<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => null)) as
    | { status: boolean; message: string; data: T }
    | null;
  if (!res.ok || !body?.status) {
    throw new Error(`Paystack ${path} failed: ${body?.message ?? res.status}`);
  }
  return body.data;
}

export async function initializeTransaction(params: {
  email: string;
  amountCents: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}): Promise<{ authorization_url: string; access_code: string; reference: string }> {
  return paystack("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      amount: params.amountCents,
      currency: LISTING_FEE_CURRENCY,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });
}

type PaystackTransaction = {
  id: number;
  status: string; // success | failed | abandoned | ongoing | pending | processing | queued | reversed
  reference: string;
  amount: number;
  currency: string;
  channel: string | null;
  paid_at: string | null;
};

function verifyTransaction(reference: string): Promise<PaystackTransaction> {
  return paystack(`/transaction/verify/${encodeURIComponent(reference)}`);
}

/** Webhooks are signed with HMAC-SHA512 of the raw body, keyed by the secret key. */
export function isValidWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = createHmac("sha512", secretKey()).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Checks a payment with Paystack and, if it succeeded for the right amount,
 * marks it paid and makes its listing public. Idempotent.
 */
export async function fulfilPayment(
  reference: string,
): Promise<{ outcome: PaymentOutcome; listingId: string | null }> {
  const db = createAdminClient();

  const { data: payment, error } = await db
    .from("payments")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!payment) return { outcome: "failed", listingId: null };
  if (payment.status === "success") return { outcome: "success", listingId: payment.listing_id };

  const tx = await verifyTransaction(reference);

  if (tx.status === "failed" || tx.status === "abandoned" || tx.status === "reversed") {
    await db
      .from("payments")
      .update({ status: tx.status === "abandoned" ? "abandoned" : "failed" })
      .eq("id", payment.id)
      .eq("status", "pending");
    return { outcome: "failed", listingId: payment.listing_id };
  }
  if (tx.status !== "success") return { outcome: "pending", listingId: payment.listing_id };

  if (tx.amount !== payment.amount_cents || tx.currency !== payment.currency) {
    console.error(
      `[paystack] ${reference}: paid ${tx.amount} ${tx.currency}, expected ${payment.amount_cents} ${payment.currency}`,
    );
    return { outcome: "failed", listingId: payment.listing_id };
  }

  const paidAt = tx.paid_at ?? new Date().toISOString();
  const { error: paymentError } = await db
    .from("payments")
    .update({
      status: "success",
      paid_at: paidAt,
      paystack_transaction_id: tx.id,
      channel: tx.channel,
    })
    .eq("id", payment.id);
  if (paymentError) throw new Error(paymentError.message);

  if (payment.listing_id) {
    const { error: listingError } = await db
      .from("listings")
      .update({ paid_at: paidAt, status: "active" })
      .eq("id", payment.listing_id)
      .is("paid_at", null);
    if (listingError) throw new Error(listingError.message);
    revalidateTag(LISTINGS_TAG, { expire: 0 });
  }

  return { outcome: "success", listingId: payment.listing_id };
}
