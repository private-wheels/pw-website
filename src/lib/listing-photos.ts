/**
 * Listing photos and the view each one shows. Every listing needs one photo
 * of each required view (front, back, side, inside); anything else is
 * "other". We can't tell what a photo really shows, so sellers upload each
 * view into its own labelled slot and our reviewers check them: a listing
 * missing one gets a request for more photos, or is declined.
 *
 * In the database the views are `photo_views`, parallel to `images`.
 */

export const REQUIRED_PHOTOS = [
  { key: "front", label: "Front", hint: "The whole front of the car, number plate included" },
  { key: "back", label: "Back", hint: "The whole back of the car" },
  { key: "side", label: "Side", hint: "A full side view, front to back" },
  { key: "inside", label: "Inside", hint: "The dashboard and front seats" },
] as const;

export type RequiredView = (typeof REQUIRED_PHOTOS)[number]["key"];
export type PhotoView = RequiredView | "other";

export type ListingPhoto = { url: string; view: PhotoView };

const REQUIRED_KEYS: readonly RequiredView[] = REQUIRED_PHOTOS.map((p) => p.key);
const VIEWS: readonly string[] = [...REQUIRED_KEYS, "other"];

export function isPhotoView(value: string): value is PhotoView {
  return VIEWS.includes(value);
}

/** The tag shown on a photo, or null for "other" (no tag). */
export function photoViewLabel(view: PhotoView | undefined): string | null {
  return REQUIRED_PHOTOS.find((p) => p.key === view)?.label ?? null;
}

/** Required views in order (front first, so it's the cover), then the rest as added. */
export function sortPhotos(photos: ListingPhoto[]): ListingPhoto[] {
  const rank = (view: PhotoView) => {
    const i = REQUIRED_KEYS.indexOf(view as RequiredView);
    return i === -1 ? REQUIRED_KEYS.length : i;
  };
  return photos
    .map((photo, i) => ({ photo, i }))
    .sort((a, b) => rank(a.photo.view) - rank(b.photo.view) || a.i - b.i)
    .map(({ photo }) => photo);
}

/** The required views with no photo yet. */
export function missingViews(views: readonly string[]): RequiredView[] {
  return REQUIRED_KEYS.filter((key) => !views.includes(key));
}

/** "the front and inside" — for messages about missing views. */
export function listViews(views: readonly RequiredView[]): string {
  const names = [...views];
  if (names.length <= 1) return `the ${names[0] ?? ""}`;
  return `the ${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** Pairs stored images with their views (older listings have none: all "other"). */
export function toPhotos(images: readonly string[], views: readonly string[]): ListingPhoto[] {
  const aligned = views.length === images.length;
  return images.map((url, i) => {
    const view = aligned ? views[i] : "other";
    return { url, view: isPhotoView(view) ? view : "other" };
  });
}

/**
 * The cover photo's URL: the one the seller chose, or else the front photo
 * (or the first photo, if there's no front yet).
 */
export function coverOf(photos: ListingPhoto[], chosen: string | null): string | null {
  return (
    photos.find((p) => p.url === chosen)?.url ??
    photos.find((p) => p.view === "front")?.url ??
    sortPhotos(photos)[0]?.url ??
    null
  );
}

/**
 * Back to the two parallel columns, in display order: the cover first (the
 * site shows `images[0]` as a listing's main photo), then the rest by view.
 */
export function fromPhotos(
  photos: ListingPhoto[],
  cover: string | null,
): { images: string[]; photoViews: PhotoView[] } {
  const sorted = sortPhotos(photos);
  const coverUrl = coverOf(photos, cover);
  const ordered = [...sorted.filter((p) => p.url === coverUrl), ...sorted.filter((p) => p.url !== coverUrl)];
  return { images: ordered.map((p) => p.url), photoViews: ordered.map((p) => p.view) };
}
