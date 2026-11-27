import type { Vehicle } from "@/lib/types";
import { isListingId, rowToVehicle } from "@/lib/listings";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/server";

/**
 * Server-side reads of public (active) listings. Cached under LISTINGS_TAG.
 * Failures log and fall back to empty results so a Supabase outage or a
 * missing env var degrades the page instead of breaking the build.
 */

export async function getActiveListings(): Promise<Vehicle[]> {
  if (!isSupabaseConfigured) {
    console.warn("Supabase env vars are not set — rendering without listings.");
    return [];
  }

  const db = createPublicClient();
  const [{ data, error }, unconfirmed] = await Promise.all([
    db.from("listings").select("*").eq("status", "active").order("created_at", { ascending: false }),
    db.rpc("unconfirmed_listing_sellers"),
  ]);

  if (error) {
    console.error("Failed to load listings:", error.message);
    return [];
  }
  // If this check fails, leave enquiries open rather than locking every listing.
  if (unconfirmed.error) console.error("Failed to load unconfirmed sellers:", unconfirmed.error.message);
  const unconfirmedIds = new Set(unconfirmed.data ?? []);
  return data.map((row) => ({
    ...rowToVehicle(row),
    sellerEmailConfirmed: !row.seller_id || !unconfirmedIds.has(row.seller_id),
  }));
}

export async function getActiveListing(id: string): Promise<Vehicle | null> {
  if (!isSupabaseConfigured || !isListingId(id)) return null;

  const { data, error } = await createPublicClient()
    .from("listings")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error(`Failed to load listing ${id}:`, error.message);
    return null;
  }
  return data ? rowToVehicle(data) : null;
}
