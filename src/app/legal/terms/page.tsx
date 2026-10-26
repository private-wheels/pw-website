import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument, LegalSection } from "@/components/legal/legal-document";
import { BUSINESS, LISTING_FEE } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Use | Private Wheels",
  description:
    "The terms for using Private Wheels, including seller terms, listing rules and the listing fee.",
};

export default function TermsOfUsePage() {
  return (
    <LegalDocument
      title="Terms of Use"
      summary={
        <p>
          Private Wheels is a place for private sellers to list cars and for buyers to find
          them. We&apos;re not the seller, the buyer or a dealer, and we&apos;re not part of
          any sale. Sellers pay a once-off {LISTING_FEE.standard} fee per listing, every
          listing is checked by a person before it goes live, and scams, fake listings and
          cars you&apos;re not allowed to sell aren&apos;t welcome.
        </p>
      }
    >
      <LegalSection id="agreement" title="1. These terms">
        <p>
          These Terms of Use (&ldquo;terms&rdquo;) are an agreement between you and{" "}
          {BUSINESS.legalName}, trading as {BUSINESS.tradingName} (&ldquo;we&rdquo;,
          &ldquo;us&rdquo;, &ldquo;our&rdquo;). They apply whenever you use{" "}
          {BUSINESS.website.replace("https://", "")} or any related service
          (&ldquo;Private Wheels&rdquo;), whether you&apos;re browsing, buying or selling.
        </p>
        <p>
          By creating an account or using Private Wheels you agree to these terms, our{" "}
          <Link href="/legal/privacy">Privacy Policy</Link> and our{" "}
          <Link href="/legal/refunds">Refund Policy</Link>. If you don&apos;t agree, please
          don&apos;t use the site.
        </p>
        <p>
          Some clauses limit our liability, place risk on you, or require you to indemnify
          us. They&apos;re in <strong>bold</strong> so you can easily spot them. Please read
          them carefully.
        </p>
      </LegalSection>

      <LegalSection id="our-role" title="2. What Private Wheels is (and isn't)">
        <p>
          Private Wheels is an online listing platform. We let private sellers advertise
          their vehicles and let buyers contact them.{" "}
          <strong>
            We are not a party to any sale between a buyer and a seller. We don&apos;t own,
            inspect, sell, buy, finance, insure or deliver vehicles, and we don&apos;t act
            as anyone&apos;s agent.
          </strong>
        </p>
        <p>Any sale is a private agreement between the buyer and the seller. That means:</p>
        <ul>
          <li>
            the seller is responsible for the accuracy of their listing and for having the
            right to sell the vehicle;
          </li>
          <li>
            the buyer is responsible for inspecting the vehicle, checking its papers and
            history, and deciding whether to buy;
          </li>
          <li>
            the buyer and seller agree the price, payment and handover between themselves,
            and are responsible for the change of ownership with the licensing authority;
            and
          </li>
          <li>
            we don&apos;t guarantee the condition, roadworthiness, history, title or value of
            any vehicle, or that a sale will happen.
          </li>
        </ul>
        <p>
          Our review process (section 6) helps keep listings honest, but it&apos;s not a
          vehicle inspection and doesn&apos;t replace your own checks. We recommend buyers
          see the car in person, check the registration papers against the ID of the
          seller, get a roadworthy and independent inspection, and never pay a deposit for
          a car they haven&apos;t seen.
        </p>
      </LegalSection>

      <LegalSection id="accounts" title="3. Your account">
        <ul>
          <li>You must be at least 18 years old to create an account.</li>
          <li>The information you give us must be true, complete and kept up to date.</li>
          <li>
            Keep your password secret. You&apos;re responsible for everything done through
            your account, so tell us straight away if you think someone else has accessed
            it.
          </li>
          <li>One person, one account. Don&apos;t create accounts for someone else.</li>
        </ul>
      </LegalSection>

      <LegalSection id="listing-fee" title="4. The listing fee">
        <ul>
          <li>
            Listing a vehicle costs a <strong>once-off fee of {LISTING_FEE.standard}</strong>{" "}
            per listing, including VAT if applicable. There are no monthly charges, no
            commission on the sale and no hidden costs.
          </li>
          <li>
            <strong>Founding sellers:</strong> listings paid for before our public launch
            cost {LISTING_FEE.founding} instead. The founding price ends on launch day.
          </li>
          <li>
            From time to time we may offer vouchers or promotional codes (for example, a free
            first listing). These are subject to the conditions we communicate with them,
            have no cash value and can&apos;t be transferred.
          </li>
          <li>
            You pay when you submit your listing for review. Payments are processed securely
            by Paystack, by card or any other method Paystack offers at checkout. We never
            see or store your card details.
          </li>
          <li>
            The fee covers reviewing your listing and showing it on Private Wheels until you
            mark it as sold or remove it, or until we remove it under these terms.
          </li>
          <li>
            If we change our prices, the new price applies only to listings submitted after
            the change.
          </li>
          <li>
            Refunds are covered by our <Link href="/legal/refunds">Refund Policy</Link>.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="seller-terms" title="5. Seller terms">
        <p>When you list a vehicle, you confirm that:</p>
        <ul>
          <li>
            you own the vehicle, or you&apos;re authorised in writing by the owner to sell
            it;
          </li>
          <li>
            if the vehicle is financed, you&apos;ll tell buyers and settle the finance (or
            arrange with the bank) before ownership passes;
          </li>
          <li>
            the vehicle isn&apos;t stolen, cloned, the subject of a police report, or
            otherwise unlawful to sell;
          </li>
          <li>
            your listing is accurate and honest, including the make, model, year, mileage,
            condition, service history and any accident damage you know of;
          </li>
          <li>
            the photos are of the actual vehicle and were taken by you or with permission;
            and
          </li>
          <li>you&apos;ll update or remove the listing promptly once the vehicle is sold.</li>
        </ul>
        <p>
          You keep ownership of your photos and description. You give us a non-exclusive,
          royalty-free licence to display, resize and crop them on Private Wheels and in
          our promotion of your listing (for example on social media) for as long as your
          listing is live, plus a reasonable time afterwards for content already shared.
        </p>
      </LegalSection>

      <LegalSection id="review" title="6. Listing review">
        <p>
          <strong>Every listing is reviewed by our team before it goes live.</strong> After
          you submit and pay, we&apos;ll do one of the following:
        </p>
        <ul>
          <li>
            <strong>Approve it</strong>, and your listing goes live on the marketplace (or on
            launch day, for founding sellers);
          </li>
          <li>
            <strong>Request changes</strong>, telling you what to fix, such as unclear photos
            or missing details. Requested changes never cost extra; or
          </li>
          <li>
            <strong>Reject it</strong>, if it breaks these terms or we can&apos;t verify it.
            You&apos;ll get a full refund, as set out in our{" "}
            <Link href="/legal/refunds">Refund Policy</Link>.
          </li>
        </ul>
        <p>
          We may also remove a live listing, or ask you to change it, if we later find it
          breaks these terms or receive a credible complaint about it. If we remove a live
          listing because you broke these terms, you won&apos;t get a refund.
        </p>
        <p>
          We try to review listings within [REVIEW TURNAROUND, e.g. 1 working day], but we
          don&apos;t guarantee a time.
        </p>
      </LegalSection>

      <LegalSection id="listing-rules" title="7. Listing rules">
        <p>Listings must not:</p>
        <ul>
          <li>be for a vehicle you don&apos;t own or aren&apos;t authorised to sell;</li>
          <li>
            be from a dealer or trader posing as a private seller (Private Wheels is for
            private sellers only);
          </li>
          <li>
            contain false, misleading or incomplete information, or photos of a different
            vehicle;
          </li>
          <li>be a scam, a bait advert, or a listing for a car that isn&apos;t available;</li>
          <li>
            ask buyers to pay a deposit, &ldquo;holding fee&rdquo; or transport fee before
            seeing the vehicle, or to pay anyone other than the registered owner;
          </li>
          <li>duplicate a vehicle that is already listed;</li>
          <li>
            include other people&apos;s personal information, offensive content, or links to
            other selling platforms; or
          </li>
          <li>break any law, including the Consumer Protection Act and road traffic laws.</li>
        </ul>
        <p>
          We report suspected fraud and stolen vehicles to the South African Police Service.
        </p>
      </LegalSection>

      <LegalSection id="acceptable-use" title="8. Acceptable use">
        <p>Everyone using Private Wheels, buyers included, agrees not to:</p>
        <ul>
          <li>use the site for fraud, harassment, spam or anything unlawful;</li>
          <li>
            collect sellers&apos; contact details for marketing, resale or any purpose other
            than enquiring about a vehicle;
          </li>
          <li>
            scrape, copy or republish listings, or use bots or automated tools on the site
            without our written permission;
          </li>
          <li>
            interfere with the site&apos;s security or operation, or try to access accounts
            or data that aren&apos;t yours; or
          </li>
          <li>impersonate anyone, including Private Wheels staff.</li>
        </ul>
        <p>
          If you see a listing or user you think is breaking these rules, please tell us at{" "}
          <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>.
        </p>
      </LegalSection>

      <LegalSection id="suspension" title="9. Suspending or closing accounts">
        <p>
          We may suspend or close your account, or remove your listings, if you break these
          terms, if we reasonably suspect fraud, or if the law requires it. Where it&apos;s
          safe and lawful to do so, we&apos;ll tell you why. You can close your account at
          any time by emailing us.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="10. Limits on our liability">
        <p>
          <strong>
            We provide Private Wheels &ldquo;as is&rdquo;. We work hard to keep it running
            and accurate, but we don&apos;t promise it will always be available or error-free.
          </strong>
        </p>
        <p>
          <strong>
            To the extent the law allows, we&apos;re not liable for any loss or damage
            arising from: a sale or attempted sale between users; the condition, history or
            ownership of any vehicle; anything a buyer or seller says or does; fraud by
            another user; or the site being unavailable. We&apos;re also not liable for
            indirect or consequential loss, such as lost profit or opportunity.
          </strong>
        </p>
        <p>
          <strong>
            If we are liable to you for anything, our total liability is limited to the
            listing fees you paid us in the 12 months before the claim.
          </strong>
        </p>
        <p>
          Nothing in these terms limits our liability for gross negligence or wilful
          misconduct, or takes away any rights you have under the Consumer Protection Act
          68 of 2008 or any other law that can&apos;t be excluded.
        </p>
      </LegalSection>

      <LegalSection id="indemnity" title="11. Indemnity">
        <p>
          <strong>
            You indemnify us against any claim, loss or cost (including reasonable legal
            costs) that arises because you broke these terms or the law, or from a vehicle
            you listed or bought through Private Wheels.
          </strong>
        </p>
      </LegalSection>

      <LegalSection id="ecta" title="12. Information we must give you (ECTA section 43)">
        <p>
          Section 43 of the Electronic Communications and Transactions Act 25 of 2002
          requires us to share the following:
        </p>
        <ul>
          <li>
            <strong>Full name and legal status:</strong> {BUSINESS.legalName}, a private
            company registered in South Africa, trading as {BUSINESS.tradingName}
          </li>
          <li>
            <strong>Registration number:</strong> {BUSINESS.registrationNumber}
          </li>
          <li>
            <strong>VAT number:</strong> {BUSINESS.vatNumber}
          </li>
          <li>
            <strong>Directors:</strong> {BUSINESS.directors}
          </li>
          <li>
            <strong>Physical address, and address for service of legal documents:</strong>{" "}
            {BUSINESS.address}
          </li>
          <li>
            <strong>Phone and WhatsApp:</strong> {BUSINESS.phone}
          </li>
          <li>
            <strong>Email:</strong> <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
          </li>
          <li>
            <strong>Website:</strong> {BUSINESS.website}
          </li>
          <li>
            <strong>Service and price:</strong> online vehicle listings for private sellers,
            at a once-off fee of {LISTING_FEE.standard} per listing ({LISTING_FEE.founding}{" "}
            for founding sellers before launch). There are no delivery or other costs
          </li>
          <li>
            <strong>Payment:</strong> processed by Paystack using the methods shown at
            checkout
          </li>
          <li>
            <strong>Delivery:</strong> the service begins when you submit your listing, and
            your listing goes live once approved
          </li>
          <li>
            <strong>Transaction records:</strong> your payment confirmation is emailed to
            you, and your listings and their status are available in your dashboard
          </li>
          <li>
            <strong>Refunds and cancellation:</strong> see our{" "}
            <Link href="/legal/refunds">Refund Policy</Link>, which also explains the ECTA
            cooling-off position (section 44)
          </li>
          <li>
            <strong>Privacy and security:</strong> see our{" "}
            <Link href="/legal/privacy">Privacy Policy</Link>. Card payments are handled by
            Paystack, which is PCI-DSS certified
          </li>
          <li>
            <strong>Self-regulatory bodies and codes of conduct:</strong> we don&apos;t
            currently belong to any self-regulatory body or subscribe to an industry code of
            conduct
          </li>
          <li>
            <strong>Alternative dispute resolution:</strong> see section 13 below
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="disputes" title="13. Complaints and disputes">
        <p>
          If you have a complaint about Private Wheels, please email{" "}
          <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or WhatsApp us on{" "}
          {BUSINESS.phone}. We&apos;ll acknowledge it within 2 working days and try to
          resolve it within 14 days.
        </p>
        <p>
          If we can&apos;t resolve it together, either of us may refer the dispute to
          mediation by a mutually agreed mediator before going to court. You can also
          approach the Consumer Goods and Services Ombud or the National Consumer
          Commission where the Consumer Protection Act applies.
        </p>
        <p>
          Disputes between buyers and sellers are for them to resolve between themselves,
          but please tell us about any fraud so we can act on the listing.
        </p>
      </LegalSection>

      <LegalSection id="general" title="14. General">
        <ul>
          <li>
            <strong>Governing law:</strong> these terms are governed by the laws of the
            Republic of South Africa, and South African courts have jurisdiction.
          </li>
          <li>
            <strong>Changes:</strong> we may update these terms from time to time. The date
            at the top shows when they last changed, and we&apos;ll tell you about material
            changes before they take effect. Changes don&apos;t affect listings already paid
            for.
          </li>
          <li>
            <strong>Severability:</strong> if any part of these terms is found invalid, the
            rest still applies.
          </li>
          <li>
            <strong>No waiver:</strong> if we don&apos;t enforce a right straight away, we
            haven&apos;t given it up.
          </li>
          <li>
            <strong>Notices:</strong> we&apos;ll send notices to the email address on your
            account. You can send notices to us at{" "}
            <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or the physical
            address above.
          </li>
          <li>
            <strong>Whole agreement:</strong> these terms, our Privacy Policy and our Refund
            Policy are the whole agreement between you and us about Private Wheels.
          </li>
        </ul>
      </LegalSection>
    </LegalDocument>
  );
}
