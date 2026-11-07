import {
  fetchBalance,
  listSettlements,
  listTransactions,
  paystackDashboardUrl,
  type PaystackListedTransaction,
} from "@/lib/paystack";
import { listingTitle } from "@/lib/server/listing-emails";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The admin Finance view: money in (listing fees through Paystack) and money
 * out (Smile ID checks), for one month or all time. Our database is the list
 * of record; Paystack adds its fees, payment method and payouts. Smile ID has
 * no billing API, so check costs are estimated from its list price.
 */

/** Smile ID list price for Biometric KYC on a South African ID. */
export const SMILE_CHECK_COST_USD = 1.3;
/** Rough rand value of a dollar, only for the "≈ R" estimates. Update now and then. */
export const APPROX_ZAR_PER_USD = 18;

export const PAYSTACK_DASHBOARD_URL = "https://dashboard.paystack.com";
export const SMILE_PORTAL_URL = "https://portal.usesmileid.com";

/** "2026-11" or "all". */
export type Period = string;

export function currentPeriod(): Period {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" }).slice(0, 7);
}

export function isPeriod(value: string | null | undefined): value is Period {
  return value === "all" || /^\d{4}-(0[1-9]|1[0-2])$/.test(value ?? "");
}

/** The last 12 months, newest first, for the month picker. */
export function recentPeriods(): { value: Period; label: string }[] {
  const [year, month] = currentPeriod().split("-").map(Number);
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(year, month - 1 - i, 1));
    return {
      value: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-ZA", { month: "long", year: "numeric", timeZone: "UTC" }),
    };
  });
}

