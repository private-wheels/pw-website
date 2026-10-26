import type { Metadata } from "next";
import Link from "next/link";
import {
  BusinessContact,
  LegalDocument,
  LegalSection,
  LegalTable,
} from "@/components/legal/legal-document";
import { BUSINESS, INFORMATION_REGULATOR } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy | Private Wheels",
  description:
    "How Private Wheels collects, uses and protects your personal information under POPIA.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      summary={
        <>
          <p>
            We collect only what we need to run a private car marketplace: your account
            details, your listings, payment records (never your card number) and messages
            you send us. Your listing is public once it goes live. We don&apos;t sell your
            information, we only send marketing if you say yes, and you can ask us to see,
            fix or delete your information at any time.
          </p>
        </>
      }
    >
      <LegalSection id="introduction" title="1. About this policy">
        <p>
          This policy explains how {BUSINESS.tradingName} handles your personal information
          when you visit our website, join our pre-launch list, create an account, list a
          car, pay a listing fee or contact us. It&apos;s written to meet the Protection of
          Personal Information Act 4 of 2013 (&ldquo;POPIA&rdquo;), and the words
          &ldquo;personal information&rdquo;, &ldquo;processing&rdquo;, &ldquo;responsible
          party&rdquo;, &ldquo;operator&rdquo; and &ldquo;data subject&rdquo; mean what they
          mean in POPIA.
        </p>
        <p>
          Please read it together with our <Link href="/legal/terms">Terms of Use</Link> and{" "}
          <Link href="/legal/refunds">Refund Policy</Link>.
        </p>
      </LegalSection>

      <LegalSection id="who-we-are" title="2. Who we are (the responsible party)">
        <p>
          The responsible party for your personal information is {BUSINESS.legalName},
          trading as {BUSINESS.tradingName} (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
          &ldquo;our&rdquo;).
        </p>
        <BusinessContact />
        <h3>Information Officer</h3>
        <p>
          Our Information Officer is responsible for making sure we comply with POPIA. You
          can contact them directly about anything in this policy:
        </p>
        <ul>
          <li>Name: {BUSINESS.informationOfficer}</li>
          <li>
            Email:{" "}
            <a href={`mailto:${BUSINESS.informationOfficerEmail}`}>
              {BUSINESS.informationOfficerEmail}
            </a>
          </li>
          <li>Postal and physical address: {BUSINESS.address}</li>
        </ul>
      </LegalSection>

      <LegalSection id="what-we-collect" title="3. What we collect, why, and on what basis">
        <p>
          POPIA only lets us process personal information if we have a lawful reason
          (section 11). The table below sets out what we collect, what we use it for and the
          lawful reason we rely on.
        </p>
        <LegalTable>
          <thead>
            <tr>
              <th>Information</th>
              <th>What we use it for</th>
              <th>Lawful basis</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Account details:</strong> email address and password (we only ever
                store a one-way hashed version of your password, never the password itself)
              </td>
              <td>Creating your account, signing you in, account and security emails</td>
              <td>Needed to perform our contract with you (s11(1)(b))</td>
            </tr>
            <tr>
              <td>
                <strong>Contact details:</strong> your name and phone number
              </td>
              <td>
                Showing buyers how to reach you (if you choose to), contacting you about
                your listing or payment, and support
              </td>
              <td>Contract (s11(1)(b)); your consent where you choose to display them</td>
            </tr>
            <tr>
              <td>
                <strong>Listing details and photos:</strong> make, model, year, mileage,
                price, condition, location, description and photos of the vehicle
              </td>
              <td>
                Reviewing your listing and publishing it on the marketplace.{" "}
                <strong>Once approved, your listing is public</strong> and anyone can see it
              </td>
              <td>Contract (s11(1)(b))</td>
            </tr>
            <tr>
              <td>
                <strong>Payment metadata:</strong> amount, date, payment reference, status,
                and the card type and last four digits that Paystack returns
              </td>
              <td>
                Confirming your listing fee, processing refunds, accounting and tax records,
                preventing fraud
              </td>
              <td>
                Contract (s11(1)(b)); legal obligations such as tax record-keeping
                (s11(1)(c)); our legitimate interest in preventing fraud (s11(1)(f))
              </td>
            </tr>
            <tr>
              <td>
                <strong>Pre-launch list and messages:</strong> the name and mobile number
                you leave on our coming-soon form, whether you agreed to marketing, and any
                WhatsApp messages or emails you send us
              </td>
              <td>
                Contacting you about your request, sending your launch voucher, answering
                questions, and (only if you agreed) launch news and offers
              </td>
              <td>
                Steps you asked us to take before entering a contract (s11(1)(b)); your
                consent for marketing (s11(1)(a) and s69)
              </td>
            </tr>
            <tr>
              <td>
                <strong>Technical information:</strong> IP address, browser type, device
                information and server logs
              </td>
              <td>Keeping the site secure and working, investigating abuse and errors</td>
              <td>Our legitimate interest in running a secure service (s11(1)(f))</td>
            </tr>
            <tr>
              <td>
                <strong>Identity verification (coming later):</strong> your ID document,
                ID number, a selfie or short video, and the verification result
              </td>
              <td>
                Confirming that sellers are who they say they are, to protect buyers from
                scams. This may involve <strong>biometric information</strong> (a
                comparison of your face with your ID photo)
              </td>
              <td>
                Your explicit consent (s27(1)(a)), which we&apos;ll ask for separately
                before you start verification
              </td>
            </tr>
          </tbody>
        </LegalTable>
        <p>
          We collect this information directly from you. Paystack and, later, Smile ID send
          us the outcome of a payment or verification, but not your full card or biometric
          details. You&apos;re not obliged to give us any of it, but without the account and
          listing details we can&apos;t list your car.
        </p>
        <h3>Card details</h3>
        <p>
          Payments are handled by Paystack. You enter your card details on Paystack&apos;s
          secure payment page and{" "}
          <strong>Private Wheels never sees, receives or stores your card number</strong>,
          expiry date or CVV.
        </p>
        <h3>Special personal information</h3>
        <p>
          Biometric information is &ldquo;special personal information&rdquo; under POPIA.
          We will only process it once identity verification is introduced, only with your
          explicit consent, and only to verify your identity. You can choose not to verify,
          although some features (such as a &ldquo;verified seller&rdquo; badge) may then
          not be available to you.
        </p>
        <h3>Children</h3>
        <p>
          Private Wheels is meant for adults. You must be 18 or older to create an account
          or list a car, and we don&apos;t knowingly collect information about children.
        </p>
      </LegalSection>

      <LegalSection id="sharing" title="4. Who we share it with">
        <p>
          We don&apos;t sell or rent your personal information. We share it only with the
          service providers (&ldquo;operators&rdquo;) who help us run Private Wheels, and only
          what each one needs. Each is bound by a written agreement that requires them to
          keep your information confidential and secure, as POPIA sections 20 and 21
          require.
        </p>
        <LegalTable>
          <thead>
            <tr>
              <th>Provider</th>
              <th>What they do for us</th>
              <th>What they process</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Supabase</strong>
              </td>
              <td>Database, sign-in (authentication) and photo storage</td>
              <td>Account, contact, listing and payment records; listing photos</td>
            </tr>
            <tr>
              <td>
                <strong>Paystack</strong>
              </td>
              <td>Card payments and refunds</td>
              <td>Your card details (directly, not via us), email and payment amount</td>
            </tr>
            <tr>
              <td>
                <strong>Resend</strong>
              </td>
              <td>Sending emails, such as sign-up confirmations and lead alerts</td>
              <td>Email address, name and the content of the email</td>
            </tr>
            <tr>
              <td>
                <strong>Vercel</strong>
              </td>
              <td>Hosting the website</td>
              <td>Technical information and anything you submit through the site</td>
            </tr>
            <tr>
              <td>
                <strong>Meta (WhatsApp Cloud API)</strong>
              </td>
              <td>
                Alerting our team on WhatsApp when someone fills in our forms, and handling
                WhatsApp chats you start with us
              </td>
              <td>Name, mobile number and message content</td>
            </tr>
            <tr>
              <td>
                <strong>Smile ID</strong> (once introduced)
              </td>
              <td>Identity verification</td>
              <td>ID document, ID number, selfie or video, and the verification result</td>
            </tr>
          </tbody>
        </LegalTable>
        <p>We may also share personal information:</p>
        <ul>
          <li>
            with buyers, through your public listing and any contact details you choose to
            show on it;
          </li>
          <li>
            with our professional advisers (such as attorneys and accountants), who are
            bound by confidentiality;
          </li>
          <li>
            when the law requires it, for example a court order, or a request from SARS or
            the South African Police Service; and
          </li>
          <li>
            to protect our users or the public, for example by reporting a suspected scam or
            stolen vehicle to the police.
          </li>
        </ul>
        <p>
          If Private Wheels is ever sold or merged, your information may pass to the new
          owner, who must keep protecting it in line with this policy.
        </p>
      </LegalSection>

      <LegalSection id="cross-border" title="5. Sending information outside South Africa">
        <p>
          Some of our providers store or process information on servers outside South
          Africa, for example in the European Union, the United Kingdom or the United
          States. Section 72 of POPIA allows this only in certain cases. We rely on the
          following:
        </p>
        <ul>
          <li>
            the provider is bound by a law, binding corporate rules or a binding agreement
            (such as a data processing agreement) that gives your information protection
            substantially similar to POPIA (s72(1)(a));
          </li>
          <li>
            the transfer is necessary to perform our contract with you, for example to host
            your listing or process your payment (s72(1)(c)); and
          </li>
          <li>
            by using Private Wheels after reading this policy, you consent to the transfer
            (s72(1)(b)).
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="retention" title="6. How long we keep it">
        <p>
          We keep personal information only as long as we need it for the reasons above, or
          as long as the law requires (POPIA section 14). Then we delete or de-identify it.
        </p>
        <LegalTable>
          <thead>
            <tr>
              <th>Information</th>
              <th>How long</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Account and contact details</td>
              <td>While your account is open, and 12 months after you close it</td>
            </tr>
            <tr>
              <td>Listings and photos</td>
              <td>
                Taken off the public site as soon as the listing is sold, removed or
                rejected; kept privately for 12 months after that to handle disputes and
                fraud reports
              </td>
            </tr>
            <tr>
              <td>Payment and refund records</td>
              <td>
                5 years from the transaction, as tax and company laws require (such as the
                Tax Administration Act and the Companies Act)
              </td>
            </tr>
            <tr>
              <td>Pre-launch list and messages</td>
              <td>
                Until 12 months after launch, unless you become a customer or ask us to
                delete them sooner
              </td>
            </tr>
            <tr>
              <td>Marketing preferences</td>
              <td>
                Until you unsubscribe; after that, we keep a record of your opt-out so we
                don&apos;t contact you again
              </td>
            </tr>
            <tr>
              <td>Identity verification</td>
              <td>
                The verification result while your account is open and 12 months after you
                close it; ID images and selfies for no longer than [ID IMAGE RETENTION
                PERIOD]
              </td>
            </tr>
            <tr>
              <td>Server and security logs</td>
              <td>Up to 90 days, unless needed to investigate an incident</td>
            </tr>
          </tbody>
        </LegalTable>
      </LegalSection>

      <LegalSection id="security" title="7. How we keep it safe">
        <p>
          We take reasonable technical and organisational steps to protect your information
          against loss, damage and unauthorised access (POPIA section 19), including:
        </p>
        <ul>
          <li>encrypting all traffic to and from the site (HTTPS);</li>
          <li>storing passwords only as one-way hashes;</li>
          <li>
            database rules (row-level security) so that you can only see and change your own
            account and unpublished listings;
          </li>
          <li>
            limiting staff access to those who need it, protected by strong passwords and,
            where available, two-factor authentication;
          </li>
          <li>leaving card handling entirely to Paystack, which is PCI-DSS certified; and</li>
          <li>choosing providers with recognised security practices and written agreements.</li>
        </ul>
        <p>
          No system is perfectly secure. If we believe your personal information has been
          accessed by someone without authority, we&apos;ll tell you and the Information
          Regulator as soon as reasonably possible, as section 22 of POPIA requires.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="8. Cookies">
        <p>
          We only use cookies that are strictly necessary for the site to work. We
          don&apos;t use advertising or tracking cookies, so we don&apos;t show a cookie
          banner.
        </p>
        <ul>
          <li>
            <strong>Sign-in session cookies</strong> (named <code>sb-…-auth-token</code>), set
            by Supabase to keep you signed in. They last until you sign out or the session
            expires.
          </li>
          <li>
            <strong>Preview-access cookie</strong> (<code>pw-preview</code>), set only for
            people we invite to preview the site before launch. It lasts one week.
          </li>
        </ul>
        <p>
          If we ever add analytics or other non-essential cookies, we&apos;ll update this
          policy and ask for your consent first.
        </p>
      </LegalSection>

      <LegalSection id="marketing" title="9. Direct marketing">
        <p>
          We only send you marketing by email, SMS or WhatsApp if you&apos;ve agreed to it
          (for example by ticking the box on our pre-launch form), or if you&apos;re already
          a customer and the message is about similar services from us, as section 69 of
          POPIA allows.
        </p>
        <p>
          Every marketing message tells you how to opt out, and you can also opt out at any
          time by emailing <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or
          replying &ldquo;STOP&rdquo; on WhatsApp. Opting out doesn&apos;t affect service
          messages about your account, listing or payment.
        </p>
      </LegalSection>

      <LegalSection id="your-rights" title="10. Your rights">
        <p>Under POPIA you have the right to:</p>
        <ul>
          <li>
            <strong>Access:</strong> ask whether we hold personal information about you and
            for a copy of it (section 23). We may charge a small fee allowed under the
            Promotion of Access to Information Act, and we&apos;ll tell you upfront.
          </li>
          <li>
            <strong>Correction and deletion:</strong> ask us to correct, update or delete
            information that is inaccurate, out of date, incomplete, excessive or that we
            no longer have a reason to keep (section 24).
          </li>
          <li>
            <strong>Objection:</strong> object to us processing your information based on
            our legitimate interests, and object to direct marketing at any time (section
            11(3)).
          </li>
          <li>
            <strong>Withdraw consent:</strong> withdraw any consent you&apos;ve given. This
            doesn&apos;t affect processing that already happened.
          </li>
          <li>
            <strong>Automated decisions:</strong> not to be subject to a decision based
            solely on automated processing that has legal or similarly significant effects
            on you (section 71). Listing reviews are done by people.
          </li>
          <li>
            <strong>Complain:</strong> lodge a complaint with the Information Regulator (see
            below).
          </li>
        </ul>
        <p>
          To use any of these rights, email{" "}
          <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or our Information
          Officer. We may ask you to prove your identity first, so we don&apos;t hand your
          information to someone else. We&apos;ll respond within a reasonable time, and
          normally within 30 days. You can also delete your listings yourself from your
          dashboard.
        </p>
        <p>
          Some information we must keep by law, such as payment records, even if you ask us
          to delete it. If so, we&apos;ll tell you what we kept and why.
        </p>
      </LegalSection>

      <LegalSection id="complaints" title="11. Complaints">
        <p>
          If you&apos;re unhappy with how we&apos;ve handled your information, please talk to
          us first so we can try to put it right. If you&apos;re still not satisfied, you
          have the right to complain to the Information Regulator:
        </p>
        <ul>
          <li>{INFORMATION_REGULATOR.name}</li>
          <li>Address: {INFORMATION_REGULATOR.address}</li>
          <li>
            Email:{" "}
            <a href={`mailto:${INFORMATION_REGULATOR.email}`}>{INFORMATION_REGULATOR.email}</a>
          </li>
          <li>Phone: {INFORMATION_REGULATOR.phone}</li>
          <li>
            Website and complaint forms:{" "}
            <a href={INFORMATION_REGULATOR.website} target="_blank" rel="noreferrer">
              {INFORMATION_REGULATOR.website.replace("https://", "")}
            </a>
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="changes" title="12. Changes to this policy">
        <p>
          We may update this policy as Private Wheels grows, for example when we introduce
          identity verification. The date at the top shows when it last changed. If a change
          materially affects how we use your information, we&apos;ll let you know by email or
          on the site before it takes effect.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
