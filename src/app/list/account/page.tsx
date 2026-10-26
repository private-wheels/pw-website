"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Loader2, Send } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { claimListing } from "@/app/actions/list";
import { publishWithoutPayment } from "@/app/actions/admin";
import { useListingFee } from "@/hooks/use-listing-fee";
import { AuthError, currentAccessToken, linkEmail, login } from "@/lib/store/auth";
import { fetchListing } from "@/lib/store/listings";
import { PaymentError, goToCheckout } from "@/lib/store/payments";
import type { Vehicle } from "@/lib/types";
import { HelpCallout } from "@/components/help-callout";
import { useTurnstile } from "@/components/turnstile";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function ListAccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountStep />
    </Suspense>
  );
}

function message(err: unknown): string {
  if (err instanceof AuthError || err instanceof PaymentError) return err.message;
  return "Something went wrong. Please try again.";
}

/**
 * Between the wizard and Paystack for /list sellers. A temporary account
 * either adds an email (becoming a real account) or signs in to an existing
 * one, which takes the listing with it. Admins then publish for free;
 * everyone else pays.
 */
function AccountStep() {
  const router = useRouter();
  const listingId = useSearchParams().get("listing") ?? "";
  const { user, loading } = useAuth();
  const fee = useListingFee();
  const captcha = useTurnstile("list_login");
  const [listing, setListing] = useState<Vehicle | null>(null);
  const [tab, setTab] = useState<"new" | "existing">("new");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/list");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || !listingId) return;
    fetchListing(listingId)
      .then(setListing)
      .catch(() => setListing(null));
  }, [user, listingId]);

  async function payOrPublish(isAdmin: boolean) {
    if (isAdmin) {
      const result = await publishWithoutPayment(listingId);
      if (!result.ok) throw new PaymentError(result.error);
      router.push("/dashboard");
      return;
    }
    await goToCheckout(listingId);
  }

  async function run(task: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await task();
    } catch (err) {
      setError(message(err));
      setBusy(false);
    }
  }

  function handleNewAccount(e: FormEvent) {
    e.preventDefault();
    void run(async () => {
      try {
        await linkEmail(email, "/list/password");
      } catch (err) {
        if (err instanceof AuthError && err.message.includes("already exists")) {
          setTab("existing");
          throw new AuthError("You already have an account with this email. Sign in below to continue.");
        }
        throw err;
      }
      await goToCheckout(listingId);
    });
  }

  function handleExistingAccount(e: FormEvent) {
    e.preventDefault();
    void run(async () => {
      const anonToken = await currentAccessToken();
      try {
        await login(email, password, captcha.token);
      } catch (err) {
        captcha.reset();
        throw err;
      }
      if (!anonToken) throw new AuthError("Your session expired. Please start your listing again.");
      const claimed = await claimListing(listingId, anonToken);
      if (!claimed.ok) throw new AuthError(claimed.error);
      await payOrPublish(claimed.isAdmin);
    });
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const title = listing ? `${listing.year} ${listing.make} ${listing.model} ${listing.variant}` : "Your listing";

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <p className="text-xs font-semibold tracking-wide text-primary uppercase">Almost done</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">
        {user.isAnonymous ? "Where should we send updates?" : "Ready to publish"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{title}</span> is saved.{" "}
        {user.isAnonymous
          ? "Add your email so we can tell you when it's approved, then pay the once-off listing fee."
          : user.role === "admin"
            ? "As an admin, you can publish it straight away."
            : "Pay the once-off listing fee and we'll review it."}
      </p>

      <div className="mt-6 rounded-2xl border bg-card p-5">
        {!user.isAnonymous ? (
          <Button
            size="lg"
            className="w-full rounded-full bg-primary hover:bg-primary/90"
            disabled={busy}
            onClick={() => void run(() => payOrPublish(user.role === "admin"))}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : user.role === "admin" ? <Send className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
            {user.role === "admin" ? "Publish listing" : `Pay ${fee.label}`}
          </Button>
        ) : (
          <>
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-full bg-muted p-1 text-sm">
              {(["new", "existing"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setTab(value);
                    setError(null);
                  }}
                  className={cn(
                    "rounded-full py-1.5 font-medium transition-colors",
                    tab === value ? "bg-background shadow-sm" : "text-muted-foreground",
                  )}
                >
                  {value === "new" ? "I'm new here" : "I have an account"}
                </button>
              ))}
            </div>

            {tab === "new" ? (
              <form onSubmit={handleNewAccount} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll email you a link to confirm it and set a password, so you can manage your listing later.
                  </p>
                </div>
                <label className="flex items-start gap-2.5 text-sm">
                  <Checkbox checked={agreed} onCheckedChange={(checked) => setAgreed(checked === true)} className="mt-0.5" />
                  <span>
                    I agree to the{" "}
                    <Link href="/legal/terms" target="_blank" className="underline underline-offset-2">
                      Terms of Use
                    </Link>{" "}
                    and{" "}
                    <Link href="/legal/privacy" target="_blank" className="underline underline-offset-2">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  size="lg"
                  disabled={busy || !agreed}
                  className="rounded-full bg-primary hover:bg-primary/90"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  Continue to payment · {fee.label}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleExistingAccount} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="login-email">Email address</Label>
                  <Input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {captcha.widget}
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  size="lg"
                  disabled={busy || !captcha.ready}
                  className="rounded-full bg-primary hover:bg-primary/90"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Sign in and continue
                </Button>
                <p className="text-xs text-muted-foreground">
                  Your listing moves to your account when you sign in.
                </p>
              </form>
            )}
          </>
        )}
        {!user.isAnonymous && error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>

      <HelpCallout className="mt-6" />
    </div>
  );
}
