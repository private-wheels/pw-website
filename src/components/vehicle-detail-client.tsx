"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Calculator,
  Calendar,
  CarFront,
  Check,
  ChevronLeft,
  ChevronRight,
  Fuel,
  Gauge,
  Loader2,
  Mail,
  MapPin,
  Palette,
  Phone,
  Settings2,
  Share2,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { useListing, useListings } from "@/hooks/use-listings";
import type { Vehicle } from "@/lib/types";
import { formatCurrency, formatDateShort, formatMileage } from "@/lib/format";
import { getPriceRating, type PriceRating } from "@/lib/filter";
import { FinanceCalculator } from "@/components/finance-calculator";
import { VehiclePlaceholder } from "@/components/vehicle-placeholder";
import { VehicleMedia } from "@/components/vehicle-media";
import { VehicleCard } from "@/components/vehicle-card";
import { SiteContainer } from "@/components/site-container";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const RATING_LABEL: Record<Exclude<PriceRating, null>, string> = {
  great: "Great price",
  fair: "Fair price",
};

const SPEC_ROWS = (v: Vehicle) => [
  { label: "Year", value: v.year, icon: Calendar },
  { label: "Mileage", value: formatMileage(v.mileage), icon: Gauge },
  { label: "Transmission", value: v.transmission, icon: Settings2 },
  { label: "Fuel Type", value: v.fuelType, icon: Fuel },
  { label: "Body Type", value: v.bodyType, icon: CarFront },
  { label: "Condition", value: v.condition, icon: BadgeCheck },
  { label: "Previous Owners", value: v.previousOwners, icon: Users },
  { label: "Service History", value: v.serviceHistory, icon: Wrench },
  { label: "Accident History", value: v.accidentHistory, icon: ShieldCheck },
  { label: "Colour", value: v.colour, icon: Palette },
];

