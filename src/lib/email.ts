/**
 * Transactional email via Resend (https://resend.com) — server only. Same
 * account and verified domain as the coming-soon lead emails.
 *
 *   RESEND_API_KEY        required; without it emails are skipped (logged)
 *   LISTING_EMAIL_FROM    optional sender, default "Private Wheels <hello@private-wheels.co.za>"
 *   ADMIN_NOTIFY_EMAIL    optional; where "new listing to review" alerts go
 *                         (comma-separated), default hello@private-wheels.co.za
 *
 * Sending never throws: a failed email is logged and the caller carries on,
 * so an email outage can't block a payment or a review decision.
 */

export const SUPPORT_EMAIL = "hello@private-wheels.co.za";

export type Email = { subject: string; html: string; text: string };

export async function sendEmail(to: string | string[], email: Email): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set — skipped "${email.subject}"`);
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.LISTING_EMAIL_FROM ?? `Private Wheels <${SUPPORT_EMAIL}>`,
        to: Array.isArray(to) ? to : [to],
        reply_to: SUPPORT_EMAIL,
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
    });
    if (!res.ok) {
      console.error("[email] send failed", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] send error", err);
    return false;
  }
}

export function adminNotifyRecipients(): string[] {
  return (process.env.ADMIN_NOTIFY_EMAIL ?? SUPPORT_EMAIL)
    .split(",")
    .map((addr) => addr.trim())
    .filter(Boolean);
}
