import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Supabase client with the project's secret key. It bypasses Row Level
 * Security, so it's only for trusted server code that has no user session —
 * recording Paystack payments and activating the paid listing. Never import
 * this from a Client Component: the key has no `NEXT_PUBLIC_` prefix, so it
 * would be undefined there anyway.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!SUPABASE_URL || !secretKey) {
    throw new Error("SUPABASE_SECRET_KEY (or NEXT_PUBLIC_SUPABASE_URL) is not set.");
  }
  return createClient<Database>(SUPABASE_URL, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