export function VehicleDetailClient({ id }: { id: string }) {
  const { listing, loading } = useListing(id);
  const { listings } = useListings();
  const [numberRevealed, setNumberRevealed] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [copied, setCopied] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);
  const [canScrollThumbsLeft, setCanScrollThumbsLeft] = useState(false);
  const [canScrollThumbsRight, setCanScrollThumbsRight] = useState(false);
  const thumbRailRef = useRef<HTMLDivElement>(null);

  function updateThumbScrollState() {
    const el = thumbRailRef.current;
    if (!el) return;
    setCanScrollThumbsLeft(el.scrollLeft > 4);
    setCanScrollThumbsRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useLayoutEffect(() => {
    updateThumbScrollState();
    window.addEventListener("resize", updateThumbScrollState);
    return () => window.removeEventListener("resize", updateThumbScrollState);
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Vehicle not found</h1>
        <p className="mt-2 text-muted-foreground">
          This listing may have been removed or sold.
        </p>
        <Button className="mt-6" render={<Link href="/cars">Back to all vehicles</Link>} />
      </div>
    );
  }

  const listingId = listing.id;
  const similar = listings
    .filter((v) => v.id !== listing.id && (v.bodyType === listing.bodyType || v.make === listing.make))
    .slice(0, 4);

  const hasPriceDrop =
    typeof listing.originalPrice === "number" && listing.originalPrice > listing.price;
  const priceRating = getPriceRating(listing, listings);
  const initials = listing.sellerName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const thumbIndices =
    listing.images.length > 0
      ? listing.images.map((_, i) => i)
      : Array.from({ length: 5 }, (_, i) => i);

  function handleEnquirySubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnquirySent(true);
  }

  function scrollThumbs(amount: number) {
    thumbRailRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  }

  async function handleShare() {
    const url = `${window.location.origin}/cars/${listingId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Listing link copied — paste it anywhere to share.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link. Try again.");
    }
  }

  return (
    <div>
      <div className="border-b py-4">
        <SiteContainer className="flex items-center gap-2 text-sm">
          <Link
            href="/cars"
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-medium">
            {listing.year} {listing.make} {listing.model}
          </span>
        </SiteContainer>
      </div>

      <SiteContainer className="py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
              {listing.images.length > 0 ? (
                <VehicleMedia
                  vehicle={listing}
                  index={activeImage}
                  sizes="(min-width: 1024px) 900px, 100vw"
                  priority
                />
              ) : (
                <VehiclePlaceholder seed={listing.id} />
              )}
              <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
                {listing.featured && (
                  <span className="shadow-pill rounded-full bg-card px-3 py-1.5 text-xs font-semibold">
                    Featured
                  </span>
                )}
                {hasPriceDrop && (
                  <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                    Price drop
                  </span>
                )}
              </div>
            </div>
            <div className="relative mt-3">
              <div
                ref={thumbRailRef}
                onScroll={updateThumbScrollState}
                className="flex gap-2 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              >
                {thumbIndices.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    aria-label={`View photo ${i + 1}`}
                    aria-current={listing.images.length > 0 && i === activeImage}
                    className="relative aspect-[4/3] w-[calc(20%-6.4px)] shrink-0 overflow-hidden rounded-lg"
                  >
                    {listing.images.length > 0 ? (
                      <VehicleMedia vehicle={listing} index={i} sizes="120px" compact />
                    ) : (
                      <VehiclePlaceholder seed={`${listing.id}-${i}`} compact />
                    )}
                    {listing.images.length > 0 && i === activeImage && (
                      <span className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-inset ring-foreground" />
                    )}
                  </button>
                ))}
              </div>
              {canScrollThumbsLeft && (
                <button
                  type="button"
                  aria-label="Scroll photos left"
                  onClick={() => scrollThumbs(-240)}
                  className="shadow-pill absolute top-1/2 left-1 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-card transition-transform hover:scale-105 sm:flex"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              {canScrollThumbsRight && (
                <button
                  type="button"
                  aria-label="Scroll photos right"
                  onClick={() => scrollThumbs(240)}
                  className="shadow-pill absolute top-1/2 right-1 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-card transition-transform hover:scale-105 sm:flex"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>

            <Separator className="my-8" />

            <h2 className="text-[22px] font-medium tracking-tight">Specification</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SPEC_ROWS(listing).map((row) => (
                <div
                  key={row.label}
                  className="flex items-start gap-3 rounded-xl bg-muted p-3.5"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card">
                    <row.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{row.label}</p>
                    <p className="text-sm font-semibold">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-8" />

            <h2 className="text-[22px] font-medium tracking-tight">Features</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {listing.features.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-medium"
                >
                  <Check className="h-3.5 w-3.5 text-primary" />
                  {f}
                </span>
              ))}
            </div>

            <Separator className="my-8" />

            <h2 className="text-[22px] font-medium tracking-tight">Description</h2>
            <p className="mt-4 text-sm leading-[1.43] text-muted-foreground">
              {listing.description}
            </p>
          </div>

          <aside>
            <div className="shadow-capsule sticky top-24 flex flex-col gap-4 rounded-2xl bg-card p-5">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">
                    {listing.year} {listing.make}
                  </p>
                  <h1 className="truncate text-xl font-semibold tracking-tight">
                    {listing.model} {listing.variant}
                  </h1>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {listing.town}, {listing.province}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Copy link to this listing"
                  onClick={handleShare}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border hover:bg-muted"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-primary" strokeWidth={2} />
                  ) : (
                    <Share2 className="h-4 w-4 text-foreground" strokeWidth={2} />
                  )}
                </button>
              </div>

              <div className="rounded-xl bg-muted p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={cn(
                      "text-3xl font-semibold tracking-tight",
                      hasPriceDrop && "text-primary",
                    )}
                  >
                    {formatCurrency(listing.price)}
                  </p>
                  {hasPriceDrop && (
                    <s className="text-sm text-muted-foreground">
                      {formatCurrency(listing.originalPrice!)}
                    </s>
                  )}
                  {priceRating && (
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        priceRating === "great"
                          ? "bg-emerald-600 text-white"
                          : "bg-card text-muted-foreground",
                      )}
                    >
                      {RATING_LABEL[priceRating]}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Incl. VAT / Excl. Finance · Listed {formatDateShort(listing.createdAt)}
                </p>
              </div>

              <Dialog>
                <DialogTrigger
                  render={
                    <Button variant="outline" className="h-12 rounded-full">
                      <Calculator className="h-4 w-4" />
                      Calculate Finance
                    </Button>
                  }
                />
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Finance calculator</DialogTitle>
                    <DialogDescription>
                      Estimate your monthly instalment for the {listing.year} {listing.make}{" "}
                      {listing.model}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="max-h-[70vh] overflow-y-auto pr-1">
                    <FinanceCalculator initialPrice={String(listing.price)} />
                  </div>
                </DialogContent>
              </Dialog>

              <Separator />

              <div>
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{listing.sellerName}</p>
                    <p className="text-xs text-muted-foreground">Private seller</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    className="h-12 rounded-full bg-foreground text-background hover:bg-foreground/90"
                    onClick={() => setNumberRevealed(true)}
                  >
                    <Phone className="h-4 w-4" />
                    {numberRevealed ? listing.phone : "Click to Reveal Number"}
                  </Button>

                  <Dialog
                    onOpenChange={(next) => {
                      if (!next) window.setTimeout(() => setEnquirySent(false), 150);
                    }}
                  >
                    <DialogTrigger
                      render={
                        <Button variant="outline" className="h-12 rounded-full">
                          <Mail className="h-4 w-4" />
                          Enquire Now
                        </Button>
                      }
                    />
                    <DialogContent className="sm:max-w-sm">
                      {enquirySent ? (
                        <div className="flex flex-col gap-4">
                          <DialogHeader>
                            <DialogTitle>Thanks — your enquiry is on its way</DialogTitle>
                            <DialogDescription>
                              {listing.sellerName.split(" ")[0]} will be in touch about the{" "}
                              {listing.year} {listing.make} {listing.model} soon.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogClose
                            render={
                              <Button className="h-12 rounded-full bg-primary hover:bg-primary/90" />
                            }
                          >
                            Done
                          </DialogClose>
                        </div>
                      ) : (
                        <>
                          <DialogHeader>
                            <DialogTitle>
                              Enquire about {listing.year} {listing.make} {listing.model}
                            </DialogTitle>
                            <DialogDescription>
                              Send {listing.sellerName.split(" ")[0]} a message about this
                              vehicle.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleEnquirySubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                              <Label htmlFor="enquiry-name">Your Name</Label>
                              <Input
                                id="enquiry-name"
                                required
                                placeholder="Jane Doe"
                                className="h-11 focus-visible:border-ring focus-visible:ring-0"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <Label htmlFor="enquiry-email">Email</Label>
                              <Input
                                id="enquiry-email"
                                type="email"
                                required
                                placeholder="you@example.com"
                                className="h-11 focus-visible:border-ring focus-visible:ring-0"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <Label htmlFor="enquiry-message">Message</Label>
                              <Textarea
                                id="enquiry-message"
                                required
                                defaultValue={`Hi, is the ${listing.year} ${listing.make} ${listing.model} still available?`}
                                className="focus-visible:border-ring focus-visible:ring-0"
                              />
                            </div>
                            <Button
                              type="submit"
                              className="h-12 w-full rounded-full bg-primary hover:bg-primary/90"
                            >
                              Send Enquiry
                            </Button>
                          </form>
                        </>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <div className="mt-16 border-t pt-10">
            <h2 className="text-[22px] font-medium tracking-tight">Similar vehicles</h2>
            <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-x-6 gap-y-8">
              {similar.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          </div>
        )}
      </SiteContainer>
    </div>
  );
}
