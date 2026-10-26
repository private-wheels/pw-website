import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ListingRow } from "@/lib/supabase/database.types";
import { rowToVehicle } from "@/lib/listings";
import { formatCurrency } from "@/lib/format";
import { STATUS_STYLES, statusLabel } from "@/lib/listing-status";
import type { ListingStatus } from "@/lib/types";
import { VehicleMedia } from "@/components/vehicle-media";
import { Badge } from "@/components/ui/badge";

export function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

/** One listing in an admin list, linking to its review page. */
export function AdminListingRow({ row, meta }: { row: ListingRow; meta?: string }) {
  const vehicle = rowToVehicle(row);
  return (
    <Link
      href={`/dashboard/admin/listings/${row.id}`}
      className="flex items-center gap-4 rounded-2xl border bg-card p-3 transition-colors hover:bg-muted/50"
    >
      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg">
        <VehicleMedia vehicle={vehicle} sizes="96px" compact />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold">
            {row.year} {row.make} {row.model} {row.variant}
          </p>
          <Badge variant="secondary" className={STATUS_STYLES[row.status as ListingStatus]}>
            {statusLabel(row.status)}
          </Badge>
          {row.fee_waived && <Badge variant="outline">Fee waived</Badge>}
          {!row.seller_id && <Badge variant="outline">Demo</Badge>}
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {formatCurrency(row.price)} · {row.seller_name} · {row.town}, {row.province}
        </p>
        {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
