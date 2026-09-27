import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Listing photos live in the public `listing-photos` bucket under
 * `<user id>/<random>.jpg`. Storage policies only let a user write inside
 * their own folder; listings store the photos' public URLs.
 */

export const PHOTO_BUCKET = "listing-photos";
export const MAX_PHOTOS = 20;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const PHOTO_ACCEPT = ACCEPTED_TYPES.join(",");

/** Longest edge of an uploaded photo — plenty for the gallery, far smaller than a phone original. */
const MAX_EDGE_PX = 2000;

const publicPrefix = `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/`;

/** Storage path for one of our public photo URLs, or null for any other image. */
export function photoPathFromUrl(url: string): string | null {
  return url.startsWith(publicPrefix) ? decodeURIComponent(url.slice(publicPrefix.length)) : null;
}

export class PhotoUploadError extends Error {}

/**
 * Downscales large photos to MAX_EDGE_PX JPEGs before upload — phone photos
 * are often 5–12 MB. Falls back to the original file if the browser can't
 * decode it.
 */
async function prepareImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= 1.5 * 1024 * 1024) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

/** Uploads one photo to the user's folder and returns its public URL. */
export async function uploadListingPhoto(file: File, userId: string): Promise<string> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new PhotoUploadError(`${file.name}: only JPEG, PNG or WebP photos can be uploaded.`);
  }

  const blob = await prepareImage(file);
  if (blob.size > MAX_PHOTO_BYTES) {
    throw new PhotoUploadError(`${file.name} is larger than 10 MB.`);
  }

  const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const storage = getSupabaseBrowserClient().storage.from(PHOTO_BUCKET);

  const { error } = await storage.upload(path, blob, {
    contentType: blob.type || file.type,
    cacheControl: "31536000",
  });
  if (error) throw new PhotoUploadError(`${file.name} couldn't be uploaded: ${error.message}`);

  return storage.getPublicUrl(path).data.publicUrl;
}

/** Best-effort delete of photos we host; other URLs (e.g. demo images) are ignored. */
export async function deleteListingPhotos(urls: string[]): Promise<void> {
  const paths = urls.map(photoPathFromUrl).filter((p): p is string => Boolean(p));
  if (paths.length === 0) return;

  const { error } = await getSupabaseBrowserClient().storage.from(PHOTO_BUCKET).remove(paths);
  if (error) console.error("Failed to delete listing photos:", error.message);
}
