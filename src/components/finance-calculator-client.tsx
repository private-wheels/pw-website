"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Calculator, Clock3, ShieldCheck, TrendingUp } from "lucide-react";
import { FinanceCalculator } from "@/components/finance-calculator";
import { FinancePartner } from "@/components/finance-partner";
import { SiteContainer } from "@/components/site-container";

const REASSURANCE = [
  {
    icon: TrendingUp,
    title: "Real SA market rates",
    description: "Estimates use current prime-linked rates, not guesswork.",
  },
  {
    icon: Clock3,
    title: "Instant results",
    description: "No signup, no waiting — see your numbers as you type.",
  },
  {
    icon: ShieldCheck,
    title: "Just an estimate",
    description: "Your actual rate depends on your bank and credit profile.",
  },
];

export function FinanceCalculatorClient() {
  const searchParams = useSearchParams();
  const prefillPrice = searchParams.get("price") ?? "";

  return (
    <div>
      {/* Header — dark band, mirrors the Sell page's trust treatment */}
      <section className="border-b bg-foreground py-12 text-background sm:py-16">
        <SiteContainer className="max-w-3xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
            <Calculator className="h-6 w-6 text-primary" strokeWidth={1.75} />
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Finance calculator
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-[1.5] opacity-70 sm:text-base">
            Work out your monthly instalment or check what you can afford, using
            South African market rates.
          </p>
        </SiteContainer>
      </section>

      {/* Calculator */}
      <section className="py-10 sm:py-12">
        <SiteContainer className="max-w-5xl">
          <FinanceCalculator initialPrice={prefillPrice} />
          <FinancePartner className="mt-8" />
        </SiteContainer>
      </section>

      {/* Reassurance strip */}
      <section className="border-t bg-muted/40 py-16">
        <SiteContainer>
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-10 sm:grid-cols-3">
            {REASSURANCE.map((r) => (
              <div key={r.title} className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <r.icon className="h-6 w-6 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="font-semibold">{r.title}</h3>
                <p className="max-w-xs text-sm leading-[1.5] text-muted-foreground">
                  {r.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <Link
              href="/cars"
              className="inline-flex h-12 items-center gap-1.5 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Browse listings
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/sell"
              className="inline-flex h-12 items-center gap-1.5 rounded-full border px-6 text-sm font-medium transition-colors hover:bg-muted"
            >
              Sell your car
            </Link>
          </div>
        </SiteContainer>
      </section>
    </div>
  );
}
