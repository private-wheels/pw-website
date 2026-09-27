"use client";

import { useCallback, useEffect, useState } from "react";
import type { Vehicle } from "@/lib/types";
import { useActiveListings } from "@/context/listings-context";
import { isListingId } from "@/lib/listings";
import { fetchListing, fetchListingsByUser } from "@/lib/store/listings";

/** All active listings (server-rendered, shared via ListingsProvider). */
export function useListings() {
  return { listings: useActiveListings() };
}

/**
 * One listing. Active listings resolve instantly from the shared list; any
 * other id (e.g. the seller's own paused listing) is fetched under the user's
 * session, so RLS decides whether they may see it.
 */
export function useListing(id: string) {
  const active = useActiveListings();
  const cached = active.find((v) => v.id === id);
  const [fetched, setFetched] = useState<{ id: string; listing: Vehicle | null } | null>(null);

  useEffect(() => {
    if (cached || !isListingId(id)) return;
    let cancelled = false;
    fetchListing(id)
      .catch(() => null)
      .then((listing) => {
        if (!cancelled) setFetched({ id, listing });
      });
    return () => {
      cancelled = true;
    };
  }, [id, cached]);

  if (cached) return { listing: cached, loading: false };
  if (!isListingId(id)) return { listing: undefined, loading: false };
  if (fetched?.id !== id) return { listing: undefined, loading: true };
  return { listing: fetched.listing ?? undefined, loading: false };
}

/** The signed-in seller's listings in every status, with a manual reload. */
export function useUserListings(userId: string | undefined) {
  const [state, setState] = useState<{ userId: string; listings: Vehicle[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!userId) return;
    try {
      const listings = await fetchListingsByUser(userId);
      setState({ userId, listings });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load your listings.");
    }
  }, [userId]);

  useEffect(() => {
    // Fetch-on-mount: the async result lands in state once the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);

  const loaded = state && state.userId === userId;
  return {
    listings: loaded ? state.listings : [],
    loading: Boolean(userId) && !loaded && !error,
    error,
    reload,
  };
}
