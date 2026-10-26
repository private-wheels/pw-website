import { getAdmin } from "@/lib/server/admin";
import { SUPPORT_EMAIL } from "@/lib/email";

export const metadata = { title: "Admin · Refund guide" };

const SCENARIOS: { situation: string; refund: "Yes" | "No" | "Usually"; how: string }[] = [
  {
    situation: "We reject a listing in review (it never went live)",
    refund: "Yes",
    how: "Reject it from the listing page with “Refund the listing fee” ticked (the default). The refund and the email to the seller happen automatically.",
  },
  {
    situation: "The listing just needs fixing (bad photo, missing detail, wrong price)",
    refund: "No",
    how: "Don't reject. Use “Request changes”. The seller fixes it and resubmits for free.",
  },
  {
    situation: "The seller asks to cancel before we've approved it",
    refund: "Yes",
    how: "Reject it with a reason like “Cancelled at your request” and leave the refund ticked.",
  },
  {
    situation: "A founding seller (paid before launch) asks to cancel before launch day, even if approved",
    refund: "Yes",
    how: "Take it down from the listing page with the refund ticked. Founding sellers were promised this.",
  },
  {
    situation: "The listing was live and the seller sold the car or changed their mind",
    refund: "No",
    how: "The service was delivered. They can mark it sold or delete it themselves. Explain kindly if they ask.",
  },
  {
    situation: "We take down a live listing for breaking the rules (scam, not their car, misleading)",
    refund: "No",
    how: "Take it down from the listing page and untick the refund. Give the reason in the note.",
  },
  {
    situation: "The seller was charged twice, or charged in error",
    refund: "Yes",
    how: "Refund the extra payment from the Payments page. The listing isn't affected.",
  },
  {
    situation: "Our mistake or a technical problem cost the seller their listing",
    refund: "Usually",
    how: "Use judgement. If in doubt, refund — R249 isn't worth a bad review.",
  },
];

export default async function RefundGuidePage() {
  if (!(await getAdmin())) return null;

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h2 className="text-lg font-semibold">When to refund the listing fee</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The short version: <strong>refund if the listing never went live</strong>, or if it&apos;s a founding
          seller cancelling before launch. <strong>Don&apos;t refund once a listing has been live</strong>, unless
          it was charged in error or it&apos;s our fault. Refunds are always the full amount. We don&apos;t do partial refunds.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {SCENARIOS.map((s) => (
          <div key={s.situation} className="rounded-2xl border bg-card p-4">
            <div className="flex items-start justify-between gap-4">
              <p className="font-medium">{s.situation}</p>
              <span
                className={
                  s.refund === "Yes"
                    ? "shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700"
                    : s.refund === "No"
                      ? "shrink-0 rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700"
                      : "shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800"
                }
              >
                {s.refund === "Yes" ? "Refund" : s.refund === "No" ? "No refund" : "Usually refund"}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">{s.how}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-card p-5 text-sm">
        <h3 className="font-semibold">How refunds work</h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">
          <li>
            Refunds go through Paystack back to the card or account the seller paid with. They usually show within
            5–10 working days. Tell the seller that if they ask.
          </li>
          <li>
            A refund shows as <em>refund pending</em> until Paystack confirms it, then <em>refunded</em>. If one
            fails, the payment goes back to <em>success</em> with a note. Retry from Payments, or refund it in the
            Paystack dashboard (Transactions → the payment → Refund).
          </li>
          <li>Paystack keeps its transaction fee on refunded payments, so each refund costs us a little.</li>
          <li>A refund can&apos;t be undone. Rejecting a listing can&apos;t be undone either. The seller would need to list again.</li>
          <li>
            Disputes or anything unusual: discuss before acting, and keep the conversation in{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
              {SUPPORT_EMAIL}
            </a>
            .
          </li>
        </ul>
      </div>
    </div>
  );
}
