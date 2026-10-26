"use server";

import { isListingId } from "@/lib/listings";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUPABASE_URL } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BUCKET = "listing-photos";
const publicPrefix = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;

/**
 * Someone started a listing with a temporary (anonymous) account, then signed
 * in to an account they already had. Moves the listing and its photos to that
 * account and deletes the temporary one.
 *
 * `anonAccessToken` is the temporary account's token from before signing in;
 * Supabase verifies it, so nobody can claim a listing that isn't theirs.
 */
export async function claimListing(
  listingId: string,
  anonAccessToken: string,
): Promise<{ ok: true; isAdmin: boolean } | { ok: false; error: string }> {
  if (!isListingId(listingId)) return { ok: false, error: "Listing not found." };

  const {
    data: { user },
  } = await (await createSupabaseServerClient()).auth.getUser();
  if (!user || user.is_anonymous) return { ok: false, error: "Please sign in first." };

  const db = createAdminClient();
  const { data: anon } = await db.auth.getUser(anonAccessToken);
  if (!anon.user?.is_anonymous || anon.user.id === user.id) {
    return { ok: false, error: "We couldn't find the listing you started. Please start again." };
  }
  const anonId = anon.user.id;

  const { data: listing } = await db
    .from("listings")
    .select("id, images")
    .eq("id", listingId)
    .eq("seller_id", anonId)
    .is("paid_at", null)
    .maybeSingle();
  if (!listing) return { ok: false, error: "We couldn't find the listing you started. Please start again." };

  // Photos live under `<user id>/`, and storage rules only let owners touch
  // their own folder, so move them into the real account's folder.
  const storage = db.storage.from(BUCKET);
  const images: string[] = [];
  for (const url of listing.images) {
    const path = url.startsWith(publicPrefix) ? decodeURIComponent(url.slice(publicPrefix.length)) : null;
    if (!path?.startsWith(`${anonId}/`)) {
      images.push(url);
      continue;
    }
    const newPath = `${user.id}/${path.slice(anonId.length + 1)}`;
    const { error } = await storage.move(path, newPath);
    images.push(error ? url : storage.getPublicUrl(newPath).data.publicUrl);
    if (error) console.error("[claim] photo move failed", path, error.message);
  }

  const { error } = await db
    .from("listings")
    .update({ seller_id: user.id, images })
    .eq("id", listing.id);
  if (error) return { ok: false, error: "We couldn't move your listing. Please try again." };

  // Anything else the temporary account started (unpaid) goes with it.
  await db.auth.admin.deleteUser(anonId).catch((err) => console.error("[claim] delete anon", err));

  const { data: profile } = await db.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return { ok: true, isAdmin: profile?.role === "admin" };
}
