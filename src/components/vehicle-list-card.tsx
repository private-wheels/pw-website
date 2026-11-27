"use client";

import { useState } from "react";
import Link from "next/link";
import { Camera, Check, MapPin, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { Vehicle } from "@/lib/types";
import type { PriceRating } from "@/lib/filter";
import { formatCurrency, formatMileage } from "@/lib/format";
import { VehicleMedia } from "@/components/vehicle-media";
import { cn } from "@/lib/utils";

const THUMB_COUNT = 6;

const RATING_LABEL: Record<Exclude<PriceRating, null>, string> = {
  great: "Great price",
  fair: "Fair price",
};

/**
 * Wide, list-style vehicle card for the PLP: main image + details side by
 * side, with a full-width thumbnail strip along the bottom. One per row.
 */
export function VehicleListCard({
  vehicle,
  priceRating = null,
  eager = false,
}: {
  vehicle: Vehicle;
  priceRating?: PriceRating;
  /** Load the main photo straight away (for the cards visible as the page opens). */
  eager?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    const url = `${window.location.origin}/cars/${vehicle.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Listing link copied — paste it anywhere to share.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link. Try again.");
    }
  }

  const specs = [
    vehicle.condition,
    formatMileage(vehicle.mileage),
    vehicle.transmission,
    vehicle.fuelType,
  ];

  const photoCount = vehicle.images.length || THUMB_COUNT;

  return (
    <Link
      href={`/cars/${vehicle.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-capsule"
    >
      <div className="grid sm:grid-cols-[minmax(0,380px)_1fr] lg:grid-cols-[minmax(0,440px)_1fr]">
        {/* Media */}
        <div className="relative aspect-[16/11] overflow-hidden sm:aspect-auto">
          <VehicleMedia
            vehicle={vehicle}
            sizes="(min-width: 1024px) 440px, (min-width: 640px) 380px, 100vw"
            eager={eager}
          />

          <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">
            <Camera className="h-3.5 w-3.5" />
            {photoCount}
          </span>

          <button
            type="button"
            aria-label="Copy link to this listing"
            onClick={handleShare}
            className="shadow-pill absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-card/90 transition-colors hover:bg-card"
          >
            {copied ? (
              <Check className="h-4 w-4 text-primary" strokeWidth={2} />
            ) : (
              <Share2 className="h-4 w-4 text-foreground" strokeWidth={2} />
            )}
          </button>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-3 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-2xl font-semibold tracking-tight">
              {formatCurrency(vehicle.price)}
            </p>
            {priceRating && (
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  priceRating === "great"
                    ? "bg-emerald-600 text-white"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {RATING_LABEL[priceRating]}
              </span>
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium tracking-tight">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h3>
            <p className="text-sm text-muted-foreground">{vehicle.variant}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {specs.map((s) => (
              <span
                key={s}
                className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
              >
                {s}
              </span>
            ))}
          </div>

          <div className="mt-auto border-t pt-3">
            <p className="text-sm font-semibold">{vehicle.sellerName}</p>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              Private seller · {vehicle.town}, {vehicle.province}
            </p>
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="hidden grid-cols-6 gap-2 border-t p-3 sm:grid">
        {Array.from({ length: THUMB_COUNT }).map((_, i) => (
          <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-md">
            <VehicleMedia
              vehicle={vehicle}
              index={i}
              sizes="120px"
              compact
            />
          </div>
        ))}
      </div>
    </Link>
  );
}
