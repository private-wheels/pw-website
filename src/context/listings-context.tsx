"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Vehicle } from "@/lib/types";

/**
 * The active (public) listings, fetched once on the server by the root layout
 * and handed to every client component. After a seller changes a listing,
 * `refreshListings()` expires the server cache and Next re-renders the layout,
 * so this value updates without any client-side refetching.
 */
const ListingsContext = createContext<Vehicle[] | undefined>(undefined);

export function ListingsProvider({
  listings,
  children,
}: {
  listings: Vehicle[];
  children: ReactNode;
}) {
  return <ListingsContext.Provider value={listings}>{children}</ListingsContext.Provider>;
}

export function useActiveListings(): Vehicle[] {
  const listings = useContext(ListingsContext);
  if (!listings) throw new Error("useActiveListings must be used within a ListingsProvider");
  return listings;
}
