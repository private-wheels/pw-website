"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, MailCheck, Send } from "lucide-react";
import { AuthError, requestPasswordReset } from "@/lib/store/auth";
import { AuthSplitLayout } from "@/components/auth-split-layout";
import { CaptchaError, useTurnstile } from "@/components/turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPassword />
    </Suspense>
  );
}

/** Asks for an email and sends a reset link (if there's an account for it). */
function ForgotPassword() {
  const [email, setEmail] = useState(useSearchParams().get("email") ?? "");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const captcha = useTurnstile("password_reset");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const token = await captcha.getToken();
      await requestPasswordReset(email, token);
      setSentTo(email.trim());
    } catch (err) {
      setError(err instanceof AuthError || err instanceof CaptchaError ? err.message : "Something went wrong. Please try again.");
      if (!(err instanceof CaptchaError)) captcha.reset();
    }
    setSubmitting(false);
  }

  const backToSignIn = (
    <Link href="/login" className="font-semibold text-primary hover:underline">
      Back to sign in
    </Link>
  );

  if (sentTo) {
    return (
      <AuthSplitLayout title="Check your inbox" subtitle="We've sent you a link to reset your password" footer={backToSignIn}>
        <div className="flex flex-col items-center gap-3 text-center">
          <MailCheck className="h-10 w-10 text-primary" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">
            If there&apos;s a Private Wheels account for <span className="font-medium text-foreground">{sentTo}</span>,
            you&apos;ll get an email with a link to choose a new password. It can take a minute or two.
          </p>
          <p className="text-xs text-muted-foreground">Can&apos;t see it? Check your spam folder.</p>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a link to choose a new one"
      footer={backToSignIn}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {captcha.widget}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" disabled={submitting} className="mt-2 rounded-full bg-primary hover:bg-primary/90">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send reset link
        </Button>
      </form>
    </AuthSplitLayout>
  );
}
