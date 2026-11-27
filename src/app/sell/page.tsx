"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Camera, CheckCircle2, ClipboardList, HandCoins, MessagesSquare, Users } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { SiteContainer } from "@/components/site-container";

const STEPS = [
  {
    icon: ClipboardList,
    title: "1. Create your account",
    description: "Sign up with just an email and password — takes less than a minute.",
  },
  {
    icon: Camera,
    title: "2. List your vehicle",
    description: "Add your car's details, specs, and photos using our guided listing wizard.",
  },
  {
    icon: MessagesSquare,
    title: "3. Connect with buyers",
    description: "Field enquiries directly from interested buyers and arrange viewings on your terms.",
  },
];

const BENEFITS = [
  {
    icon: HandCoins,
    title: "No dealer commission",
    description: "You set the price and you keep what you sell it for. No trade-in mark-downs.",
  },
  {
    icon: Users,
    title: "Reach real buyers",
    description: "Your listing is seen by active buyers actively searching for a car like yours.",
  },
  {
    icon: CheckCircle2,
    title: "Full control",
    description: "Edit, pause, or take down your listing any time from your seller dashboard.",
  },
];

export default function SellPage() {
  const { user } = useAuth();
  const ctaHref = user ? "/dashboard/listings/new" : "/register";

  return (
    <div>
      {/* Hero — contained banner, mirrors the buyer homepage's treatment */}
      <section className="pt-6 pb-2">
        <SiteContainer>
          <div className="relative rounded-3xl border px-6 py-16 text-center sm:py-20">
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
              <Image
                src="/banner-sell-1.jpg"
                alt=""
                fill
                preload
                sizes="(min-width: 1400px) 1400px, 100vw"
                className="object-cover"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-black/30"
              />
            </div>
            <div className="relative mx-auto max-w-xl">
              <p className="text-xs font-semibold tracking-wide text-white/90 uppercase">
                Selling instead?
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance text-white sm:text-5xl">
                Sell your car the simple way
              </h1>
              <p className="mx-auto mt-4 max-w-lg text-base leading-[1.5] text-white/85">
                List your vehicle in minutes, reach thousands of buyers directly, and stay
                in full control of your sale — no dealer, no middlemen.
              </p>
              <Button
                className="mt-8 h-12 rounded-full bg-primary px-6 hover:bg-primary/90"
                render={
                  <Link href={ctaHref}>
                    {user ? "Create Your Listing" : "Get Started"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                }
              />
            </div>
          </div>
        </SiteContainer>
      </section>

      {/* List your car in 3 steps */}
      <section className="py-16">
        <SiteContainer>
          <h2 className="text-center text-2xl font-semibold tracking-tight">
            List your car in 3 steps
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.title} className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <s.icon className="h-6 w-6 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="max-w-xs text-sm leading-[1.5] text-muted-foreground">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </SiteContainer>
      </section>

      {/* Why sell with Private Wheels — same dark band as the homepage's buyer trust section */}
      <section className="border-y bg-foreground py-16 text-background">
        <SiteContainer>
          <h2 className="text-center text-2xl font-semibold tracking-tight">
            Why sell with Private Wheels
          </h2>
          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-10 sm:grid-cols-3">
            {BENEFITS.map((b) => (
              <div key={b.title} className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                  <b.icon className="h-6 w-6 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="font-semibold">{b.title}</h3>
                <p className="max-w-xs text-sm leading-[1.5] opacity-70">{b.description}</p>
              </div>
            ))}
          </div>
        </SiteContainer>
      </section>

      {/* Closing CTA */}
      <section className="py-16">
        <SiteContainer className="max-w-4xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Ready to list your vehicle?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            {user
              ? "Head to your dashboard to create your listing."
              : "Sign in to an existing account, or register in under a minute to get started."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {!user && (
              <Button
                variant="outline"
                className="h-12 rounded-full px-6"
                render={<Link href="/login">Sign In</Link>}
              />
            )}
            <Button
              className="h-12 rounded-full bg-primary px-6 hover:bg-primary/90"
              render={
                <Link href={ctaHref}>
                  {user ? "Create Your Listing" : "Create an Account"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />
          </div>
        </SiteContainer>
      </section>
    </div>
  );
}
