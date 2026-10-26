"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { AuthError } from "@/lib/store/auth";
import { AuthSplitLayout } from "@/components/auth-split-layout";
import { useTurnstile } from "@/components/turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

/** Only same-site paths, so `?next=` can't send people to another host. */
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "confirm"
      ? "That confirmation link is invalid or has expired. Try signing in, or register again."
      : null,
  );
  const [submitting, setSubmitting] = useState(false);
  const captcha = useTurnstile("login");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password, captcha.token);
      router.push(safeNext(searchParams.get("next")));
      router.refresh();
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
      captcha.reset();
    }
  }

  return (
    <AuthSplitLayout
      title="Welcome back"
      subtitle="Sign in to your Private Wheels account"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Create one
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <span className="text-xs text-muted-foreground">Forgot password?</span>
          </div>
          <Input
            id="password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {captcha.widget}
        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          size="lg"
          disabled={submitting || !captcha.ready}
          className="mt-2 rounded-full bg-primary hover:bg-primary/90"
        >
          <LogIn className="h-4 w-4" />
          Sign In
        </Button>
      </form>
    </AuthSplitLayout>
  );
}
