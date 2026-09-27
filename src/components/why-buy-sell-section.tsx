"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, MessageCircle, ShieldCheck, Tag } from "lucide-react";
import { SiteContainer } from "@/components/site-container";
import { useListings } from "@/hooks/use-listings";
import { countSellers } from "@/lib/make-index";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const TRUST = [
  {
    icon: ShieldCheck,
    title: "Verified private sellers",
    body: "Every seller confirms their identity before a listing goes live — you always know who you're dealing with.",
  },
  {
    icon: Tag,
    title: "No dealer mark-up",
    body: "You buy at the owner's price. Real-time pricing data keeps every listing honest.",
  },
  {
    icon: MessageCircle,
    title: "Talk to the owner directly",
    body: "Message or call the person who actually drove the car. No middleman, no sales floor.",
  },
];

const SELL_STEPS = [
  "Add your car's details and photos",
  "Set your price — we show you the market range",
  "Reply to buyers and arrange a viewing",
];

/**
 * Home-page "Why buy privately?" / "Why sell privately?" band — a Buying /
 * Selling toggle swaps the pitch in place instead of running two separate
 * sections. Both stories are always rendered (toggled with the `hidden`
 * attribute, not conditionally excluded from the tree) so search engines
 * index both regardless of which is visible on load.
 */
export function WhyBuySellSection() {
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const { listings } = useListings();

  const totalValue = listings.reduce((sum, v) => sum + v.price, 0);
  const sellerCount = countSellers(listings);

  const stats = [
    { value: `${listings.length}`, label: "Cars listed" },
    { value: `${sellerCount}+`, label: "Private sellers" },
    { value: formatCurrency(totalValue), label: "In listings" },
  ];

  return (
    <section className="border-b bg-foreground py-16 text-background">
      <SiteContainer>
        <div className="inline-flex gap-1 rounded-full bg-background/10 p-1">
          <button
            type="button"
            onClick={() => setMode("buy")}
            aria-pressed={mode === "buy"}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-medium transition-colors",
              mode === "buy" ? "bg-background text-foreground" : "text-background/70 hover:text-background",
            )}
          >
            Buying
          </button>
          <button
            type="button"
            onClick={() => setMode("sell")}
            aria-pressed={mode === "sell"}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-medium transition-colors",
              mode === "sell" ? "bg-background text-foreground" : "text-background/70 hover:text-background",
            )}
          >
            Selling
          </button>
        </div>

        {/* Buying — always rendered; hidden (not unmounted) when not active, so it's still indexable */}
        <div hidden={mode !== "buy"}>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight">Why buy privately?</h2>
          <p className="mt-2 max-w-lg text-sm leading-[1.5] opacity-70">
            A private sale can save you tens of thousands — if you can trust the seller and
            the price. That&apos;s the part we fixed.
          </p>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {TRUST.map((t) => (
              <div key={t.title} className="flex flex-col gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                  <t.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-semibold">{t.title}</h3>
                <p className="text-sm leading-[1.5] opacity-70">{t.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Selling — same treatment as above */}
        <div hidden={mode !== "sell"}>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight">Why sell privately?</h2>
          <p className="mt-2 max-w-lg text-sm leading-[1.5] opacity-70">
            List your car in minutes and reach real buyers — no dealer mark-up, no
            middleman. You stay in control the whole way.
          </p>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {SELL_STEPS.map((step, i) => (
              <div key={step} className="flex flex-col gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                  {i + 1}
                </div>
                <p className="text-sm leading-[1.5] opacity-70">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-6 border-t border-background/15 pt-8">
          <div className="flex flex-wrap gap-x-12 gap-y-4">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-semibold tracking-tight text-primary tabular-nums">
                  {s.value}
                </p>
                <p className="mt-1 text-xs font-medium tracking-wide uppercase opacity-60">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <div hidden={mode !== "buy"}>
            <Link
              href="/cars"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Browse listings
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div hidden={mode !== "sell"}>
            <Link
              href="/sell"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Sell your car
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </SiteContainer>
    </section>
  );
}
