"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Camera, ImagePlus, Loader2, Star, X } from "lucide-react";
import { MAX_PHOTOS, PHOTO_ACCEPT, PhotoUploadError, uploadListingPhoto } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Listing photo picker for the wizard. Uploads straight to Supabase Storage as
 * files are chosen and reports the resulting public URLs; the first photo is
 * the cover. Removing a photo is reported via `onRemove` so the wizard decides
 * when the stored file is deleted.
 */
export function PhotoUploader({
  userId,
  images,
  onChange,
  onRemove,
}: {
  userId: string;
  images: string[];
  /** Receives an updater, since uploads finish one by one. */
  onChange: (update: (images: string[]) => string[]) => void;
  onRemove: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);

  async function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (inputRef.current) inputRef.current.value = "";
    if (files.length === 0) return;

    const room = MAX_PHOTOS - images.length - uploading;
    if (room <= 0) {
      toast.error(`You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }
    const batch = files.slice(0, room);
    if (batch.length < files.length) {
      toast.error(`Only the first ${batch.length} photos were added — the limit is ${MAX_PHOTOS}.`);
    }

    setUploading((n) => n + batch.length);
    await Promise.all(
      batch.map(async (file) => {
        try {
          const url = await uploadListingPhoto(file, userId);
          onChange((current) => [...current, url]);
        } catch (err) {
          toast.error(
            err instanceof PhotoUploadError ? err.message : `${file.name} couldn't be uploaded.`,
          );
        } finally {
          setUploading((n) => n - 1);
        }
      }),
    );
  }

  function remove(url: string) {
    onChange((current) => current.filter((u) => u !== url));
    onRemove(url);
  }

  function makeCover(url: string) {
    onChange((current) => [url, ...current.filter((u) => u !== url)]);
  }

  const canAddMore = images.length + uploading < MAX_PHOTOS;

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={inputRef}
        type="file"
        accept={PHOTO_ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {images.length === 0 && uploading === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed py-16 text-center transition-colors hover:border-foreground/30 hover:bg-muted/40"
        >
          <Camera className="h-10 w-10 text-muted-foreground" strokeWidth={1.25} />
          <p className="font-semibold">Add photos of your car</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Listings with clear photos sell faster. Add up to {MAX_PHOTOS} JPEG, PNG or WebP
            photos — the first one is your cover photo.
          </p>
        </button>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((url, i) => (
              <div key={url} className="group relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
                <Image src={url} alt={`Photo ${i + 1}`} fill sizes="240px" className="object-cover" />
                {i === 0 && (
                  <span className="absolute top-2 left-2 rounded-full bg-card px-2 py-0.5 text-[11px] font-bold shadow-sm">
                    Cover
                  </span>
                )}
                <div className="absolute top-2 right-2 flex gap-1.5">
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => makeCover(url)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-card/90 shadow-sm hover:bg-card"
                      aria-label={`Make photo ${i + 1} the cover`}
                      title="Make cover photo"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(url)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-card/90 shadow-sm hover:bg-card"
                    aria-label={`Remove photo ${i + 1}`}
                    title="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {Array.from({ length: uploading }, (_, i) => (
              <div
                key={`uploading-${i}`}
                className="flex aspect-[4/3] items-center justify-center rounded-lg border bg-muted"
              >
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {images.length} of {MAX_PHOTOS} photos · the first photo is your cover
            </p>
            <Button
              type="button"
              variant="outline"
              className={cn("rounded-full", !canAddMore && "hidden")}
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" />
              Add photos
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
