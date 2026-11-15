"use client";

import Link from "next/link";
import { LayoutDashboard, LogIn } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

/**
 * Header link on the /list pages, so returning sellers can see all their
 * listings and statuses: "My listings" when signed in, "Sign in" otherwise.
 * Hidden for temporary /list accounts, who are mid-listing: signing in from
 * here would leave their listing behind, and the account step already offers
 * "I have an account".
 */
export function ListAccountLink() {
  const { user, loading } = useAuth();
  if (loading || user?.isAnonymous) return null;

  return user ? (
    <Button
      variant="outline"
      size="sm"
      className="rounded-full"
      render={
        <Link href="/dashboard">
          <LayoutDashboard className="h-4 w-4" />
          My listings
        </Link>
      }
    />
  ) : (
    <Button
      variant="outline"
      size="sm"
      className="rounded-full"
      render={
        <Link href={`/login?next=${encodeURIComponent("/dashboard")}`}>
          <LogIn className="h-4 w-4" />
          Sign in
        </Link>
      }
    />
  );
}

/** "Already listed a car? Sign in…" under the /list call to action (signed-out visitors only). */
export function ListSignInNote() {
  const { user, loading } = useAuth();
  if (loading || user) return null;
  return (
    <p className="text-sm text-muted-foreground">
      Already listed a car?{" "}
      <Link
        href={`/login?next=${encodeURIComponent("/dashboard")}`}
        className="font-medium text-foreground underline underline-offset-2"
      >
        Sign in
      </Link>{" "}
      to see all your listings and their status.
    </p>
  );
}
