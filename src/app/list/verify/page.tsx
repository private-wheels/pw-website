"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Lock,
  RotateCcw,
  ScanFace,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getVerificationState, startVerification, verificationSubmitted } from "@/app/actions/identity";
import { useListingFee } from "@/hooks/use-listing-fee";
import { CHECK_SLOW_AFTER_MS, SMILE_ID_PRIVACY_URL, type VerificationState } from "@/lib/identity";
import { SUPPORT_EMAIL } from "@/lib/email";
import { launchSmileId } from "@/lib/store/identity";
import { fetchListingsByUser } from "@/lib/store/listings";
import { PaymentError, goToCheckout } from "@/lib/store/payments";
import { HelpCallout } from "@/components/help-callout";
import { Button } from "@/components/ui/button";

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <Verify />
    </Suspense>
  );
}

/** Only same-site paths, so `?next=` can't send people to another host. */
function safeNext(next: string | null): string | null {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

/**
 * Identity verification (Smile ID), before a seller can pay for a listing.
 *
 *   ?next=…      straight after signing up: they can skip and verify later
 *   ?listing=…   about to pay for that listing: no skipping
 *
 * Once verified, sellers with an unpaid listing continue to payment; anyone
 * else goes on to `next` (the dashboard by default), which shows them as
 * verified. Verified sellers and admins who land here are sent straight on.
 */
function Verify() {
  const router = useRouter();
  const params = useSearchParams();
  const listingParam = params.get("listing");
  const next = safeNext(params.get("next"));
  const { user, loading, refreshUser } = useAuth();
  const fee = useListingFee();
  const [state, setState] = useState<VerificationState | null>(null);
  const [unpaidListingId, setUnpaidListingId] = useState<string | null>(listingParam);
  // Whether we know about unpaid listings yet (always, when one is passed in).
  const [unpaidChecked, setUnpaidChecked] = useState(listingParam !== null);
  // Whether they verified on this visit (vs. arriving already verified).
  const [verifiedHere, setVerifiedHere] = useState(false);
  const leaving = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const polling = useRef(false);

  const refresh = useCallback(async () => {
    const latest = await getVerificationState();
    if (latest) {
      if (latest.status === "verified") setVerifiedHere(true);
      setState(latest);
    }
    return latest;
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(`/list/verify${window.location.search}`)}`);
      return;
    }
    // Admins don't need verifying.
    if (user.role === "admin") {
      router.replace(next ?? "/dashboard");
      return;
    }
    let cancelled = false;
    getVerificationState()
      .then((latest) => !cancelled && latest && setState(latest))
      .catch(() => !cancelled && setError("We couldn't load your verification. Please refresh the page."));
    if (!listingParam) {
      fetchListingsByUser(user.id)
        .then((listings) => {
          if (cancelled) return;
          setUnpaidListingId(listings.find((l) => l.status === "pending_payment")?.id ?? null);
          setUnpaidChecked(true);
        })
        .catch(() => !cancelled && setUnpaidChecked(true));
    }
    return () => {
      cancelled = true;
    };
  }, [loading, user, router, next, listingParam]);

  // On to the dashboard (or `next`), which shows them as verified, when
  // they've just verified with nothing to pay for, or were already verified
  // when signing in. Temporary /list accounts always have a listing to pay.
  const verified = state?.status === "verified";
  const moveOn =
    verified &&
    user !== null &&
    !user.isAnonymous &&
    ((!verifiedHere && next !== null && !listingParam) || (unpaidChecked && !unpaidListingId));
  useEffect(() => {
    if (!moveOn || leaving.current) return;
    leaving.current = true;
    if (verifiedHere) toast.success("You're verified! Thanks for helping keep Private Wheels safe.");
    void refreshUser().finally(() => router.replace(next ?? "/dashboard"));
  }, [moveOn, verifiedHere, refreshUser, router, next]);

  // While Smile ID is working on it, check every few seconds (less often once
  // it's taking a while; we email them the result anyway).
  const pending = state?.status === "pending";
  const submittedAt = state?.submittedAt ? new Date(state.submittedAt).getTime() : null;
  const slow = pending && submittedAt !== null && now - submittedAt > CHECK_SLOW_AFTER_MS;
  useEffect(() => {
    if (!pending) return;
    const timer = window.setInterval(
      async () => {
        setNow(Date.now());
        if (polling.current) return;
        polling.current = true;
        await refresh().catch(() => {});
        polling.current = false;
      },
      slow ? 10_000 : 3_000,
    );
    return () => window.clearInterval(timer);
  }, [pending, slow, refresh]);

  async function handleStart() {
    setError(null);
    setBusy(true);
    try {
      const session = await startVerification();
      if ("error" in session) {
        setError(session.error);
        return;
      }
      const outcome = await launchSmileId(session);
      if (outcome.type === "submitted") {
        await verificationSubmitted(session.attemptId, outcome.jobId);
        setNow(Date.now());
        await refresh();
      } else if (outcome.type === "failed") {
        setError(`${outcome.message} Please try again.`);
      }
    } catch (err) {
      console.error(err);
      setError("We couldn't open the identity check. Please refresh the page and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePay() {
    if (!unpaidListingId) return;
    setError(null);
    setBusy(true);
    try {
      await goToCheckout(unpaidListingId);
    } catch (err) {
      setError(err instanceof PaymentError ? err.message : "Couldn't start the payment. Please try again.");
      setBusy(false);
    }
  }

  if (loading || !user || !state) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
        {error ? <p className="text-sm text-destructive">{error}</p> : <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
      </div>
    );
  }

  const continueHref = next ?? "/dashboard";
  const canSkip = !listingParam && next !== null;
  // Temporary /list accounts have no dashboard until they confirm their email.
  const dashboardLink = user.isAnonymous ? null : (
    <Button variant="outline" size="lg" className="mt-2 rounded-full" render={<Link href={continueHref}>Go to your dashboard</Link>} />
  );

  // ---- Verified --------------------------------------------------------------
  if (state.status === "verified") {
    // The effect above is taking them on (or still checking for a listing).
    if (moveOn || (!unpaidChecked && !user.isAnonymous)) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
    return (
      <Outcome icon={<CheckCircle2 className="h-12 w-12 text-green-600" strokeWidth={1.5} />} title="You're verified">
        <p>
          Thanks! Your identity check is complete, and you won&apos;t need to do it again.
          {unpaidListingId ? " Now pay the once-off listing fee and we'll review your listing." : ""}
        </p>
        {unpaidListingId ? (
          <Button size="lg" className="mt-2 rounded-full bg-primary hover:bg-primary/90" disabled={busy} onClick={handlePay}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            Pay {fee.label}
          </Button>
        ) : (
          <Button
            size="lg"
            className="mt-2 rounded-full bg-primary hover:bg-primary/90"
            render={<Link href={continueHref}>Continue</Link>}
          />
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </Outcome>
    );
  }

  // ---- Waiting for Smile ID -------------------------------------------------
  if (state.status === "pending") {
    return (
      <Outcome
        icon={
          slow ? (
            <Clock className="h-12 w-12 text-amber-500" strokeWidth={1.5} />
          ) : (
            <Loader2 className="h-12 w-12 animate-spin text-primary" strokeWidth={1.5} />
          )
        }
        title={slow ? "This is taking longer than usual" : "Checking your ID…"}
      >
        <p>
          {slow
            ? "Your check is still being processed. You don't need to wait here: we'll email you as soon as it's complete, and you can carry on from there."
            : "This usually takes less than a minute. Please keep this page open."}
        </p>
        {slow && <p className="text-xs">This page also updates on its own if the result comes in.</p>}
        {slow && dashboardLink}
      </Outcome>
    );
  }

  // ---- Flagged for a manual review --------------------------------------------
  if (state.status === "review") {
    return (
      <Outcome icon={<UserCheck className="h-12 w-12 text-amber-500" strokeWidth={1.5} />} title="We're taking a closer look">
        <p>
          Your check needs a quick manual review by our team. This usually takes less than one working day, and there&apos;s
          nothing you need to do. We&apos;ll email you as soon as it&apos;s done
          {unpaidListingId ? ", and then you can pay for your listing" : ""}.
        </p>
        {dashboardLink}
      </Outcome>
    );
  }

  // ---- Out of attempts ----------------------------------------------------------
  if (state.status === "failed" || !state.canStart) {
    return (
      <Outcome icon={<XCircle className="h-12 w-12 text-destructive" strokeWidth={1.5} />} title="We couldn't verify your identity">
        <p>
          Something isn&apos;t working, and we&apos;d like to help. Email us at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-foreground underline underline-offset-2">
            {SUPPORT_EMAIL}
          </a>{" "}
          and we&apos;ll sort it out with you.
        </p>
        {dashboardLink}
      </Outcome>
    );
  }

  // ---- Start (or retry) ------------------------------------------------------------
  const retrying = state.lastOutcome === "block" || state.lastOutcome === "error";
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <p className="text-xs font-semibold tracking-wide text-primary uppercase">
        {listingParam ? "Before you pay" : "One more step"}
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">
        {retrying ? "Let's try that again" : "Verify your identity"}
      </h1>

      {retrying ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
          <RotateCcw className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {state.lastOutcome === "error"
              ? "Your last check didn't go through because of a technical problem on our verification partner's side. Please try again."
              : "We couldn't match your selfie to your ID. Find a well-lit spot, remove hats or glasses, and check your ID number is exactly as it appears on your ID."}
          </p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Every seller on Private Wheels is verified, so buyers know they&apos;re dealing with a real person who is who they say
          they are. It&apos;s one of the ways we keep scams off the platform, and you only need to do it once.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border bg-card p-5 text-sm">
        <Point icon={ScanFace} title="Takes about two minutes">
          You&apos;ll need your South African ID number and a camera for a quick selfie. We match it to the photo on record for
          your ID.
        </Point>
        <Point icon={ShieldCheck} title="Checked by Smile ID">
          Our verification partner, Smile ID, does the check for us.
        </Point>
        <Point icon={Lock} title="We don't store your ID or selfie">
          Your ID number and selfie go straight to Smile ID. Private Wheels never stores them; we only keep whether you passed. Read{" "}
          <a href={SMILE_ID_PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            Smile ID&apos;s privacy policy
          </a>{" "}
          and{" "}
          <Link href="/legal/privacy" target="_blank" className="underline underline-offset-2">
            ours
          </Link>
          .
        </Point>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-6 flex flex-col gap-3">
        <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90" disabled={busy} onClick={handleStart}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanFace className="h-4 w-4" />}
          {retrying ? "Try again" : "Verify my identity"}
        </Button>
        {canSkip && (
          <Button variant="ghost" size="lg" className="rounded-full" render={<Link href={continueHref}>Skip for now</Link>} />
        )}
        {canSkip && (
          <p className="text-center text-xs text-muted-foreground">
            You can create your listing first, but you&apos;ll need to verify before you can pay for it.
          </p>
        )}
      </div>

      <HelpCallout className="mt-8" />
    </div>
  );
}

function Point({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof ShieldCheck;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}

function Outcome({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
      {icon}
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">{children}</div>
      <HelpCallout className="mt-4 text-left" />
    </div>
  );
}
