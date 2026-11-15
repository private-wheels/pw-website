import type { ListingRow } from "@/lib/supabase/database.types";
import { listViews, missingViews } from "@/lib/listing-photos";

/** The listing columns the completeness check needs. */
export const COMPLETENESS_COLUMNS =
  "make, model, variant, year, price, town, colour, description, seller_name, seller_phone, features, photo_views";

type CompletenessRow = Pick<
  ListingRow,
  | "make"
  | "model"
  | "variant"
  | "year"
  | "price"
  | "town"
  | "colour"
  | "description"
  | "seller_name"
  | "seller_phone"
  | "features"
  | "photo_views"
>;

/**
 * What a listing is missing before it can go for review, checked on the
 * server (the listing form checks the same, and more, as the seller goes).
 * Everything is required except extra photos. The database itself enforces
 * the dropdown fields on anything that isn't a draft.
 */
export function missingDetails(row: CompletenessRow): string[] {
  const blank = (value: string | null) => !value || value.trim() === "";
  const missing: string[] = [];
  if (blank(row.make)) missing.push("make");
  if (blank(row.model)) missing.push("model");
  if (blank(row.variant)) missing.push("variant");
  if (!row.year) missing.push("year");
  if (!row.price) missing.push("price");
  if (blank(row.town)) missing.push("town");
  if (blank(row.colour)) missing.push("colour");
  if (row.features.length === 0) missing.push("features");
  if (blank(row.description)) missing.push("description");
  if (blank(row.seller_name)) missing.push("your name");
  if (blank(row.seller_phone)) missing.push("contact number");
  const views = missingViews(row.photo_views);
  if (views.length > 0) missing.push(`photos of ${listViews(views)}`);
  return missing;
}
