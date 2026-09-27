import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroSearchBar } from "@/components/hero-search-bar";
import { VehicleCard } from "@/components/vehicle-card";
import { ScrollRow } from "@/components/scroll-row";
import { BudgetMatcher } from "@/components/budget-matcher";
import { WhyBuySellSection } from "@/components/why-buy-sell-section";
import { SiteContainer } from "@/components/site-container";
import { getActiveListings } from "@/lib/data/listings";
import { BODY_TYPES } from "@/lib/data/constants";

export default async function HomePage() {
  // Newest first (the query's order); cached, and shared with the root layout.
  const listings = await getActiveListings();
  const latest = listings.slice(0, 10);

  const styleCounts = BODY_TYPES.map((bt) => ({
    bodyType: bt,
    count: listings.filter((v) => v.bodyType === bt).length,
  }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);

  const makeCounts = [...new Set(listings.map((v) => v.make))]
    .map((make) => ({ make, count: listings.filter((v) => v.make === make).length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  return (
    <div>
      {/* Hero — contained banner */}
      <section className="pt-6 pb-2">
        <SiteContainer>
          <div className="relative rounded-3xl border px-6 py-14 text-center sm:py-16">
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
              <Image
                src="/banner-hero-1.jpg"
                alt=""
                fill
                priority
                sizes="(min-width: 1400px) 1400px, 100vw"
                className="object-cover"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/65 to-black/50"
              />
            </div>
            <div className="relative mx-auto max-w-[820px]">
              <p className="text-xs font-semibold tracking-wide text-white/90 uppercase">
                South Africa&apos;s private vehicle marketplace
              </p>
              <h1 className="mx-auto mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-balance text-white sm:text-5xl">
                Buy your next car straight from the owner
              </h1>
              <p className="mx-auto mt-4 max-w-lg text-base leading-[1.5] text-white/85">
                {listings.length} cars listed by verified private sellers — no dealer
                mark-ups, no middlemen, no pressure.
              </p>

              <div className="mt-8">
                <HeroSearchBar />
              </div>

              <div className="mx-auto mt-6 flex flex-wrap justify-center gap-2.5">
                {styleCounts.map(({ bodyType, count }) => (
                  <Link
                    key={bodyType}
                    href={`/cars?bodyType=${encodeURIComponent(bodyType)}`}
                    className="flex items-center gap-1.5 rounded-full bg-card px-3.5 py-1.5 text-sm font-medium ring-1 ring-border transition-all hover:bg-muted hover:ring-foreground/30 hover:shadow-capsule"
                  >
                    {bodyType}
                    <span className="text-xs text-muted-foreground">{count}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </SiteContainer>
      </section>

      {/* Just added + Shop by make — one continuous section, no seam between them */}
      <section className="border-b py-8">
        <SiteContainer>
          <ScrollRow
            title="Just added"
            action={{ href: "/cars?sort=newest", label: "See more" }}
          >
            {latest.map((v) => (
              <VehicleCard key={v.id} vehicle={v} className="w-[260px] shrink-0" />
            ))}
          </ScrollRow>

          <div className="mt-12">
            <SectionHead title="Shop by make" href="/cars" linkLabel="All makes" />
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {makeCounts.map(({ make, count }) => (
                <Link
                  key={make}
                  href={`/cars?make=${encodeURIComponent(make)}`}
                  className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm transition-all hover:border-foreground/30 hover:bg-muted hover:shadow-capsule"
                >
                  <span className="font-medium">{make}</span>
                  <span className="text-xs text-muted-foreground">{count}</span>
                </Link>
              ))}
            </div>
          </div>
        </SiteContainer>
      </section>

      <WhyBuySellSection />

      {/* Budget matcher */}
      <section className="border-t bg-muted/40 py-14">
        <SiteContainer>
          <BudgetMatcher />
        </SiteContainer>
      </section>
    </div>
  );
}

function SectionHead({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <Link
        href={href}
        className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        {linkLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
