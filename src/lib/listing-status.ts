import type { ListingStatus } from "@/lib/types";

/** How each listing status reads and looks, for sellers and admins alike. */
export const STATUS_LABELS: Record<ListingStatus, string> = {
  pending_payment: "Awaiting payment",
  pending_review: "In review",
  changes_requested: "Changes requested",
  active: "Live",
  paused: "Paused",
  sold: "Sold",
  rejected: "Rejected",
  draft: "Draft",
};

export const STATUS_STYLES: Record<ListingStatus, string> = {
  pending_payment: "bg-orange-100 text-orange-700",
  pending_review: "bg-violet-100 text-violet-700",
  changes_requested: "bg-amber-100 text-amber-800",
  active: "bg-green-100 text-green-700",
  paused: "bg-amber-100 text-amber-700",
  sold: "bg-slate-200 text-slate-700",
  rejected: "bg-red-100 text-red-700",
  draft: "bg-blue-100 text-blue-700",
};

export const PAYMENT_STATUS_STYLES: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  success: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  abandoned: "bg-slate-100 text-slate-500",
  refund_pending: "bg-amber-100 text-amber-800",
  refunded: "bg-blue-100 text-blue-700",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status as ListingStatus] ?? status;
}
