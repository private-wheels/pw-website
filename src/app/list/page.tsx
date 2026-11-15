import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Camera, CreditCard, ShieldCheck } from "lucide-react";
import { FOUNDING_FEE_CENTS, LISTING_FEE_CENTS, formatFee } from "@/lib/payments";
import { isFoundingPriceActive, isPreLaunch } from "@/lib/site";
import { HelpCallout } from "@/components/help-callout";
import { SiteContainer } from "@/components/site-container";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "List your car | Private Wheels",
  description:
    "List your car on Private Wheels before launch at the founding-seller price, and be one of the first cars buyers see on launch day.",
};

const STEPS = [
  { icon: Camera, title: "Add your car", body: "Details, your asking price and at least 4 photos: the front, back, side and inside. Takes about 10 minutes." },
  { icon: CreditCard, title: "Pay per listing", body: "One fee for each car you list, paid through Paystack. No monthly fees and no commission." },
  { icon: ShieldCheck, title: "We review it", body: "Our team checks every listing so buyers can trust what they see." },
];

/**
 * The shareable pre-launch link (www.private-wheels.co.za/list). Reachable
 * through the coming-soon gate, along with the rest of the sell flow.
 */
export default function ListYourCarPage() {
  const preLaunch = isPreLaunch();
  const founding = isFoundingPriceActive();
  const price = formatFee(founding ? FOUNDING_FEE_CENTS : LISTING_FEE_CENTS);

  return (
    <SiteContainer className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        {founding && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <CalendarClock className="h-3.5 w-3.5" />
            Founding-seller price: {price} per listing until launch
          </span>
        )}
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {preLaunch ? "List your car now, go live on launch day" : "Sell your car privately and securely"}
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
          {preLaunch
            ? "Private Wheels is launching soon. List now and your car will be one of the first buyers see, with no dealer in the middle and no commission."
            : "Owner to owner, with no dealer in the middle and no commission. List in minutes and deal directly with buyers."}
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Button
            size="lg"
            className="rounded-full bg-primary px-8 hover:bg-primary/90"
            render={<Link href="/list/new">Start your listing</Link>}
          />
          <p className="text-sm text-muted-foreground">
            {founding ? (
              <>
                <span className="font-semibold text-foreground">{price} per listing</span> as a founding seller ·{" "}
                {formatFee(LISTING_FEE_CENTS)} per listing once we launch · No account needed to start
              </>
            ) : (
              <>
                <span className="font-semibold text-foreground">{price} per listing</span> · No account needed to start
              </>
            )}
          </p>
        </div>
      </div>

      <div className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, body }, i) => (
          <div key={title} className="rounded-2xl border bg-card p-5">
            <Icon className="h-5 w-5 text-primary" />
            <p className="mt-3 font-semibold">
              {i + 1}. {title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-10 flex max-w-2xl flex-col gap-3 rounded-2xl border bg-muted/40 p-5 text-sm">
        <HelpCallout />
      </div>
    </SiteContainer>
  );
}
