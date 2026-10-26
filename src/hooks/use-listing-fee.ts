"use client";

import { useEffect, useState } from "react";
import { getListingFee } from "@/app/actions/payments";
import { LISTING_FEE_CENTS, formatFee, type ListingFee } from "@/lib/payments";

let cached: Promise<ListingFee> | null = null;

/**
 * The listing fee to show (founding price before launch). Starts as the full
 * price until the server answers; the server charges the right amount
 * regardless.
 */
export function useListingFee(): ListingFee {
  const [fee, setFee] = useState<ListingFee>({
    cents: LISTING_FEE_CENTS,
    label: formatFee(LISTING_FEE_CENTS),
    founding: false,
  });

  useEffect(() => {
    cached ??= getListingFee();
    let cancelled = false;
    cached.then((value) => !cancelled && setFee(value)).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return fee;
}
