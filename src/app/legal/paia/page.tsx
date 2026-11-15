import type { Metadata } from "next";
import Link from "next/link";
import { BusinessContact, LegalDocument, LegalSection, LegalTable } from "@/components/legal/legal-document";
import { BUSINESS, INFORMATION_REGULATOR } from "@/lib/legal";

export const metadata: Metadata = {
  title: "PAIA Manual | Private Wheels",
  description:
    "Private Wheels' manual under section 51 of the Promotion of Access to Information Act: the records we keep and how to request them.",
};

/**
 * PAIA manual (section 51 of the Promotion of Access to Information Act 2 of
 * 2000, as amended by POPIA). Every private body has needed one since the
 * small-business exemption lapsed on 31 December 2021. It must be available
 * on the website and at the principal place of business.
 */
export default function PaiaManualPage() {
  return (
    <LegalDocument
      title="PAIA Manual"
      summary={
        <p>
          The Promotion of Access to Information Act (PAIA) lets you ask for records we hold,
          subject to the limits the Act sets. This manual explains what records Private Wheels
          keeps, how we handle personal information, and how to make a request. To ask for
          your own personal information, the simplest route is our{" "}
          <Link href="/legal/privacy">Privacy Policy</Link>.
        </p>
      }
    >
      <LegalSection id="about" title="1. About this manual">
        <p>
          This is the manual of {BUSINESS.legalName} (registration number{" "}
          {BUSINESS.registrationNumber}), trading as {BUSINESS.tradingName}, prepared under
          section 51 of the Promotion of Access to Information Act 2 of 2000 (PAIA). Private
          Wheels runs an online marketplace where private sellers list vehicles for sale and
          buyers contact them directly.
        </p>
        <p>
          It&apos;s available free of charge on our website and at our address below. If you
          need a printed copy, ask us and we&apos;ll send one.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="2. Contact details">
        <ul>
          <li>
            <strong>Head of the private body and Information Officer:</strong>{" "}
            {BUSINESS.informationOfficer}
          </li>
          <li>
            <strong>Email for PAIA and privacy requests:</strong>{" "}
            <a href={`mailto:${BUSINESS.informationOfficerEmail}`}>{BUSINESS.informationOfficerEmail}</a>
          </li>
          <li>
            <strong>Physical and postal address:</strong> {BUSINESS.address}
          </li>
          <li>
            <strong>Phone:</strong> {BUSINESS.phone}
          </li>
          <li>
            <strong>Website:</strong>{" "}
            <a href={BUSINESS.website}>{BUSINESS.website.replace("https://", "")}</a>
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="guide" title="3. The Information Regulator's guide">
        <p>
          The Information Regulator has published a guide on how to use PAIA and POPIA to
          exercise your rights (section 10 of PAIA). It&apos;s available in all official
          languages from the Regulator:
        </p>
        <ul>
          <li>Website: <a href={INFORMATION_REGULATOR.website}>{INFORMATION_REGULATOR.website.replace("https://", "")}</a></li>
          <li>
            Email: <a href={`mailto:${INFORMATION_REGULATOR.email}`}>{INFORMATION_REGULATOR.email}</a>
          </li>
          <li>Phone: {INFORMATION_REGULATOR.phone}</li>
          <li>Address: {INFORMATION_REGULATOR.address}</li>
        </ul>
      </LegalSection>

      <LegalSection id="available" title="4. Records available without a request">
        <p>You can read these on our website at any time, without making a PAIA request:</p>
        <ul>
          <li>
            Our <Link href="/legal/terms">Terms of Use</Link>,{" "}
            <Link href="/legal/privacy">Privacy Policy</Link> and{" "}
            <Link href="/legal/refunds">Refund Policy</Link>
          </li>
          <li>This PAIA manual</li>
          <li>Live vehicle listings and the information on them</li>
        </ul>
        <p>
          Sellers can also see their own account details, listings, listing statuses and
          payments in their dashboard at any time.
        </p>
      </LegalSection>

      <LegalSection id="legislation" title="5. Records kept under other laws">
        <p>
          We keep records as required by, among others, the following laws. Where a law makes a
          record available to the public, you can ask for it in terms of that law.
        </p>
        <ul>
          <li>Companies Act 71 of 2008</li>
          <li>Income Tax Act 58 of 1962 and Tax Administration Act 28 of 2011</li>
          <li>Value-Added Tax Act 89 of 1991</li>
          <li>Protection of Personal Information Act 4 of 2013 (POPIA)</li>
          <li>Promotion of Access to Information Act 2 of 2000</li>
          <li>Consumer Protection Act 68 of 2008</li>
          <li>Electronic Communications and Transactions Act 25 of 2002</li>
          <li>Basic Conditions of Employment Act 75 of 1997 and Labour Relations Act 66 of 1995 (if we have employees)</li>
        </ul>
      </LegalSection>

      <LegalSection id="records" title="6. Subjects and categories of records we hold">
        <LegalTable>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Categories of records</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Company</td>
              <td>Registration documents, memorandum of incorporation, directors&apos; details, resolutions</td>
            </tr>
            <tr>
              <td>Finance and tax</td>
              <td>Financial statements, accounting records, tax and VAT records, bank records</td>
            </tr>
            <tr>
              <td>Sellers (account holders)</td>
              <td>
                Account details, contact details, listings and photos, review decisions,
                identity verification results, payment and refund records, emails we&apos;ve sent
              </td>
            </tr>
            <tr>
              <td>Buyers and visitors</td>
              <td>
                Enquiries sent to sellers through the site, coming-soon lead form submissions,
                and website analytics (only with consent)
              </td>
            </tr>
            <tr>
              <td>Suppliers and partners</td>
              <td>Agreements and correspondence with our service providers and partners</td>
            </tr>
            <tr>
              <td>Website and systems</td>
              <td>Technical and security logs, system configuration</td>
            </tr>
          </tbody>
        </LegalTable>
        <p>
          Listing a category here doesn&apos;t mean a record will be released. Each request is
          considered under the grounds in section 9 below.
        </p>
      </LegalSection>

      <LegalSection id="personal-information" title="7. How we process personal information">
        <p>
          POPIA requires this manual to describe our processing of personal information. Our{" "}
          <Link href="/legal/privacy">Privacy Policy</Link> sets this out in full; in short:
        </p>
        <ul>
          <li>
            <strong>Purposes:</strong> running seller accounts and listings, reviewing
            listings, verifying sellers&apos; identity, processing payments and refunds,
            passing buyers&apos; enquiries to sellers, sending service emails, improving the
            website (analytics, with consent), and meeting our legal obligations.
          </li>
          <li>
            <strong>Categories of data subjects and information:</strong> sellers (name,
            contact details, account and listing information, identity verification results,
            payment records); buyers and visitors (enquiry details, lead form details, and
            website usage with consent); our suppliers&apos; contact people.
          </li>
          <li>
            <strong>Recipients:</strong> the service providers listed in our Privacy Policy
            (hosting, database, payments, identity verification, email and analytics), buyers
            (information sellers choose to show on a listing), sellers (enquiries sent to them),
            our professional advisers, and authorities where the law requires it.
          </li>
          <li>
            <strong>Cross-border transfers:</strong> some of our providers process information
            outside South Africa. We only do this as POPIA section 72 allows, as described in
            our Privacy Policy.
          </li>
          <li>
            <strong>Security:</strong> access is limited to people who need it, accounts are
            protected by passwords and bot checks, connections are encrypted, card details are
            handled only by Paystack, and we don&apos;t store ID numbers or selfies (Smile ID
            does the identity check).
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="request" title="8. How to make a request">
        <ol>
          <li>
            Complete the prescribed request form for private bodies (Form 2 of the PAIA
            Regulations), available from the{" "}
            <a href={INFORMATION_REGULATOR.website}>Information Regulator&apos;s website</a> or
            from us on request.
          </li>
          <li>
            Send it to our Information Officer by email to{" "}
            <a href={`mailto:${BUSINESS.informationOfficerEmail}`}>{BUSINESS.informationOfficerEmail}</a>{" "}
            or by post to the address above. Describe the record clearly, say how you&apos;d
            like access (for example, an electronic copy), and, if you&apos;re asking on
            someone else&apos;s behalf, include proof that you may do so.
          </li>
          <li>
            Explain which right you want to exercise or protect, and why the record is needed
            for that (section 53 of PAIA).
          </li>
          <li>
            We may charge the request and access fees set out in the PAIA Regulations. We&apos;ll
            tell you the amount before we process your request. If you&apos;re asking for your
            own personal information, there&apos;s no request fee, though access fees (such as
            for copies) may still apply.
          </li>
          <li>
            We&apos;ll respond within 30 days of receiving a complete request. We may extend
            this once, by up to 30 days, in the circumstances PAIA allows, and we&apos;ll tell
            you if we do.
          </li>
        </ol>
      </LegalSection>

      <LegalSection id="refusal" title="9. When we may refuse access">
        <p>PAIA requires or allows us to refuse access in certain cases (Chapter 4 of Part 3), including to protect:</p>
        <ul>
          <li>the privacy of another person;</li>
          <li>commercial information of a third party, or our own trade secrets and commercially sensitive information;</li>
          <li>confidential information of a third party;</li>
          <li>the safety of people and property;</li>
          <li>records privileged from production in legal proceedings;</li>
          <li>research information.</li>
        </ul>
        <p>
          Requests that are clearly frivolous or vexatious, or would take an unreasonable amount
          of work, may also be refused. If we refuse, we&apos;ll give you our reasons in
          writing.
        </p>
      </LegalSection>

      <LegalSection id="remedies" title="10. If you disagree with our decision">
        <p>
          We don&apos;t have an internal appeal process. If you&apos;re unhappy with our
          decision, you can lodge a complaint with the Information Regulator (contact details
          in section 3) within 180 days, or apply to court.
        </p>
      </LegalSection>

      <LegalSection id="updates" title="11. Updates and our details">
        <p>
          We review this manual when our records or processing change. The date at the top
          shows when it was last updated.
        </p>
        <BusinessContact />
      </LegalSection>
    </LegalDocument>
  );
}
