"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, Loader2, MailCheck, XCircle } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PaymentError, goToCheckout } from "@/lib/store/payments";
import { HelpCallout } from "@/components/help-callout";
import { Button } from "@/components/ui/button";

export default function ListDonePage() {
  return (
    <Suspense fallback={null}>
      <Done />
    </Suspense>
  );
}

/**
 * Where /list sellers land after Paystack (via /api/paystack/callback and
 * the dashboard). They're still on a temporary account until they confirm
 * their email, so this explains what happens next.
 */
function Done() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const outcome = params.get("payment");
  const listingId = params.get("listing");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/list");
    else if (!user.isAnonymous) router.replace(`/dashboard${window.location.search}`);
  }, [loading, user, router]);

  useEffect(() => {
    getSupabaseBrowserClient()
      .auth.getUser()
      .then(({ data }) => setPendingEmail(data.user?.new_email ?? data.user?.email ?? null));
  }, []);

  if (loading || !user?.isAnonymous) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const paid = outcome === "success";
  const pending = outcome === "pending";

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
      {paid ? (
        <CheckCircle2 className="h-12 w-12 text-green-600" strokeWidth={1.5} />
      ) : pending ? (
        <Clock className="h-12 w-12 text-amber-500" strokeWidth={1.5} />
      ) : (
        <XCircle className="h-12 w-12 text-destructive" strokeWidth={1.5} />
      )}
      <h1 className="text-2xl font-semibold tracking-tight">
        {paid ? "You're all set!" : pending ? "We're confirming your payment" : "Your payment didn't go through"}
      </h1>
      <p className="text-sm text-muted-foreground">
        {paid
          ? "Thanks! Our team will review your listing, usually within one working day, and email you when it's approved."
          : pending
            ? "This can take a minute. Your listing moves to review as soon as Paystack confirms it, and we'll email you."
            : "No money was taken. Your listing is saved, so you can try again whenever you're ready."}
      </p>

      {(paid || pending) && (
        <div className="mt-2 flex w-full items-start gap-3 rounded-2xl border bg-card p-4 text-left text-sm">
          <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>
            <span className="font-semibold">One more thing:</span> confirm your email
            {pendingEmail ? (
              <>
                {" "}
                (<span className="font-medium">{pendingEmail}</span>)
              </>
            ) : null}{" "}
            using the link we&apos;ve sent you. That&apos;s where you&apos;ll set a password to manage your listing later.
            Check your spam folder if you can&apos;t see it.
          </p>
        </div>
      )}

      {!paid && !pending && listingId && (
        <Button
          size="lg"
          className="rounded-full bg-primary hover:bg-primary/90"
          disabled={retrying}
          onClick={async () => {
            setRetrying(true);
            setError(null);
            try {
              await goToCheckout(listingId);
            } catch (err) {
              setError(err instanceof PaymentError ? err.message : "Couldn't start the payment. Please try again.");
              setRetrying(false);
            }
          }}
        >
          {retrying && <Loader2 className="h-4 w-4 animate-spin" />}
          Try payment again
        </Button>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Link href="/list" className="text-sm text-muted-foreground underline underline-offset-2">
        Back to Private Wheels
      </Link>
      <HelpCallout className="mt-4 text-left" />
    </div>
  );
}
