"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, Loader2, MoreVertical, Pause, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useUserListings } from "@/hooks/use-listings";
import { deleteListing, setListingStatus } from "@/lib/store/listings";
import { PaymentError, goToCheckout } from "@/lib/store/payments";
import { LISTING_FEE_RAND } from "@/lib/payments";
import type { Vehicle } from "@/lib/types";
import { formatCurrency, formatMileage } from "@/lib/format";
import { VehicleMedia } from "@/components/vehicle-media";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STATUS_STYLES: Record<string, string> = {
  pending_payment: "bg-orange-100 text-orange-700",
  active: "bg-green-100 text-green-700",
  paused: "bg-amber-100 text-amber-700",
  sold: "bg-slate-200 text-slate-700",
  draft: "bg-blue-100 text-blue-700",
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "awaiting payment",
};

/**
 * Shows the result of a Paystack checkout once, then tidies the URL. Paystack
 * returns the seller to /api/paystack/callback, which redirects here with
 * `?payment=success|failed|pending`.
 */
function PaymentOutcomeToast({ onPaid }: { onPaid: () => void }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const outcome = searchParams.get("payment");
  const shown = useRef(false);

  useEffect(() => {
    if (!outcome || shown.current) return;
    shown.current = true;
    if (outcome === "success") {
      toast.success("Payment received. Your listing is live!");
      onPaid();
    } else if (outcome === "pending") {
      toast.info("We're still confirming your payment. Your listing will go live shortly.");
    } else {
      toast.error("Your payment didn't go through. You can try again from your listing.");
    }
    router.replace("/dashboard");
  }, [outcome, onPaid, router]);

  return null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { listings, loading, error, reload } = useUserListings(user?.id);
  const [payingId, setPayingId] = useState<string | null>(null);

  const activeCount = listings.filter((l) => l.status === "active").length;
  const totalValue = listings
    .filter((l) => l.status === "active")
    .reduce((sum, l) => sum + l.price, 0);

  async function handleToggleStatus(listing: Vehicle) {
    const pausing = listing.status === "active";
    try {
      await setListingStatus(listing.id, pausing ? "paused" : "active");
      await reload();
      toast.success(pausing ? "Listing paused." : "Listing reactivated.");
    } catch {
      toast.error("Couldn't update the listing. Please try again.");
    }
  }

  async function handlePay(listing: Vehicle) {
    setPayingId(listing.id);
    try {
      await goToCheckout(listing.id);
    } catch (err) {
      toast.error(
        err instanceof PaymentError ? err.message : "Couldn't start the payment. Please try again.",
      );
      setPayingId(null);
    }
  }

  async function handleDelete(listing: Vehicle) {
    if (!window.confirm(`Delete your ${listing.year} ${listing.make} ${listing.model} listing? This can't be undone.`)) {
      return;
    }
    try {
      await deleteListing(listing);
      await reload();
      toast.success("Listing deleted.");
    } catch {
      toast.error("Couldn't delete the listing. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={null}>
        <PaymentOutcomeToast onPaid={reload} />
      </Suspense>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back{user ? `, ${user.name}` : ""}
          </h1>
          <p className="text-muted-foreground">Manage your vehicle listings.</p>
        </div>
        <Button
          className="rounded-full bg-primary hover:bg-primary/90"
          render={
            <Link href="/dashboard/listings/new">
              <Plus className="h-4 w-4" />
              Create New Listing
            </Link>
          }
        />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-2xl font-semibold tracking-tight">{listings.length}</p>
          <p className="text-xs text-muted-foreground uppercase">Total Listings</p>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-2xl font-semibold tracking-tight">{activeCount}</p>
          <p className="text-xs text-muted-foreground uppercase">Active Listings</p>
        </div>
        <div className="col-span-2 rounded-2xl border bg-card p-5 sm:col-span-1">
          <p className="text-2xl font-semibold tracking-tight text-primary">
            {formatCurrency(totalValue)}
          </p>
          <p className="text-xs text-muted-foreground uppercase">Active Listing Value</p>
        </div>
      </div>

      <h2 className="mt-10 text-lg font-semibold">Your Listings</h2>

      {loading ? (
        <div className="mt-4 flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <p className="font-semibold">We couldn&apos;t load your listings</p>
          <Button variant="outline" className="rounded-full" onClick={() => void reload()}>
            Try again
          </Button>
        </div>
      ) : listings.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <p className="font-semibold">You haven&apos;t listed a vehicle yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Create your first listing and start reaching buyers today.
          </p>
          <Button
            className="mt-2 rounded-full bg-primary hover:bg-primary/90"
            render={
              <Link href="/dashboard/listings/new">
                <Plus className="h-4 w-4" />
                Create New Listing
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center"
            >
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg">
                <VehicleMedia vehicle={listing} sizes="112px" compact />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">
                    {listing.year} {listing.make} {listing.model} {listing.variant}
                  </p>
                  <Badge className={STATUS_STYLES[listing.status]} variant="secondary">
                    {STATUS_LABELS[listing.status] ?? listing.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(listing.price)} · {formatMileage(listing.mileage)} ·{" "}
                  {listing.town}, {listing.province}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {listing.status === "pending_payment" && (
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                    disabled={payingId !== null}
                    onClick={() => void handlePay(listing)}
                  >
                    {payingId === listing.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CreditCard className="h-3.5 w-3.5" />
                    )}
                    Pay R{LISTING_FEE_RAND}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <Link href={`/dashboard/listings/${listing.id}/edit`}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                  }
                />
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="outline" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end">
                    {listing.status !== "pending_payment" && (
                      <DropdownMenuItem onClick={() => void handleToggleStatus(listing)}>
                        {listing.status === "active" ? (
                          <>
                            <Pause className="h-4 w-4" /> Pause Listing
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" /> Reactivate Listing
                          </>
                        )}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => void handleDelete(listing)}
                    >
                      <Trash2 className="h-4 w-4" /> Delete Listing
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
