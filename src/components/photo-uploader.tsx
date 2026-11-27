"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Armchair, Car, CarFront, Check, ImagePlus, Info, Loader2, Star, X, type LucideIcon } from "lucide-react";
import { MAX_PHOTOS, PHOTO_ACCEPT, PhotoUploadError, uploadListingPhoto } from "@/lib/storage";
import {
  REQUIRED_PHOTOS,
  coverOf,
  missingViews,
  sortPhotos,
  type ListingPhoto,
  type PhotoView,
  type RequiredView,
} from "@/lib/listing-photos";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Photos processed and uploaded at once. Each one is decoded at full size
 * in memory first, so a phone choosing 20 photos would otherwise run out. */
const UPLOAD_CONCURRENCY = 3;

const VIEW_ICONS: Record<RequiredView, LucideIcon> = {
  front: CarFront,
  back: CarFront,
  side: Car,
  inside: Armchair,
};

/**
 * Listing photos for the wizard: one labelled slot per required view (front,
 * back, side, inside), then any number of other photos. Each upload is tagged
 * with its slot's view, which shows on the listing. Files upload to Supabase
 * Storage as they're chosen; removing one is reported via `onRemove` so the
 * wizard decides when the stored file is deleted. Each photo has a chip to
 * make it the cover; until the seller picks one, the front photo is the cover.
 */
