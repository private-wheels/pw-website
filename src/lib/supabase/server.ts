import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/** Cache tag on every public listings read — invalidate it after a mutation. */
export const LISTINGS_TAG = "listings";

/**
 * Supabase client acting as the signed-in user (reads the session cookies).
 * Use in Route Handlers and Server Actions. Reading cookies makes the route
 * dynamic, so public pages use `createPublicClient` instead.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component, where cookies are read-only. The
          // proxy refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

/**
 * Anonymous, cookie-less client for public data (active listings). Its fetches
 * go through Next's data cache under `LISTINGS_TAG`, so pages stay fast and
 * static; `refreshListings()` expires the tag after a seller changes anything.
 */
export function createPublicClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, next: { revalidate: 300, tags: [LISTINGS_TAG] } }),
    },
  });
}