export function periodLabel(period: Period): string {
  if (period === "all") return "All time";
  const [year, month] = period.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-ZA", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** ISO start (inclusive) and end (exclusive) of a period, in South African time. */
function periodRange(period: Period): { from: string; to: string } {
  if (period === "all") return { from: "2025-01-01T00:00:00+02:00", to: new Date(Date.now() + 86_400_000).toISOString() };
  const [year, month] = period.split("-").map(Number);
  const next = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;
  return { from: `${period}-01T00:00:00+02:00`, to: `${next}-01T00:00:00+02:00` };
}

/** 12345 → "R123.45" */
export function rand(cents: number): string {
  return `R${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function usd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export type FinancePayment = {
  id: string;
  reference: string;
  paidAt: string;
  status: string;
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string;
  listingId: string | null;
  listingTitle: string;
  amountCents: number;
  /** Paystack's fee (VAT included); null if Paystack didn't return it. */
  feeCents: number | null;
  method: string;
  refundNote: string;
  paystackUrl: string | null;
};

export type FinanceCheck = {
  id: string;
  submittedAt: string;
  sellerName: string;
  sellerEmail: string;
  outcome: string;
  reason: string;
  reviewDecision: string | null;
  jobId: string;
  costUsd: number;
};

export type FinanceReport = {
  period: Period;
  label: string;
  payments: FinancePayment[];
  checks: FinanceCheck[];
  summary: {
    collectedCents: number;
    refundedCents: number;
    paystackFeesCents: number;
    netCents: number;
    paidOutCents: number | null;
    paystackBalanceCents: number | null;
    checks: number;
    checksCostUsd: number;
    checksCostZarCents: number;
    netAfterChecksCents: number;
  };
  /** Things we couldn't load from Paystack, shown as a note. */
  warnings: string[];
};

const MONEY_STATUSES = ["success", "refund_pending", "refunded"];

function method(tx: PaystackListedTransaction | undefined, fallback: string | null): string {
  const channel = tx?.channel ?? fallback;
  if (!channel) return "—";
  const auth = tx?.authorization;
  if (channel === "card" && auth?.last4) {
    const brand = (auth.brand ?? "").trim();
    return brand ? `Card · ${brand[0].toUpperCase()}${brand.slice(1)} •••• ${auth.last4}` : `Card •••• ${auth.last4}`;
  }
  const names: Record<string, string> = {
    card: "Card",
    bank: "Bank",
    eft: "EFT",
    bank_transfer: "Bank transfer",
    capitec_pay: "Capitec Pay",
    qr: "QR / Scan to Pay",
    apple_pay: "Apple Pay",
    payattitude: "PayAttitude",
  };
  const name = names[channel] ?? channel.replaceAll("_", " ");
  return auth?.bank && channel !== "card" ? `${name} · ${auth.bank}` : name;
}

export async function loadFinanceReport(period: Period): Promise<FinanceReport> {
  const db = createAdminClient();
  const { from, to } = periodRange(period);
  const warnings: string[] = [];

  const [paymentsResult, checksResult, usersResult, profilesResult] = await Promise.all([
    db
      .from("payments")
      .select("*, listings(id, year, make, model, variant)")
      .in("status", MONEY_STATUSES)
      .gte("paid_at", from)
      .lt("paid_at", to)
      .order("paid_at", { ascending: false }),
    db
      .from("identity_verifications")
      .select("*")
      .neq("status", "started")
      .gte("submitted_at", from)
      .lt("submitted_at", to)
      .order("submitted_at", { ascending: false }),
    db.auth.admin.listUsers({ perPage: 1000 }),
    db.from("profiles").select("id, first_name, display_name, phone"),
  ]);
  if (paymentsResult.error) throw new Error(paymentsResult.error.message);
  if (checksResult.error) throw new Error(checksResult.error.message);

  const emailById = new Map((usersResult.data?.users ?? []).map((u) => [u.id, u.email || u.new_email || ""]));
  const profileById = new Map((profilesResult.data ?? []).map((p) => [p.id, p]));
  const personName = (id: string | null) => {
    const p = id ? profileById.get(id) : undefined;
    return p?.display_name || p?.first_name || "";
  };

  // Paystack's side: fees, payment method and the customer's email (which
  // survives the seller deleting their account).
  const configured = Boolean(process.env.PAYSTACK_SECRET_KEY);
  const [transactions, balance, settlements] = configured
    ? await Promise.all([
        listTransactions(from, to).catch((err) => {
          console.error("[finance] transactions", err);
          warnings.push("Couldn't load fees and payment methods from Paystack.");
          return [];
        }),
        fetchBalance().catch((err) => {
          console.error("[finance] balance", err);
          warnings.push("Couldn't load the Paystack balance.");
          return null;
        }),
        listSettlements(from, to).catch((err) => {
          console.error("[finance] settlements", err);
          warnings.push("Couldn't load payouts from Paystack.");
          return null;
        }),
      ])
    : [[], null, null];
  if (!configured) warnings.push("PAYSTACK_SECRET_KEY isn't set, so Paystack fees, payouts and balance are missing.");
  const txByReference = new Map(transactions.map((tx) => [tx.reference, tx]));

  const payments: FinancePayment[] = (paymentsResult.data ?? []).map((p) => {
    const tx = txByReference.get(p.reference);
    const listing = p.listings;
    const transactionId = tx?.id ?? p.paystack_transaction_id;
    return {
      id: p.id,
      reference: p.reference,
      paidAt: p.paid_at ?? p.created_at,
      status: p.status,
      sellerName: personName(p.seller_id) || (p.seller_id ? "" : "Account deleted"),
      sellerEmail: (p.seller_id && emailById.get(p.seller_id)) || tx?.customer?.email || "",
      sellerPhone: (p.seller_id && profileById.get(p.seller_id)?.phone) || "",
      listingId: listing ? p.listing_id : null,
      listingTitle: listing ? listingTitle(listing) : "Listing deleted",
      amountCents: p.amount_cents,
      feeCents: tx?.fees ?? null,
      method: method(tx, p.channel),
      refundNote: p.refund_note,
      paystackUrl: transactionId ? paystackDashboardUrl(transactionId) : null,
    };
  });

  const checks: FinanceCheck[] = (checksResult.data ?? []).map((c) => ({
    id: c.id,
    submittedAt: c.submitted_at ?? c.created_at,
    sellerName: c.user_id ? personName(c.user_id) : "Account deleted",
    sellerEmail: (c.user_id && emailById.get(c.user_id)) || "",
    outcome: c.status,
    reason: c.reason ?? "",
    reviewDecision: c.review_decision,
    jobId: c.job_id ?? "",
    costUsd: SMILE_CHECK_COST_USD,
  }));

  const collectedCents = payments.reduce((sum, p) => sum + p.amountCents, 0);
  const refundedCents = payments.filter((p) => p.status !== "success").reduce((sum, p) => sum + p.amountCents, 0);
  const paystackFeesCents = payments.reduce((sum, p) => sum + (p.feeCents ?? 0), 0);
  const netCents = collectedCents - refundedCents - paystackFeesCents;
  const checksCostUsd = checks.length * SMILE_CHECK_COST_USD;
  const checksCostZarCents = Math.round(checksCostUsd * APPROX_ZAR_PER_USD * 100);

  return {
    period,
    label: periodLabel(period),
    payments,
    checks,
    summary: {
      collectedCents,
      refundedCents,
      paystackFeesCents,
      netCents,
      paidOutCents: settlements
        ? settlements.reduce((sum, s) => sum + (s.effective_amount ?? s.total_amount ?? 0), 0)
        : null,
      paystackBalanceCents: balance ? (balance.find((b) => b.currency === "ZAR")?.balance ?? 0) : null,
      checks: checks.length,
      checksCostUsd,
      checksCostZarCents,
      netAfterChecksCents: netCents - checksCostZarCents,
    },
    warnings,
  };
}

export const OUTCOME_LABELS: Record<string, string> = {
  processing: "Processing",
  clear: "Passed",
  attention: "Flagged",
  block: "Failed",
  error: "Error",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  success: "Paid",
  refund_pending: "Refund pending",
  refunded: "Refunded",
};

/** A CSV cell, quoted when needed and safe from spreadsheet formula injection. */
function cell(value: string | number | null): string {
  let text = value === null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csv(rows: (string | number | null)[][]): string {
  return rows.map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
}

const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg", dateStyle: "short", timeStyle: "short" });

export function paymentsCsv(report: FinanceReport): string {
  return csv([
    ["Date", "Seller", "Email", "Phone", "Listing", "Listing ID", "Amount (R)", "Paystack fee (R)", "Net (R)", "Method", "Status", "Refund note", "Paystack reference"],
    ...report.payments.map((p) => [
      dateTime(p.paidAt),
      p.sellerName,
      p.sellerEmail,
      p.sellerPhone,
      p.listingTitle,
      p.listingId,
      (p.amountCents / 100).toFixed(2),
      p.feeCents === null ? "" : (p.feeCents / 100).toFixed(2),
      p.feeCents === null ? "" : ((p.amountCents - p.feeCents) / 100).toFixed(2),
      p.method,
      PAYMENT_STATUS_LABELS[p.status] ?? p.status,
      p.refundNote,
      p.reference,
    ]),
  ]);
}

export function checksCsv(report: FinanceReport): string {
  return csv([
    ["Date", "Seller", "Email", "Result", "Reason", "Review decision", "Estimated cost (USD)", "Smile ID job ID"],
    ...report.checks.map((c) => [
      dateTime(c.submittedAt),
      c.sellerName,
      c.sellerEmail,
      OUTCOME_LABELS[c.outcome] ?? c.outcome,
      c.reason.replaceAll("_", " "),
      c.reviewDecision ?? "",
      c.costUsd.toFixed(2),
      c.jobId,
    ]),
  ]);
}
