/**
 * Server-side check of a Cloudflare Turnstile token, for forms Supabase Auth
 * doesn't already protect (the listing enquiry form). Needs
 * TURNSTILE_SECRET_KEY (the widget's secret, the same one pasted into
 * Supabase's CAPTCHA settings). Without it the check is skipped, so local
 * dev works, and a warning is logged.
 */
export async function verifyTurnstile(token: string | undefined, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn("[turnstile] TURNSTILE_SECRET_KEY not set; skipping the check");
    return true;
  }
  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    const result = (await res.json()) as { success?: boolean };
    return result.success === true;
  } catch (err) {
    console.error("[turnstile] verify failed", err);
    return false;
  }
}
