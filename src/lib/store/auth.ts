import type { AuthError as SupabaseAuthError } from "@supabase/supabase-js";
import type { User } from "@/lib/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Supabase Auth (email + password) plus the user's `profiles` row. Pages talk
 * to this through `useAuth()`; errors come back as AuthError with a message
 * that's safe to show.
 */

export class AuthError extends Error {}

function friendlyMessage(error: SupabaseAuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Invalid email or password.";
    case "email_not_confirmed":
      return "Please confirm your email address first — check your inbox for the link.";
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists.";
    case "weak_password":
      return "That password is too weak. Use at least 8 characters.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a few minutes and try again.";
    default:
      return error.message || "Something went wrong. Please try again.";
  }
}

export async function login(email: string, password: string): Promise<void> {
  const { error } = await getSupabaseBrowserClient().auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw new AuthError(friendlyMessage(error));
}

/**
 * Creates the account. When email confirmation is on (the Supabase default)
 * there's no session yet — the user must click the link in their inbox, which
 * lands on /auth/confirm and then `next`.
 */
export async function register(
  email: string,
  password: string,
  next: string,
): Promise<{ needsConfirmation: boolean }> {
  const emailRedirectTo = `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`;
  const { data, error } = await getSupabaseBrowserClient().auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo },
  });
  if (error) throw new AuthError(friendlyMessage(error));

  // With confirmation on, signing up an existing email "succeeds" with no
  // identities (so accounts can't be enumerated) — tell the user plainly.
  if (data.user && data.user.identities?.length === 0) {
    throw new AuthError("An account with this email already exists.");
  }
  return { needsConfirmation: !data.session };
}

export async function logout(): Promise<void> {
  await getSupabaseBrowserClient().auth.signOut();
}

/** Loads the profile for a signed-in account. */
export async function loadUser(id: string, email: string): Promise<User> {
  const { data } = await getSupabaseBrowserClient()
    .from("profiles")
    .select("display_name, phone")
    .eq("id", id)
    .maybeSingle();

  return {
    id,
    email,
    name: data?.display_name || email.split("@")[0],
    phone: data?.phone ?? "",
  };
}

export async function updateProfile(
  id: string,
  updates: { name?: string; phone?: string },
): Promise<void> {
  const { error } = await getSupabaseBrowserClient()
    .from("profiles")
    .update({
      ...(updates.name !== undefined ? { display_name: updates.name.trim() } : {}),
      ...(updates.phone !== undefined ? { phone: updates.phone.trim() } : {}),
    })
    .eq("id", id);
  if (error) throw new AuthError(error.message);
}
