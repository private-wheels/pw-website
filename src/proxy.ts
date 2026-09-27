import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PREVIEW_COOKIE_NAME, PREVIEW_COOKIE_OPTIONS } from "@/lib/preview-access";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Pre-launch gate.
 *
 * While the site is not launched, every page request is rewritten to the
 * coming-soon page. The visitor keeps the URL they asked for, but the only
 * page they can ever see is the holding page — the marketplace, dashboard,
 * auth pages and finance tools are all unreachable.
 *
 *   SITE_LAUNCHED=true        → gate off, the whole site is open
 *   (unset / anything else)   → gated (the safe default)
 *
 * Two ways to preview while gated (both need PREVIEW_TOKEN set):
 *   - /preview — a friendly 4-digit PIN page for demos/presentations.
 *   - opening any URL once with `?preview=<PREVIEW_TOKEN>`.
 * Either sets a cookie so you (and only you) can browse the real site for a
 * week.
 *
 * Every request that gets through to the real site also refreshes the
 * Supabase session and guards /dashboard (see lib/supabase/proxy).
 */

const COMING_SOON_PATH = "/coming-soon";
const PREVIEW_PATH = "/preview";

export async function proxy(request: NextRequest) {
  if (process.env.SITE_LAUNCHED === "true") {
    return updateSession(request);
  }

  const { pathname, searchParams } = request.nextUrl;
  const token = process.env.PREVIEW_TOKEN;

  // The holding page and the PIN-entry page are always allowed.
  if (pathname === COMING_SOON_PATH || pathname === PREVIEW_PATH) {
    return NextResponse.next();
  }

  // `?preview=<token>` unlocks the real site and remembers it for a week.
  if (token && searchParams.get("preview") === token) {
    const res = await updateSession(request);
    res.cookies.set(PREVIEW_COOKIE_NAME, token, PREVIEW_COOKIE_OPTIONS);
    return res;
  }

  // Someone who already unlocked preview sees the real site.
  if (token && request.cookies.get(PREVIEW_COOKIE_NAME)?.value === token) {
    return updateSession(request);
  }

  // Everyone else: show the holding page, keep their URL.
  return NextResponse.rewrite(new URL(COMING_SOON_PATH, request.url));
}

export const config = {
  // Run on every page route except API routes (`/api/*` — e.g. the lead form
  // still needs to work while gated), Next internals (`_next/*`, including HMR)
  // and static assets.
  matcher: [
    "/((?!api|_next|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
