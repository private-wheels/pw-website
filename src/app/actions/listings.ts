"use server";

import { updateTag } from "next/cache";
import { isListingId } from "@/lib/listings";
import { notifyListing } from "@/lib/server/listing-emails";
import { LISTINGS_TAG, createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Expires the cached public listings after a seller creates, edits, pauses or
 * deletes one, so every page (and this user's next render) shows the change
 * straight away. The write itself happens client-side under RLS; this only
 * clears the cache, so it's harmless for anyone to call.
 */
export async function refreshListings() {
  updateTag(LISTINGS_TAG);
}

/**
 * After making the changes an admin asked for, the seller sends the listing
 * back to the review queue. Runs as the seller, so RLS and the status trigger
 * decide whether it's allowed.
 */
export async function resubmitListing(id: string): Promise<{ ok: boolean }> {
  if (!isListingId(id)) return { ok: false };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("listings")
    .update({ status: "pending_review" })
    .eq("id", id)
    .eq("status", "changes_requested")
    .select("id");
  if (error || data.length === 0) return { ok: false };

  await notifyListing(id, { type: "received", resubmitted: true });
  return { ok: true };
}
