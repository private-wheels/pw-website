"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useListings } from "@/hooks/use-listings";
import { countSellers } from "@/lib/make-index";
import { BrandLogo } from "@/components/brand-mark";

export function AuthSplitLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const { listings } = useListings();
  const sellerCount = countSellers(listings);

  return (
    <div className="grid min-h-[calc(100vh-5rem)] grid-cols-1 lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-muted p-10 lg:flex">
        <Link href="/" className="flex items-center">
          <BrandLogo className="h-6 w-auto text-primary" />
        </Link>

        <div>
          <h2 className="max-w-sm text-3xl font-semibold tracking-tight">
            South Africa&apos;s trusted private vehicle marketplace.
          </h2>
          <p className="mt-3 max-w-sm text-muted-foreground">
            Connecting buyers and verified private sellers with precision and transparency.
          </p>

          <div className="mt-8 flex gap-8">
            <div>
              <p className="text-2xl font-semibold tracking-tight">{listings.length}+</p>
              <p className="text-xs text-muted-foreground uppercase">Vehicles</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">{sellerCount}+</p>
              <p className="text-xs text-muted-foreground uppercase">Sellers</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Private Wheels (Pty) Ltd.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-12">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

          <div className="shadow-capsule mt-8 rounded-2xl bg-card p-6">{children}</div>

          <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
        </div>
      </div>
    </div>
  );
}
