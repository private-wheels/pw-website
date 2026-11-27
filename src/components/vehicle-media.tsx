import Image from "next/image";
import type { Vehicle } from "@/lib/types";
import { VehiclePlaceholder } from "@/components/vehicle-placeholder";
import { cn } from "@/lib/utils";

/**
 * A single vehicle photo at `index`, or the generated placeholder when the
 * listing has no photo (or no photo at that slot). Fills its positioned
 * parent — wrap in a `relative` box with an aspect ratio.
 *
 * Photos lazy-load by default. Pass `eager` for photos visible as the page
 * opens (the first listing cards), and `preload` for the page's main photo.
 * A muted background shows while a photo loads, so the slot never looks empty.
 */
export function VehicleMedia({
  vehicle,
  index = 0,
  sizes,
  className = "object-cover",
  eager = false,
  preload = false,
  compact = false,
}: {
  vehicle: Pick<Vehicle, "id" | "images" | "year" | "make" | "model">;
  index?: number;
  sizes?: string;
  className?: string;
  eager?: boolean;
  preload?: boolean;
  compact?: boolean;
}) {
  const src = vehicle.images[index];
  if (!src) {
    return <VehiclePlaceholder seed={`${vehicle.id}-${index}`} compact={compact} />;
  }

  return (
    <Image
      src={src}
      alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
      fill
      sizes={sizes ?? "(min-width: 1024px) 33vw, 100vw"}
      className={cn("bg-muted", className)}
      {...(preload
        ? { preload: true }
        : eager
          ? { loading: "eager" as const, fetchPriority: "high" as const }
          : {})}
    />
  );
}
