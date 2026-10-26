import { SUPPORT_EMAIL, type Email } from "@/lib/email";

/**
 * The emails sellers (and admins) get about a listing. Plain inline-styled
 * HTML so they render the same in Gmail, Outlook and Apple Mail, plus a text
 * version. Admins can preview every template at /dashboard/admin/emails.
 */

const BRAND = "#d90429";

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Before launch, approved listings wait for launch day instead of going live. */
export function isPreLaunch(): boolean {
  return process.env.SITE_LAUNCHED !== "true";
}

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type Block = { p: string } | { note: string; label: string } | { button: string; href: string };

function render(opts: { preheader: string; heading: string; greeting?: string; blocks: Block[] }): {
  html: string;
  text: string;
} {
  const body = opts.blocks
    .map((block) => {
      if ("p" in block) {
        return `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#334155">${escape(block.p)}</p>`;
      }
      if ("note" in block) {
        return `<div style="margin:0 0 16px;padding:14px 16px;border-left:3px solid ${BRAND};background:#f8fafc;border-radius:6px">
  <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#64748b">${escape(block.label)}</p>
  <p style="margin:0;font-size:15px;line-height:22px;color:#0f172a;white-space:pre-line">${escape(block.note)}</p>
</div>`;
      }
      return `<p style="margin:8px 0 24px"><a href="${escape(block.href)}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:${BRAND};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none">${escape(block.button)}</a></p>`;
    })
    .join("\n");

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(opts.heading)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<span style="display:none;max-height:0;overflow:hidden">${escape(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="padding:24px 32px;border-bottom:1px solid #e2e8f0">
  <span style="font-size:18px;font-weight:700;color:#0f172a">Private<span style="color:${BRAND}">Wheels</span></span>
</td></tr>
<tr><td style="padding:32px">
  <h1 style="margin:0 0 20px;font-size:22px;line-height:30px;color:#0f172a">${escape(opts.heading)}</h1>
  ${opts.greeting ? `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#334155">${escape(opts.greeting)}</p>` : ""}
  ${body}
  <p style="margin:24px 0 0;font-size:15px;line-height:24px;color:#334155">The Private Wheels team</p>
</td></tr>
<tr><td style="padding:20px 32px;background:#f8fafc;font-size:12px;line-height:18px;color:#64748b">
  Questions? Reply to this email or write to <a href="mailto:${SUPPORT_EMAIL}" style="color:#64748b">${SUPPORT_EMAIL}</a>.<br>
  Private Wheels · ${escape(siteUrl().replace(/^https?:\/\//, ""))}
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  const text = [
    opts.heading,
    "",
    ...(opts.greeting ? [opts.greeting, ""] : []),
    ...opts.blocks.flatMap((block) => {
      if ("p" in block) return [block.p, ""];
      if ("note" in block) return [`${block.label}:`, block.note, ""];
      return [`${block.button}: ${block.href}`, ""];
    }),
    "The Private Wheels team",
    "",
    `Questions? Reply to this email or write to ${SUPPORT_EMAIL}.`,
  ].join("\n");

  return { html, text };
}

export type ListingEmailData = {
  sellerName: string;
  /** e.g. "2019 BMW X3 2.0d xDrive Auto" */
  listingTitle: string;
  listingId: string;
};

function hello(name: string): string {
  const first = name.trim().split(/\s+/)[0];
  return first ? `Hi ${first},` : "Hi there,";
}

/** After payment (or resubmission): we're reviewing it. */
export function listingReceivedEmail(d: ListingEmailData & { resubmitted?: boolean }): Email {
  const subject = d.resubmitted
    ? `We're reviewing your updated listing: ${d.listingTitle}`
    : `We've received your listing: ${d.listingTitle}`;
  return {
    subject,
    ...render({
      preheader: "Our team is reviewing it now, usually within one working day.",
      heading: d.resubmitted ? "Thanks for the update" : "Thanks, your listing is in review",
      greeting: hello(d.sellerName),
      blocks: [
        {
          p: d.resubmitted
            ? `We've received the changes to your ${d.listingTitle} and our team is taking another look.`
            : `Your payment went through and your ${d.listingTitle} is now with our team for a quick review.`,
        },
        {
          p: "We check every listing before it goes live so buyers can trust what they see. This usually takes less than one working day, and we'll email you as soon as it's done.",
        },
        { button: "View your listing", href: `${siteUrl()}/dashboard` },
      ],
    }),
  };
}

export function listingApprovedEmail(d: ListingEmailData & { preLaunch: boolean }): Email {
  return {
    subject: d.preLaunch
      ? `Approved! Your ${d.listingTitle} goes live on launch day`
      : `Your ${d.listingTitle} is live on Private Wheels`,
    ...render({
      preheader: d.preLaunch
        ? "You're all set for launch day."
        : "Buyers can now find and contact you.",
      heading: d.preLaunch ? "You're approved and ready for launch" : "Your listing is live",
      greeting: hello(d.sellerName),
      blocks: d.preLaunch
        ? [
            {
              p: `Good news: your ${d.listingTitle} has been approved. It'll be one of the first cars buyers see when Private Wheels launches, and we'll let you know the moment we're live.`,
            },
            { p: "You can still edit your listing from your dashboard before then." },
            { button: "Go to your dashboard", href: `${siteUrl()}/dashboard` },
          ]
        : [
            {
              p: `Good news: your ${d.listingTitle} has been approved and is now live. Buyers can find it and contact you directly.`,
            },
            { button: "View your listing", href: `${siteUrl()}/cars/${d.listingId}` },
            {
              p: "Tip: you can pause your listing or mark it as sold from your dashboard at any time.",
            },
          ],
    }),
  };
}

export function changesRequestedEmail(d: ListingEmailData & { note: string }): Email {
  return {
    subject: `A quick change is needed on your ${d.listingTitle}`,
    ...render({
      preheader: "Make the change and resubmit. There's nothing more to pay.",
      heading: "Almost there, one thing to fix",
      greeting: hello(d.sellerName),
      blocks: [
        {
          p: `We've reviewed your ${d.listingTitle} and need a small change before it can go live:`,
        },
        { label: "What to change", note: d.note },
        {
          p: "Update your listing and resubmit it from your dashboard. There's nothing more to pay, and we'll review it again straight away.",
        },
        { button: "Edit your listing", href: `${siteUrl()}/dashboard/listings/${d.listingId}/edit` },
      ],
    }),
  };
}

export function listingRejectedEmail(
  d: ListingEmailData & { note: string; refund: boolean; amount?: string },
): Email {
  return {
    subject: `About your ${d.listingTitle} listing`,
    ...render({
      preheader: d.refund
        ? "We couldn't approve your listing. Your refund is on its way."
        : "We couldn't approve your listing.",
      heading: "We couldn't approve your listing",
      greeting: hello(d.sellerName),
      blocks: [
        { p: `Unfortunately we're unable to publish your ${d.listingTitle} on Private Wheels.` },
        { label: "Reason", note: d.note },
        ...(d.refund
          ? [
              {
                p: `We've refunded your listing fee${d.amount ? ` of ${d.amount}` : ""} in full. It goes back to the card or account you paid with and usually shows within 5 to 10 working days.`,
              },
            ]
          : []),
        { p: `If you think this is a mistake, just reply to this email and we'll take another look.` },
      ],
    }),
  };
}

/** To admins: something is waiting in the review queue. */
export function adminReviewNeededEmail(d: ListingEmailData & { resubmitted?: boolean }): Email {
  return {
    subject: d.resubmitted
      ? `Resubmitted for review: ${d.listingTitle}`
      : `New listing to review: ${d.listingTitle}`,
    ...render({
      preheader: `${d.sellerName} is waiting for a review.`,
      heading: d.resubmitted ? "A listing was resubmitted" : "A new listing needs review",
      blocks: [
        {
          p: d.resubmitted
            ? `${d.sellerName} has made the requested changes to their ${d.listingTitle}.`
            : `${d.sellerName} has paid for a new listing: ${d.listingTitle}.`,
        },
        { button: "Review it", href: `${siteUrl()}/dashboard/admin/listings/${d.listingId}` },
      ],
    }),
  };
}
