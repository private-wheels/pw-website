import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument, LegalSection } from "@/components/legal/legal-document";
import { BUSINESS, LISTING_FEE } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Refund Policy | Private Wheels",
  description: "When and how Private Wheels refunds the once-off listing fee.",
};

export default function RefundPolicyPage() {
  return (
    <LegalDocument
      title="Refund Policy"
      summary={
        <p>
          If your listing doesn&apos;t go live, you get your money back. Rejected listings
          are refunded automatically, and you can cancel for a full refund any time before
          your listing is approved. Once your listing is live, the fee isn&apos;t
          refundable, because we&apos;ve delivered the service.
        </p>
      }
    >
      <LegalSection id="scope" title="1. What this policy covers">
        <p>
          This policy applies to the once-off listing fee ({LISTING_FEE.standard}, or{" "}
          {LISTING_FEE.founding} for founding sellers) that sellers pay to list a vehicle on
          Private Wheels. It forms part of our <Link href="/legal/terms">Terms of Use</Link>.
          Private Wheels isn&apos;t a party to any vehicle sale, so we can&apos;t refund money
          paid between a buyer and a seller.
        </p>
      </LegalSection>

      <LegalSection id="when" title="2. When you get a refund">
        <ul>
          <li>
            <strong>Your listing is rejected in review:</strong> you get a full refund,
            automatically. You don&apos;t need to ask.
          </li>
          <li>
            <strong>You cancel before your listing is approved:</strong> you get a full
            refund, whether it&apos;s still waiting for review or we&apos;ve asked you for
            changes.
          </li>
          <li>
            <strong>Founding sellers:</strong> if you paid the founding price before launch,
            you can cancel any time before launch day for a full refund, even if your
            listing has already been approved.
          </li>
          <li>
            <strong>Duplicate or wrong charges:</strong> if you&apos;re charged twice, or
            charged the wrong amount, we&apos;ll always refund the extra.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="changes-requested" title="3. Changes requested">
        <p>
          If our reviewers ask you to change something in your listing, such as clearer
          photos or a missing detail, making the change and resubmitting never costs extra.
          You can also cancel instead and get a full refund.
        </p>
      </LegalSection>

      <LegalSection id="no-refund" title="4. When there's no refund">
        <p>
          Once your listing is approved and live on the marketplace, the fee isn&apos;t
          refundable. The service you paid for (reviewing and publishing your listing) has
          been delivered. This applies even if your car sells quickly, you sell it
          elsewhere, or you remove the listing yourself.
        </p>
        <p>
          The same applies if we remove a live listing because it broke our{" "}
          <Link href="/legal/terms">Terms of Use</Link>, for example because it was
          fraudulent or misleading.
        </p>
      </LegalSection>

      <LegalSection id="cooling-off" title="5. The ECTA cooling-off period">
        <p>
          Section 44 of the Electronic Communications and Transactions Act usually gives you
          7 days to cancel an online purchase. However, under section 42(2)(a) that
          cooling-off right doesn&apos;t apply to services that begin, with your consent,
          before the 7 days are up.
        </p>
        <p>
          <strong>
            Our listing service begins, with your consent, as soon as you submit your
            listing and pay
          </strong>
          , because that&apos;s when it enters our review queue. So the statutory cooling-off
          period doesn&apos;t apply. Instead, this policy gives you a full refund for any
          reason up until your listing is approved, which in most cases is more generous.
        </p>
      </LegalSection>

      <LegalSection id="how" title="6. How to ask for a refund">
        <p>
          Email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> from the address on
          your account, with your listing or payment reference. You can also WhatsApp us on{" "}
          {BUSINESS.phone}. Rejected listings are refunded automatically, so there&apos;s no
          need to contact us for those.
        </p>
        <p>
          Refunds go back to the original payment method through Paystack. They usually
          reflect within 5 to 10 working days, depending on your bank. If you haven&apos;t
          received yours after 10 working days, let us know and we&apos;ll follow up.
        </p>
      </LegalSection>

      <LegalSection id="questions" title="7. Questions or disputes">
        <p>
          If you disagree with a refund decision, email us and we&apos;ll look at it again.
          The complaints and dispute process in our{" "}
          <Link href="/legal/terms#disputes">Terms of Use</Link> applies, and nothing in this
          policy affects your rights under the Consumer Protection Act.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
