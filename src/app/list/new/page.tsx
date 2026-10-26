"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { AuthError, startAnonymous } from "@/lib/store/auth";
import { ListingWizard } from "@/components/listing-wizard";
import { HelpCallout } from "@/components/help-callout";
import { useTurnstile } from "@/components/turnstile";
import { Button } from "@/components/ui/button";

/**
 * The listing wizard for the shareable /list link. Visitors without an
 * account get a temporary one behind the scenes (after an invisible bot
 * check), so they can upload photos and save the listing before creating an
 * account at the payment step. Signed-in users just use the wizard.
 */
export default function ListNewPage() {
  const { user, loading } = useAuth();
  const captcha = useTurnstile("list_start");
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (loading || user || !captcha.ready || started.current) return;
    started.current = true;
    startAnonymous(captcha.token).catch((err) => {
      setError(err instanceof AuthError ? err.message : "Something went wrong. Please try again.");
      started.current = false;
      captcha.reset();
    });
  }, [loading, user, captcha]);

  if (user) return <ListingWizard mode="create" />;

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      {error ? (
        <>
          <p className="font-semibold">We couldn&apos;t start your listing</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try again
            </Button>
            <Button render={<Link href="/register">Create an account instead</Link>} />
          </div>
          <HelpCallout className="mt-4 text-left" />
        </>
      ) : (
        <>
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Getting your listing ready…</p>
        </>
      )}
      {captcha.widget}
    </div>
  );
}
