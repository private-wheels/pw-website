"use server";

import { updateTag } from "next/cache";
import { LISTINGS_TAG } from "@/lib/supabase/server";

/**
 * Expires the cached public listings after a seller creates, edits, pauses or
 * deletes one, so every page (and this user's next render) shows the change
 * straight away. The write itself happens client-side under RLS; this only
 * clears the cache, so it's harmless for anyone to call.
 */
export async function refreshListings() {
  updateTag(LISTINGS_TAG);
}
