import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { AFTER_SIGN_IN_PATH } from "@/lib/identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Landing point for links in Supabase auth emails (sign-up confirmation).
 * Handles both link styles Supabase can send:
 *   - `?code=`                   — the default PKCE flow
 *   - `?token_hash=&type=`       — custom email templates
 * On success the session cookie is set and the user continues to `next`
 * (via the verify page for new accounts).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  const supabase = await createSupabaseServerClient();
  let ok = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  }

  if (!ok) return NextResponse.redirect(new URL("/login?error=confirm", origin));
  return NextResponse.redirect(new URL(isSignUp(type, code) ? throughVerify(next) : next, origin));
}

/** A new account confirming its email (not an email change on an existing one). */
function isSignUp(type: EmailOtpType | null, code: string | null): boolean {
  return type === "email" || type === "signup" || (code !== null && type === null);
}

/**
 * New accounts always see the identity verification page first (they can
 * skip it), wherever the email link says to go next. The Supabase email
 * template decides `next`, so this doesn't rely on it being up to date. The
 * verify page sends admins and already-verified sellers straight on.
 */
function throughVerify(next: string): string {
  // The /list pages and the password reset page stay where they are.
  if (next.startsWith("/list/") || next.startsWith("/login/")) return next;
  return `/list/verify?next=${encodeURIComponent(next)}`;
}

/** Only same-site paths — never redirect to another host. */
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : AFTER_SIGN_IN_PATH;
}
