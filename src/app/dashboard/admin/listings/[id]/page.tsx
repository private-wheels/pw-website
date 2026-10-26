import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdmin } from "@/lib/server/admin";
import { isListingId, rowToVehicle } from "@/lib/listings";
import { isPreLaunch } from "@/lib/email-templates";
import { refundAdvice } from "@/lib/refund-policy";
import { formatCurrency, formatMileage } from "@/lib/format";
import { PAYMENT_STATUS_STYLES, STATUS_STYLES, statusLabel } from "@/lib/listing-status";
import type { ListingStatus } from "@/lib/types";
import { timeAgo } from "@/components/admin/admin-listing-row";
import { ReviewActions } from "@/components/admin/review-actions";
import { VehicleMedia } from "@/components/vehicle-media";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Admin · Review listing" };

function formatDate(iso: string | null): string {
  return iso
    ? new Date(iso).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })
    : "—";
}

export default async function AdminListingPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return null;
  const { id } = await params;
  const db = createAdminClient();

  const { data: row } = isListingId(id)
    ? await db.from("listings").select("*").eq("id", id).maybeSingle()
    : { data: null };
  if (!row) {
    return (
      <div className="py-16 text-center">
        <p className="font-semibold">Listing not found</p>
        <Link href="/dashboard/admin/listings" className="text-sm text-primary underline">
          Back to all listings
        </Link>
      </div>
    );
  }

  const [{ data: payments }, sellerResult, { count: sellerListings }, reviewerResult] = await Promise.all([
    db.from("payments").select("*").eq("listing_id", id).order("created_at", { ascending: false }),
    row.seller_id ? db.auth.admin.getUserById(row.seller_id) : Promise.resolve(null),
    row.seller_id
      ? db.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", row.seller_id)
      : Promise.resolve({ count: 0 }),
    row.reviewed_by ? db.auth.admin.getUserById(row.reviewed_by) : Promise.resolve(null),
  ]);
  const seller = sellerResult?.data.user ?? null;
  const reviewer = reviewerResult?.data.user ?? null;

  const vehicle = rowToVehicle(row);
  const status = row.status as ListingStatus;
  const advice = refundAdvice({
    hasPayment: (payments ?? []).some((p) => p.status === "success"),
    feeWaived: row.fee_waived,
    wasApproved: Boolean(row.approved_at),
    preLaunch: isPreLaunch(),
  });

  const facts: [string, string][] = [
    ["Price", formatCurrency(row.price)],
    ["Mileage", formatMileage(row.mileage)],
    ["Transmission", row.transmission],
    ["Fuel", row.fuel_type],
    ["Body", row.body_type],
    ["Condition", row.condition],
    ["Colour", row.colour || "—"],
    ["Previous owners", String(row.previous_owners)],
    ["Service history", row.service_history],
    ["Accident history", row.accident_history],
    ["Location", `${row.town}, ${row.province}`],
    ["Features", row.features.join(", ") || "—"],
  ];

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard/admin"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Review queue
      </Link>

      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">
                {row.year} {row.make} {row.model} {row.variant}
              </h2>
              <Badge variant="secondary" className={STATUS_STYLES[status]}>
                {statusLabel(status)}
              </Badge>
              {row.fee_waived && <Badge variant="outline">Fee waived</Badge>}
              {!row.seller_id && <Badge variant="outline">Demo</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              Created {formatDate(row.created_at)} · Paid {formatDate(row.paid_at)} · Approved{" "}
              {formatDate(row.approved_at)}
              {row.edited_at && row.approved_at && row.edited_at > row.approved_at
                ? ` · Edited after approval ${timeAgo(row.edited_at)}`
                : ""}
            </p>
          </div>
          {status === "active" && (
            <Link
              href={`/cars/${row.id}`}
              target="_blank"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View public page <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        <ReviewActions listingId={row.id} status={status} advice={advice} />

        {row.review_note && (
          <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-3 text-sm dark:bg-amber-950/30">
            <p className="font-medium">
              Last note to seller{reviewer ? ` (by ${reviewer.email})` : ""}
            </p>
            <p className="mt-1 whitespace-pre-line">{row.review_note}</p>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border bg-card p-5">
            <h3 className="font-semibold">Photos ({row.images.length})</h3>
            {row.images.length ? (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {row.images.map((src, index) => (
                  <a
                    key={src}
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    className="relative aspect-[4/3] overflow-hidden rounded-lg"
                  >
                    <VehicleMedia vehicle={vehicle} index={index} sizes="(max-width: 640px) 50vw, 240px" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-amber-700">No photos. Consider requesting some.</p>
            )}
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <h3 className="font-semibold">Details</h3>
            <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {facts.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-muted-foreground uppercase">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <h4 className="mt-5 text-xs text-muted-foreground uppercase">Description</h4>
            <p className="mt-1 text-sm whitespace-pre-line">{row.description || "—"}</p>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border bg-card p-5 text-sm">
            <h3 className="font-semibold">Seller</h3>
            <dl className="mt-3 flex flex-col gap-2">
              <div>
                <dt className="text-xs text-muted-foreground uppercase">Name on listing</dt>
                <dd className="font-medium">{row.seller_name}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase">Phone on listing</dt>
                <dd className="font-medium">{row.seller_phone || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase">Account email</dt>
                <dd className="font-medium break-all">
                  {seller?.email ? <a href={`mailto:${seller.email}`}>{seller.email}</a> : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase">Member since</dt>
                <dd className="font-medium">{formatDate(seller?.created_at ?? null)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase">Listings on this account</dt>
                <dd className="font-medium">{sellerListings ?? 0}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border bg-card p-5 text-sm">
            <h3 className="font-semibold">Payments</h3>
            {payments?.length ? (
              <ul className="mt-3 flex flex-col gap-3">
                {payments.map((p) => (
                  <li key={p.id} className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">R{(p.amount_cents / 100).toFixed(2)}</span>
                      <Badge variant="secondary" className={PAYMENT_STATUS_STYLES[p.status]}>
                        {p.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(p.paid_at ?? p.created_at)} · {p.channel ?? "—"} · {p.reference}
                    </span>
                    {p.refund_note && <span className="text-xs">Refund note: {p.refund_note}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-muted-foreground">
                {row.fee_waived ? "Fee waived — published by an admin." : "No payments yet."}
              </p>
            )}
            <Link href="/dashboard/admin/refunds" className="mt-4 block text-xs text-primary hover:underline">
              When should I refund? Read the refund guide
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