export function PhotoUploader({
  userId,
  photos,
  onChange,
  onRemove,
  coverUrl,
  onCoverChange,
}: {
  userId: string;
  photos: ListingPhoto[];
  /** The chosen cover, or null for the front photo. */
  coverUrl: string | null;
  onCoverChange: (url: string) => void;
  /** Receives an updater, since uploads finish one by one. */
  onChange: (update: (photos: ListingPhoto[]) => ListingPhoto[]) => void;
  onRemove: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Which slot the file picker is open for.
  const target = useRef<PhotoView>("other");
  const [uploadingViews, setUploadingViews] = useState<RequiredView[]>([]);
  const [uploadingOthers, setUploadingOthers] = useState(0);
  // The latest photos, for uploads that finish after a re-render.
  const latest = useRef(photos);
  useEffect(() => {
    latest.current = photos;
  });
  // Local copies of photos uploaded in this session, shown straight away
  // instead of waiting for the hosted copy to be resized on first view.
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const previewUrls = useRef<string[]>([]);
  useEffect(() => () => previewUrls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  function thumbnail(photo: ListingPhoto, alt: string) {
    const local = previews[photo.url];
    return (
      <Image
        src={local ?? photo.url}
        alt={alt}
        fill
        sizes="200px"
        unoptimized={Boolean(local)}
        className="object-cover"
      />
    );
  }

  const byView = (view: RequiredView) => photos.find((p) => p.view === view);
  const others = photos.filter((p) => p.view === "other");
  const room = MAX_PHOTOS - photos.length - uploadingViews.length - uploadingOthers;
  const missing = missingViews(photos.map((p) => p.view));
  const cover = coverOf(photos, coverUrl);

  function coverChip(photo: ListingPhoto) {
    const isCover = photo.url === cover;
    return (
      <button
        type="button"
        onClick={() => onCoverChange(photo.url)}
        disabled={isCover}
        aria-pressed={isCover}
        className={cn(
          "absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-sm transition-colors",
          isCover ? "bg-primary text-primary-foreground" : "bg-card/90 text-foreground hover:bg-card",
        )}
      >
        <Star className={cn("h-3 w-3", isCover && "fill-current")} />
        {isCover ? "Cover" : "Set as cover"}
      </button>
    );
  }

  function pick(view: PhotoView) {
    target.current = view;
    if (!inputRef.current) return;
    inputRef.current.multiple = view === "other";
    inputRef.current.click();
  }

  async function upload(file: File, view: PhotoView): Promise<void> {
    try {
      const { url, blob } = await uploadListingPhoto(file, userId);
      const local = URL.createObjectURL(blob);
      previewUrls.current.push(local);
      setPreviews((p) => ({ ...p, [url]: local }));
      // A required slot holds one photo: a newer one replaces it.
      const replaced = view === "other" ? undefined : latest.current.find((p) => p.view === view);
      if (replaced) onRemove(replaced.url);
      onChange((current) =>
        sortPhotos([...current.filter((p) => p.url !== replaced?.url), { url, view }]),
      );
    } catch (err) {
      toast.error(err instanceof PhotoUploadError ? err.message : `${file.name} couldn't be uploaded.`);
    }
  }

  async function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (inputRef.current) inputRef.current.value = "";
    const view = target.current;
    if (files.length === 0) return;

    if (view !== "other") {
      setUploadingViews((v) => [...v, view]);
      await upload(files[0], view);
      setUploadingViews((v) => v.filter((x) => x !== view));
      return;
    }

    if (room <= 0) {
      toast.error(`You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }
    const batch = files.slice(0, room);
    if (batch.length < files.length) {
      toast.error(`Only the first ${batch.length} photos were added. The limit is ${MAX_PHOTOS}.`);
    }
    setUploadingOthers((n) => n + batch.length);
    const queue = [...batch];
    await Promise.all(
      Array.from({ length: Math.min(UPLOAD_CONCURRENCY, queue.length) }, async () => {
        for (let file = queue.shift(); file; file = queue.shift()) {
          await upload(file, "other");
          setUploadingOthers((n) => n - 1);
        }
      }),
    );
  }

  function remove(photo: ListingPhoto) {
    onChange((current) => current.filter((p) => p.url !== photo.url));
    onRemove(photo.url);
  }

  return (
    <div className="flex flex-col gap-6">
      <input
        ref={inputRef}
        type="file"
        accept={PHOTO_ACCEPT}
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">Required photos</p>
          <p className={cn("text-xs font-medium", missing.length === 0 ? "text-green-700" : "text-muted-foreground")}>
            {missing.length === 0 ? (
              <span className="inline-flex items-center gap-1">
                <Check className="h-3.5 w-3.5" />
                All 4 added
              </span>
            ) : (
              `${REQUIRED_PHOTOS.length - missing.length} of ${REQUIRED_PHOTOS.length} added`
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {REQUIRED_PHOTOS.map(({ key, label, hint }) => {
            const photo = byView(key);
            const Icon = VIEW_ICONS[key];
            if (uploadingViews.includes(key)) {
              return (
                <div key={key} className="flex aspect-[4/3] items-center justify-center rounded-lg border bg-muted">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              );
            }
            if (photo) {
              return (
                <div key={key} className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
                  {thumbnail(photo, `${label} photo`)}
                  <span className="absolute top-2 left-2 rounded-full bg-card px-2 py-0.5 text-[11px] font-bold shadow-sm">
                    {label}
                  </span>
                  {coverChip(photo)}
                  <button
                    type="button"
                    onClick={() => remove(photo)}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-card/90 shadow-sm hover:bg-card"
                    aria-label={`Remove the ${label.toLowerCase()} photo`}
                    title="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            }
            return (
              <button
                key={key}
                type="button"
                onClick={() => pick(key)}
                className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-2 text-center transition-colors hover:border-foreground/30 hover:bg-muted/40"
              >
                <Icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-[11px] leading-snug text-muted-foreground">{hint}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">More photos (optional)</p>
            <p className="text-xs text-muted-foreground">The engine, the odometer, the tyres, any damage: anything buyers would want to see.</p>
          </div>
          {others.length + uploadingOthers > 0 && room > 0 && (
            <Button type="button" variant="outline" className="rounded-full" onClick={() => pick("other")}>
              <ImagePlus className="h-4 w-4" />
              Add photos
            </Button>
          )}
        </div>

        {others.length + uploadingOthers === 0 ? (
          <button
            type="button"
            onClick={() => pick("other")}
            disabled={room <= 0}
            className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed py-6 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted/40"
          >
            <ImagePlus className="h-4 w-4" />
            Add more photos
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {others.map((photo, i) => (
              <div key={photo.url} className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
                {thumbnail(photo, `Extra photo ${i + 1}`)}
                {coverChip(photo)}
                <button
                  type="button"
                  onClick={() => remove(photo)}
                  className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-card/90 shadow-sm hover:bg-card"
                  aria-label={`Remove extra photo ${i + 1}`}
                  title="Remove photo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {Array.from({ length: uploadingOthers }, (_, i) => (
              <div key={`uploading-${i}`} className="flex aspect-[4/3] items-center justify-center rounded-lg border bg-muted">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {photos.length} of {MAX_PHOTOS} photos · JPEG, PNG or WebP
        </p>
      </section>

      <p className="flex items-start gap-2 rounded-xl border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Our team checks every listing before it goes live. If any of the required photos are missing or don&apos;t
          show what they should, we&apos;ll ask you for more photos or may decline the listing.
        </span>
      </p>
    </div>
  );
}
