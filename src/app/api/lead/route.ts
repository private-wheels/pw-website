/**
 * Pre-launch lead capture — backs the "Want us to reach out?" form on
 * `/coming-soon`.
 *
 * Each lead can go to several places, all optional and independent:
 *   1. the server log (always)
 *   2. LEAD_WEBHOOK_URL — a plain JSON POST (Zapier/Make catch hook, a Google
 *      Apps Script → Sheet, a Slack incoming webhook, …)
 *   3. email — via Resend (see emailLead)
 *   4. WhatsApp — a message via the Meta WhatsApp Cloud API (see notifyWhatsApp)
 *
 * Wire up at least one of 2–4 before this page goes live.
 */

interface Lead {
  name: string;
  mobile: string;
  /** Opted in to marketing and launch updates (POPIA s69). Defaults to false. */
  marketingConsent: boolean;
  at: string;
  source: string;
}

const MAX_LEN = 200;

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: real people never fill the hidden "company" field.
  if (typeof payload.company === "string" && payload.company.trim() !== "") {
    return Response.json({ ok: true });
  }

  const name =
    typeof payload.name === "string" ? payload.name.trim().slice(0, MAX_LEN) : "";
  const mobile =
    typeof payload.mobile === "string" ? payload.mobile.trim().slice(0, MAX_LEN) : "";

  if (name.length < 2 || mobile.replace(/\D/g, "").length < 7) {
    return Response.json(
      { error: "Please enter your name and a valid mobile number." },
      { status: 422 },
    );
  }

  const lead: Lead = {
    name,
    mobile,
    marketingConsent: payload.marketingConsent === true,
    at: new Date().toISOString(),
    source: "coming-soon",
  };

  // Always keep a server-side record.
  console.log("[lead]", lead);

  // Fan out to whatever's configured, in parallel; a delivery failure never
  // fails the visitor's request (we still have the log).
  await Promise.allSettled([
    forwardToWebhook(lead),
    emailLead(lead),
    notifyWhatsApp(lead),
  ]);

  return Response.json({ ok: true });
}

async function forwardToWebhook(lead: Lead) {
  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (!webhook) return;
  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(lead),
    });
    if (!res.ok) {
      console.error("[lead] webhook responded", res.status);
    }
  } catch (err) {
    console.error("[lead] webhook delivery failed", err);
  }
}

/**
 * Email the lead via Resend (https://resend.com — free tier is plenty for a
 * launch list, and the REST call needs no npm package).
 *
 *   RESEND_API_KEY   an API key from the Resend dashboard
 *   LEAD_EMAIL_TO    where leads should land (comma-separated for several)
 *   LEAD_EMAIL_CC    optional; also copy these addresses (comma-separated)
 *   LEAD_EMAIL_FROM  optional sender; defaults to Resend's shared test address,
 *                    which works immediately. For production use an address on
 *                    a domain you've verified in Resend
 *                    (e.g. "Private Wheels <leads@private-wheels.co.za>").
 */
async function emailLead(lead: Lead) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_EMAIL_TO;
  if (!apiKey || !to) return;

  const cc = process.env.LEAD_EMAIL_CC;

  const from =
    process.env.LEAD_EMAIL_FROM ?? "Private Wheels <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: to.split(",").map((addr) => addr.trim()),
        ...(cc ? { cc: cc.split(",").map((addr) => addr.trim()) } : {}),
        subject: `New Private Wheels lead — ${lead.name}`,
        text: [
          "New lead from the coming-soon page.",
          "",
          `Name:   ${lead.name}`,
          `Mobile: ${lead.mobile}`,
          `Marketing consent: ${lead.marketingConsent ? "yes" : "no"}`,
          `When:   ${lead.at}`,
        ].join("\n"),
      }),
    });
    if (!res.ok) {
      console.error(
        "[lead] email failed",
        res.status,
        await res.text().catch(() => ""),
      );
    }
  } catch (err) {
    console.error("[lead] email error", err);
  }
}

/**
 * Send the lead as a WhatsApp message via the Meta WhatsApp Cloud API.
 *
 * Needs a WhatsApp Business Platform app with its OWN sender number
 * (WHATSAPP_PHONE_NUMBER_ID) — this cannot be the number visitors message from
 * the site; you can't WhatsApp yourself. WHATSAPP_NOTIFY_TO is where the alert
 * lands (a team member's number, international format, digits only).
 *
 * Without WHATSAPP_TEMPLATE it sends plain text, which Meta only delivers if
 * that person messaged the sender number in the last 24h. For reliable
 * delivery, create a 2-variable template (e.g. body "New lead: {{1}} — {{2}}"),
 * get it approved, and set WHATSAPP_TEMPLATE to its name.
 */
async function notifyWhatsApp(lead: Lead) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = process.env.WHATSAPP_NOTIFY_TO;
  if (!token || !phoneNumberId || !to) return;

  const template = process.env.WHATSAPP_TEMPLATE;
  const body = template
    ? {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG ?? "en" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: lead.name },
                { type: "text", text: lead.mobile },
              ],
            },
          ],
        },
      }
    : {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: {
          body: `New Private Wheels lead\nName: ${lead.name}\nMobile: ${lead.mobile}\nMarketing consent: ${lead.marketingConsent ? "yes" : "no"}`,
        },
      };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      console.error(
        "[lead] whatsapp notify failed",
        res.status,
        await res.text().catch(() => ""),
      );
    }
  } catch (err) {
    console.error("[lead] whatsapp notify error", err);
  }
}
