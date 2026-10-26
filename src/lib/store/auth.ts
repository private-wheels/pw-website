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
    case "captcha_failed":
      return "We couldn't verify you're human. Please refresh the page and try again.";
    case "anonymous_provider_disabled":
      return "Starting a listing without an account isn't switched on yet. Please register first.";
    case "weak_password":
      return "That password is too weak. Use at least 8 characters.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a few minutes and try again.";
    default:
      return error.message || "Something went wrong. Please try again.";
  }
}

export async function login(email: string, password: string, captchaToken?: string): Promise<void> {
  const { error } = await getSupabaseBrowserClient().auth.signInWithPassword({
    email: email.trim(),
    password,
    options: { captchaToken },
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
  captchaToken?: string,
): Promise<{ needsConfirmation: boolean }> {
  const emailRedirectTo = `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`;
  const { data, error } = await getSupabaseBrowserClient().auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo, captchaToken },
  });
  if (error) throw new AuthError(friendlyMessage(error));

  // With confirmation on, signing up an existing email "succeeds" with no
  // identities (so accounts can't be enumerated) — tell the user plainly.
  if (data.user && data.user.identities?.length === 0) {
    throw new AuthError("An account with this email already exists.");
  }
  return { needsConfirmation: !data.session };
}

/**
 * Starts a temporary (anonymous) account so someone can fill in a listing and
 * upload photos before creating a real account. Needs "Allow anonymous
 * sign-ins" in Supabase Auth settings.
 */
export async function startAnonymous(captchaToken?: string): Promise<void> {
  const { error } = await getSupabaseBrowserClient().auth.signInAnonymously({
    options: { captchaToken },
  });
  if (error) throw new AuthError(friendlyMessage(error));
}

/**
 * Turns the temporary account into a real one by attaching an email. Supabase
 * emails a confirmation link; the account (and its listing) is theirs either
 * way, and confirming lets them set a password and sign in later.
 */
export async function linkEmail(email: string, next: string): Promise<void> {
  const emailRedirectTo = `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`;
  const { error } = await getSupabaseBrowserClient().auth.updateUser(
    { email: email.trim() },
    { emailRedirectTo },
  );
  if (error) throw new AuthError(friendlyMessage(error));
}

/** Sets a password for the signed-in account (after confirming their email). */
export async function setPassword(password: string): Promise<void> {
  const { error } = await getSupabaseBrowserClient().auth.updateUser({ password });
  if (error) throw new AuthError(friendlyMessage(error));
}

/** The temporary account's access token, so its listing can be claimed after signing in. */
export async function currentAccessToken(): Promise<string | null> {
  const { data } = await getSupabaseBrowserClient().auth.getSession();
  return data.session?.access_token ?? null;
}

export async function logout(): Promise<void> {
  await getSupabaseBrowserClient().auth.signOut();
}

/** Loads the profile for a signed-in account. */
export async function loadUser(id: string, email: string, isAnonymous = false): Promise<User> {
  const { data } = await getSupabaseBrowserClient()
    .from("profiles")
    .select("display_name, phone, role")
    .eq("id", id)
    .maybeSingle();

  return {
    id,
    email,
    name: data?.display_name || email.split("@")[0] || "",
    phone: data?.phone ?? "",
    role: data?.role === "admin" ? "admin" : "member",
    isAnonymous,
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
