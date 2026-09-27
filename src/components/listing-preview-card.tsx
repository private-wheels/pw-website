import Image from "next/image";
import { Check, Fuel, Gauge, MapPin, Settings2 } from "lucide-react";
import type { FormState } from "@/components/listing-wizard";
import { BrandIcon } from "@/components/brand-mark";
import { formatCurrency, formatMileage } from "@/lib/format";
import { VehiclePlaceholder } from "@/components/vehicle-placeholder";
import { cn } from "@/lib/utils";

const MAX_VISIBLE_FEATURES = 4;

/**
 * Live "how buyers will see it" preview for the listing wizard — mirrors the
 * PDP/VehicleCard visual language but reads straight off the in-progress
 * FormState, filling itself in field by field with muted placeholders for
 * whatever hasn't been entered yet.
 */
export function ListingPreviewCard({ form }: { form: FormState }) {
  const hasAnything =
    form.make ||
    form.model ||
    form.year ||
    form.bodyType ||
    form.province ||
    form.town ||
    form.mileage ||
    form.transmission ||
    form.fuelType ||
    form.condition ||
    form.colour ||
    form.price ||
    form.description ||
    form.features.length > 0 ||
    form.images.length > 0;

  if (!hasAnything) {
    return (
      <div className="shadow-capsule rounded-xl border bg-card px-6 py-9 text-center">
        <BrandIcon className="mx-auto h-11 w-11 text-[#c7c7c7]" />
        <h3 className="mt-3.5 text-sm font-semibold">Your listing preview</h3>
        <p className="mx-auto mt-1.5 max-w-[24ch] text-xs leading-relaxed text-muted-foreground">
          Start filling in the details on the left — this card fills itself in as you go.
        </p>
      </div>
    );
  }

  const titleParts = [form.model, form.variant].filter(Boolean).join(" ");
  const kicker = [form.year, form.make].filter(Boolean).join(" ");
  const location = [form.town, form.province].filter(Boolean).join(", ");
  const shownFeatures = form.features.slice(0, MAX_VISIBLE_FEATURES);
  const extraFeatures = form.features.length - shownFeatures.length;
  const hasSpecs = Boolean(form.mileage || form.fuelType || form.transmission);

  return (
    <div className="shadow-capsule overflow-hidden rounded-xl border bg-card">
      <div className="relative aspect-[16/10]">
        {form.images[0] ? (
          <Image
            src={form.images[0]}
            alt="Cover photo"
            fill
            sizes="320px"
            className="object-cover"
          />
        ) : (
          <VehiclePlaceholder seed={`${form.make}-${form.model}` || "preview"} />
        )}
        {form.condition && (
          <span className="shadow-pill absolute top-2.5 left-2.5 rounded-full bg-card px-2.5 py-1 text-[10.5px] font-bold">
            {form.condition}
          </span>
        )}
      </div>

      <div className="p-4">
        <p
          className={cn(
            "text-[11.5px] text-muted-foreground",
            !kicker && "italic",
          )}
        >
          {kicker || "Year & make"}
        </p>
        <h3
          className={cn(
            "mt-0.5 text-[16.5px] font-semibold tracking-tight",
            !titleParts && "font-medium text-muted-foreground italic",
          )}
        >
          {titleParts || "Add a model to see your title"}
        </h3>

        {location && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            {location}
          </p>
        )}

        <div className="mt-3 rounded-lg bg-muted p-3">
          {form.price ? (
            <p className="text-xl font-bold tracking-tight tabular-nums">
              {formatCurrency(Number(form.price))}
            </p>
          ) : (
            <p className="text-[13px] font-medium text-muted-foreground italic">
              Add a price to preview it here
            </p>
          )}
          <p className="mt-0.5 text-[10.5px] text-muted-foreground">Incl. VAT / Excl. Finance</p>
        </div>

        {hasSpecs ? (
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[11.5px]">
            {form.mileage && (
              <span className="flex items-center gap-1">
                <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                {formatMileage(Number(form.mileage))}
              </span>
            )}
            {form.fuelType && (
              <span className="flex items-center gap-1">
                <Fuel className="h-3.5 w-3.5 text-muted-foreground" />
                {form.fuelType}
              </span>
            )}
            {form.transmission && (
              <span className="flex items-center gap-1">
                <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                {form.transmission}
              </span>
            )}
          </div>
        ) : (
          <p className="mt-3 text-[11.5px] text-muted-foreground italic">
            Mileage, transmission and fuel type will show up here.
          </p>
        )}

        {form.features.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {shownFeatures.map((f) => (
              <span
                key={f}
                className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10.5px] font-medium"
              >
                <Check className="h-2.5 w-2.5 text-primary" />
                {f}
              </span>
            ))}
            {extraFeatures > 0 && (
              <span className="rounded-full bg-border px-2.5 py-1 text-[10.5px] font-bold">
                +{extraFeatures}
              </span>
            )}
          </div>
        )}

        <p
          className={cn(
            "mt-3 border-t pt-3 text-xs leading-relaxed",
            form.description ? "text-foreground" : "text-muted-foreground italic",
          )}
        >
          {form.description || "Add a description to tell buyers more about this vehicle."}
        </p>
      </div>
    </div>
  );
}
