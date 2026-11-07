"use server";

import { updateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { LISTINGS_TAG, createSupabaseServerClient } from "@/lib/supabase/server";

const PHOTO_BUCKET = "listing-photos";

/**
 * Permanently deletes the signed-in seller's account. Deleting the auth user
 * cascades to their profile and listings; their listing photos are removed
 * from Storage first. Payment records (tax law) and identity check records
 * (Smile ID spend) stay, with the link to the person cleared.
 *
 * Admins can't delete themselves here, so the team can't lock itself out.
 */
export async function deleteAccount(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in first." };

  const db = createAdminClient();
  const { data: profile } = await db.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role === "admin") {
    return { ok: false, error: "Admin accounts can't be deleted from the dashboard." };
  }

  // Photos live under `<user id>/` in the listing photos bucket.
  const storage = db.storage.from(PHOTO_BUCKET);
  for (;;) {
    const { data: files, error } = await storage.list(user.id, { limit: 1000 });
    if (error) {
      console.error("[delete account] listing photos", error.message);
      break;
    }
    if (!files?.length) break;
    const { error: removeError } = await storage.remove(files.map((f) => `${user.id}/${f.name}`));
    if (removeError) {
      console.error("[delete account] removing photos", removeError.message);
      break;
    }
    if (files.length < 1000) break;
  }

  const { error } = await db.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[delete account]", error.message);
    return { ok: false, error: "We couldn't delete your account. Please try again or contact us." };
  }

  updateTag(LISTINGS_TAG);
  return { ok: true };
}
