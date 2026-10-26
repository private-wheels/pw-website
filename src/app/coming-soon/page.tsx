import type { Metadata } from "next";
import Link from "next/link";
import { FOUNDING_FEE_CENTS, LISTING_FEE_CENTS, formatFee } from "@/lib/payments";
import { Button } from "@/components/ui/button";
import { ComingSoonFrame } from "@/components/coming-soon/coming-soon-frame";
import { WhatsAppButton } from "@/components/coming-soon/whatsapp-button";
import { ReachOutDialog } from "@/components/coming-soon/reach-out-dialog";
import { COMING_SOON } from "@/lib/coming-soon";

export const metadata: Metadata = {
  title: "Coming soon | Private Wheels",
  description:
    "Sell your car privately and securely. List now at the founding-seller price and be one of the first cars buyers see on launch day.",
};

/**
 * The pre-launch holding page. While `SITE_LAUNCHED` is not `true`, `src/proxy.ts`
 * rewrites every route to here, so this is the only page a visitor can reach.
 *
 * Minimal by design: one headline, one action — "List your car now", which
 * opens the pre-launch sell flow at /list. The founding-seller price is a
 * single supporting line; WhatsApp is there for questions.
 */
export default function ComingSoonPage() {
  return (
    <ComingSoonFrame>
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Sell your car privately and securely
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-[1.5] text-muted-foreground">
          Owner to owner — no dealer in the middle, no mark-up. List now for{" "}
          <span className="font-semibold text-foreground">{formatFee(FOUNDING_FEE_CENTS)}</span>{" "}
          as a founding seller ({formatFee(LISTING_FEE_CENTS)} after launch) and your car will be one
          of the first buyers see on launch day.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4">
          <Button
            size="lg"
            className="rounded-full bg-primary px-8 hover:bg-primary/90"
            render={<Link href="/list">List your car now</Link>}
          />
          <WhatsAppButton
            message={COMING_SOON.whatsappMessage}
            label="Questions? WhatsApp us"
          />
          <p className="text-xs text-muted-foreground">
            Want us to reach out instead? <ReachOutDialog />
          </p>
        </div>
      </div>
    </ComingSoonFrame>
  );
}
