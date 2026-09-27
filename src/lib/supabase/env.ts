/**
 * Public Supabase settings. Both are safe to ship to the browser — the
 * publishable key only grants what Row Level Security allows. They must be
 * referenced as literal `process.env.NEXT_PUBLIC_*` reads so Next inlines them.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/**
 * False when the env vars are missing (e.g. a fresh Vercel project). Server
 * reads then fall back to "no listings" instead of crashing the build.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
