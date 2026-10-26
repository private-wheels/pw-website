import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * The signed-in user if they're an admin, else null. Every admin page and
 * action calls this first; admin reads and writes then use the secret-key
 * client, so this check is what keeps them admin-only.
 */
export async function getAdmin(): Promise<{ id: string; email: string } | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  return profile?.role === "admin" ? { id: user.id, email: user.email ?? "" } : null;
}
