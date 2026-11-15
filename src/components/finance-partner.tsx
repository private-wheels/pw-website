import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { FINANCE_PARTNER } from "@/lib/finance-partner";
import { FinanceApplyLink } from "@/components/finance-apply-link";
import { cn } from "@/lib/utils";

/** The partner's logo. Its white background blends into the block (multiply). Set the height with `className`. */
function PartnerLogo({ className }: { className?: string }) {
  const { src, width, height } = FINANCE_PARTNER.logo;
  return (
    <Image
      src={src}
      alt={`${FINANCE_PARTNER.name} logo`}
      width={width}
      height={height}
      className={cn("w-auto shrink-0 mix-blend-multiply", className)}
    />
  );
}

/** "Our finance partner" over their name, set close together. */
function PartnerHeading() {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-primary uppercase">Our finance partner</p>
      <p className="text-lg leading-tight font-semibold tracking-tight">{FINANCE_PARTNER.name}</p>
    </div>
  );
}

function ApplyButton({ className }: { className?: string }) {
  return (
    <FinanceApplyLink
      href={FINANCE_PARTNER.applyUrl}
      className={cn(
        "inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        className,
      )}
    >
      Apply for finance
      <ArrowUpRight className="h-4 w-4" />
    </FinanceApplyLink>
  );
}

const FINE_PRINT = `You'll apply on ${FINANCE_PARTNER.name}'s secure online application. Private Wheels doesn't provide credit and doesn't see your application. Finance is subject to approval.`;

/**
 * "Our finance partner" block, with a button to the partner's online
 * application. `compact` fits inside the finance calculator dialog.
 */
export function FinancePartner({ compact = false, className }: { compact?: boolean; className?: string }) {
  if (compact) {
    return (
      <div className={cn("rounded-2xl border bg-muted/40 p-4", className)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <PartnerLogo className="h-10" />
            <PartnerHeading />
          </div>
          <ApplyButton />
        </div>
        <p className="mt-3 text-xs leading-[1.5] text-muted-foreground">{FINE_PRINT}</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border bg-card p-6 sm:p-8", className)}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
          <PartnerLogo className="h-14" />
          <div>
            <PartnerHeading />
            <p className="mt-4 max-w-md text-sm leading-[1.5] text-muted-foreground">
              Private Wheels works with {FINANCE_PARTNER.name} to help you finance your next car. Like what the
              calculator shows? Apply online and their team will take it from there.
            </p>
          </div>
        </div>
        <ApplyButton className="self-start sm:self-center" />
      </div>
      <p className="mt-6 border-t pt-4 text-xs leading-[1.5] text-muted-foreground">{FINE_PRINT}</p>
    </div>
  );
}
