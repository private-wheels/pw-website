import { getAdmin } from "@/lib/server/admin";
import {
  adminReviewNeededEmail,
  changesRequestedEmail,
  listingApprovedEmail,
  listingReceivedEmail,
  listingRejectedEmail,
} from "@/lib/email-templates";

export const metadata = { title: "Admin · Emails" };

const SAMPLE = {
  sellerName: "Thandiwe Nkosi",
  listingTitle: "2021 Volkswagen Polo Vivo 1.4 Trendline",
  listingId: "00000000-0000-0000-0000-000000000000",
};

/** Every email the site sends about a listing, with sample data. */
export default async function AdminEmailsPage() {
  if (!(await getAdmin())) return null;

  const emails = [
    { to: "Seller, after paying", email: listingReceivedEmail(SAMPLE) },
    { to: "Seller, after resubmitting changes", email: listingReceivedEmail({ ...SAMPLE, resubmitted: true }) },
    { to: "Seller, approved (before launch)", email: listingApprovedEmail({ ...SAMPLE, preLaunch: true }) },
    { to: "Seller, approved (after launch)", email: listingApprovedEmail({ ...SAMPLE, preLaunch: false }) },
    {
      to: "Seller, changes requested",
      email: changesRequestedEmail({
        ...SAMPLE,
        note: "Please add a clear photo of the front of the car and one of the odometer.",
      }),
    },
    {
      to: "Seller, rejected with refund",
      email: listingRejectedEmail({
        ...SAMPLE,
        note: "We couldn't verify that you're the owner of this vehicle.",
        refund: true,
        amount: "R249",
      }),
    },
    { to: "Admins, new listing to review", email: adminReviewNeededEmail(SAMPLE) },
  ];

  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-muted-foreground">
        These are sent from hello@private-wheels.co.za through Resend, and replies come back to that inbox. To change
        the wording, ask your developer (it lives in <code>src/lib/email-templates.ts</code>).
      </p>
      {emails.map(({ to, email }) => (
        <section key={to} className="flex flex-col gap-2">
          <div>
            <p className="text-xs text-muted-foreground uppercase">{to}</p>
            <p className="font-semibold">{email.subject}</p>
          </div>
          <iframe
            title={to}
            srcDoc={email.html}
            sandbox=""
            className="h-[560px] w-full rounded-2xl border bg-white"
          />
        </section>
      ))}
    </div>
  );
}
