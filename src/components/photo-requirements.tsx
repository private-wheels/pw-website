import { Car, CarFront, Check, Info, Armchair, type LucideIcon } from "lucide-react";
import { MIN_PHOTOS, REQUIRED_PHOTOS } from "@/lib/listing-photos";
import { cn } from "@/lib/utils";

const ICONS: Record<(typeof REQUIRED_PHOTOS)[number]["key"], LucideIcon> = {
  front: CarFront,
  back: CarFront,
  side: Car,
  inside: Armchair,
};

/**
 * The shots every listing needs, shown above the photo uploader, with how
 * many photos are in so far and what happens in review if one is missing.
 */
export function PhotoRequirements({ count }: { count: number }) {
  const enough = count >= MIN_PHOTOS;
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-muted/40 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold">Required photos</p>
        <p className={cn("text-xs font-medium", enough ? "text-green-700" : "text-muted-foreground")}>
          {enough ? (
            <span className="inline-flex items-center gap-1">
              <Check className="h-3.5 w-3.5" />
              {count} photos added
            </span>
          ) : (
            `${count} of at least ${MIN_PHOTOS} added`
          )}
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {REQUIRED_PHOTOS.map(({ key, label, hint }) => {
          const Icon = ICONS[key];
          return (
            <li key={key} className="flex flex-col gap-1 rounded-lg border bg-card p-3">
              <Icon className="h-5 w-5 text-primary" />
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs leading-snug text-muted-foreground">{hint}</p>
            </li>
          );
        })}
      </ul>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Add more if you like: the engine, the odometer, the tyres and any damage. Our team checks every listing
          before it goes live. If any of the required photos are missing, we&apos;ll ask you for more photos or may
          decline the listing.
        </span>
      </p>
    </div>
  );
}
