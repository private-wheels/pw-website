"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MailCheck, UserPlus } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { AuthError } from "@/lib/store/auth";
import { AuthSplitLayout } from "@/components/auth-split-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Where new sellers land once signed in: the listing wizard, with a welcome note. */
const WELCOME_PATH = "/dashboard/listings/new?welcome=1";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const { needsConfirmation } = await register(email, password, WELCOME_PATH);
      if (needsConfirmation) {
        setConfirmationSentTo(email.trim());
        setSubmitting(false);
        return;
      }
      router.push(WELCOME_PATH);
      router.refresh();
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (confirmationSentTo) {
    return (
      <AuthSplitLayout
        title="Check your inbox"
        subtitle="One more step to activate your account"
        footer={
          <>
            Already confirmed?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </>
        }
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <MailCheck className="h-10 w-10 text-primary" strokeWidth={1.5} />
          <p className="text-sm">
            We&apos;ve sent a confirmation link to{" "}
            <span className="font-semibold">{confirmationSentTo}</span>. Click it to activate
            your account and list your first car.
          </p>
          <p className="text-xs text-muted-foreground">
            Can&apos;t find it? Check your spam folder.
          </p>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout
      title="Create your account"
      subtitle="Join South Africa's trusted private vehicle marketplace"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            type="password"
            required
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="mt-2 rounded-full bg-primary hover:bg-primary/90"
        >
          <UserPlus className="h-4 w-4" />
          Create Account
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By registering you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>
    </AuthSplitLayout>
  );
}
