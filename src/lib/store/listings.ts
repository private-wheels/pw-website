import type { ListingStatus, NewVehicleInput, Vehicle } from "@/lib/types";
import { refreshListings } from "@/app/actions/listings";
import { rowToVehicle, vehicleInputToRow } from "@/lib/listings";
import { deleteListingPhotos } from "@/lib/storage";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Seller-side listing reads and writes, run in the browser as the signed-in
 * user. Row Level Security decides what each call may touch (sellers only
 * ever see or change their own rows), and every write expires the cached
 * public listings so the change shows up across the site immediately.
 */

export class ListingError extends Error {}

/** Every listing the user owns, including paused and sold ones. */
export async function fetchListingsByUser(userId: string): Promise<Vehicle[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("listings")
    .select("*")
    .eq("seller_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new ListingError(error.message);
  return data.map(rowToVehicle);
}

/** A listing by id — active ones for anyone, plus the user's own in any status. */
export async function fetchListing(id: string): Promise<Vehicle | null> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new ListingError(error.message);
  return data ? rowToVehicle(data) : null;
}

export async function createListing(input: NewVehicleInput): Promise<Vehicle> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("listings")
    .insert(vehicleInputToRow(input))
    .select()
    .single();

  if (error) throw new ListingError(error.message);
  await refreshListings();
  return rowToVehicle(data);
}

export async function updateListing(id: string, input: NewVehicleInput): Promise<Vehicle> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("listings")
    .update(vehicleInputToRow(input))
    .eq("id", id)
    .select()
    .single();

  if (error) throw new ListingError(error.message);
  await refreshListings();
  return rowToVehicle(data);
}

export async function setListingStatus(id: string, status: ListingStatus): Promise<void> {
  const { error } = await getSupabaseBrowserClient()
    .from("listings")
    .update({ status })
    .eq("id", id);

  if (error) throw new ListingError(error.message);
  await refreshListings();
}

export async function deleteListing(listing: Vehicle): Promise<void> {
  const { error } = await getSupabaseBrowserClient()
    .from("listings")
    .delete()
    .eq("id", listing.id);

  if (error) throw new ListingError(error.message);
  await deleteListingPhotos(listing.images);
  await refreshListings();
}
